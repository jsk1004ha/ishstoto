import { Prisma, PredictionStatus } from '@prisma/client';
import { ALLOW_PREDICTION_REVISION, MAX_PREDICTION_REVISIONS, MIN_BET_POINTS } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

export type PoolPrediction = {
  userId: string;
  optionId: string;
  points: number;
  status?: PredictionStatus | string;
};

export type PoolOption = {
  id: string;
  label: string;
  color?: string | null;
  sortOrder?: number;
};

export type OptionPool = PoolOption & {
  points: number;
  participants: number;
  percentage: number;
  odds: number | null;
};

const POOL_STATUSES = new Set(['ACTIVE', 'WON', 'LOST']);

export function calculateOdds(totalPoints: number, optionPoints: number) {
  if (totalPoints <= 0 || optionPoints <= 0) return null;
  return Number((totalPoints / optionPoints).toFixed(2));
}

export function computePools(options: PoolOption[], predictions: PoolPrediction[]) {
  const eligible = predictions.filter((p) => !p.status || POOL_STATUSES.has(String(p.status)));
  const totalPoints = eligible.reduce((sum, p) => sum + p.points, 0);
  const byOption = new Map<string, { points: number; users: Set<string> }>();

  for (const option of options) byOption.set(option.id, { points: 0, users: new Set() });
  for (const prediction of eligible) {
    const bucket = byOption.get(prediction.optionId);
    if (!bucket) continue;
    bucket.points += prediction.points;
    bucket.users.add(prediction.userId);
  }

  const optionPools = options
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((option) => {
      const bucket = byOption.get(option.id) ?? { points: 0, users: new Set<string>() };
      return {
        ...option,
        points: bucket.points,
        participants: bucket.users.size,
        percentage: totalPoints > 0 ? Math.round((bucket.points / totalPoints) * 1000) / 10 : 0,
        odds: calculateOdds(totalPoints, bucket.points)
      };
    });

  return {
    totalPoints,
    totalParticipants: new Set(eligible.map((p) => p.userId)).size,
    optionPools
  };
}

export type PayoutInput = { id: string; userId: string; points: number };
export type PayoutResult = PayoutInput & { payout: number };

export function allocatePayouts(winners: PayoutInput[], totalPool: number, winningPool: number): PayoutResult[] {
  if (winners.length === 0 || totalPool <= 0 || winningPool <= 0) return winners.map((winner) => ({ ...winner, payout: 0 }));

  const exact = winners.map((winner) => {
    const raw = (winner.points * totalPool) / winningPool;
    const floor = Math.floor(raw);
    return { ...winner, floor, remainder: raw - floor };
  });

  const floorTotal = exact.reduce((sum, item) => sum + item.floor, 0);
  let remainderPoints = Math.max(0, totalPool - floorTotal);
  const sorted = exact.slice().sort((a, b) => b.remainder - a.remainder || b.points - a.points || a.id.localeCompare(b.id));
  const bonus = new Set<string>();
  for (const item of sorted) {
    if (remainderPoints <= 0) break;
    bonus.add(item.id);
    remainderPoints -= 1;
  }

  return exact.map((item) => ({
    id: item.id,
    userId: item.userId,
    points: item.points,
    payout: item.floor + (bonus.has(item.id) ? 1 : 0)
  }));
}

export function assertBetPoints(points: number, balance: number) {
  if (!Number.isInteger(points) || points < MIN_BET_POINTS) throw new Error(`PUBLIC:예측 포인트는 최소 ${MIN_BET_POINTS}점입니다.`);
  if (points > balance) throw new Error('PUBLIC:보유 포인트보다 많이 예측할 수 없습니다.');
}

export async function placePrediction(userId: string, matchId: string, optionId: string, points: number) {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const match = await tx.match.findUnique({
      where: { id: matchId },
      include: { options: true, predictions: { where: { status: { in: ['ACTIVE', 'WON', 'LOST'] } } } }
    });
    if (!match) throw new Error('PUBLIC:경기를 찾을 수 없습니다.');
    if (match.status !== 'OPEN') throw new Error('PUBLIC:예측이 열려 있는 경기만 참여할 수 있습니다.');
    if (match.locksAt <= now) throw new Error('PUBLIC:예측 마감 시간이 지나 참여할 수 없습니다.');
    if (!match.options.some((option) => option.id === optionId)) throw new Error('PUBLIC:올바르지 않은 선택지입니다.');

    const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true, points: true, role: true } });
    if (!user || user.role === 'BANNED') throw new Error('PUBLIC:참여할 수 없는 계정입니다.');

    const existing = await tx.prediction.findUnique({ where: { userId_matchId: { userId, matchId } } });
    let availableBalance = user.points;
    let livePredictions = match.predictions.map((prediction) => ({
      id: prediction.id,
      userId: prediction.userId,
      optionId: prediction.optionId,
      points: prediction.points,
      status: prediction.status
    }));

    if (existing && existing.status !== 'REFUNDED') {
      if (!ALLOW_PREDICTION_REVISION || existing.revisionCount >= MAX_PREDICTION_REVISIONS || match.status !== 'OPEN') {
        throw new Error('PUBLIC:이 경기는 이미 예측했으며 수정 가능 횟수를 사용했습니다.');
      }
      availableBalance += existing.points;
      livePredictions = livePredictions.filter((prediction) => prediction.id !== existing.id);
      const refunded = await tx.user.update({ where: { id: userId }, data: { points: { increment: existing.points } }, select: { points: true } });
      await tx.pointLedger.create({
        data: {
          userId,
          type: 'BET_REFUND',
          amount: existing.points,
          balanceAfter: refunded.points,
          reason: '마감 전 예측 수정으로 기존 예측 환불',
          matchId
        }
      });
    }

    assertBetPoints(points, availableBalance);

    const debited = await tx.user.updateMany({
      where: { id: userId, points: { gte: points }, role: { not: 'BANNED' } },
      data: { points: { decrement: points } }
    });
    if (debited.count !== 1) throw new Error('PUBLIC:포인트 잔액이 부족합니다. 다시 시도해 주세요.');

    const balance = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { points: true } });
    const hypothetical = [...livePredictions, { userId, optionId, points, status: 'ACTIVE' }];
    const pools = computePools(match.options, hypothetical);
    const odds = pools.optionPools.find((option) => option.id === optionId)?.odds ?? 1;

    const prediction = existing && existing.status !== 'REFUNDED'
      ? await tx.prediction.update({
          where: { id: existing.id },
          data: {
            optionId,
            points,
            oddsAtBet: new Prisma.Decimal(odds),
            status: 'ACTIVE',
            revisionCount: { increment: 1 }
          }
        })
      : await tx.prediction.create({
          data: {
            userId,
            matchId,
            optionId,
            points,
            oddsAtBet: new Prisma.Decimal(odds),
            status: 'ACTIVE'
          }
        });

    await tx.pointLedger.create({
      data: {
        userId,
        type: 'BET_PLACED',
        amount: -points,
        balanceAfter: balance.points,
        reason: existing ? '예측 수정 후 포인트 사용' : '경기 예측 참여',
        matchId
      }
    });

    return { prediction, balanceAfter: balance.points, oddsAtBet: odds };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function settleMatch(matchId: string, actorId?: string) {
  return prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id: matchId },
      include: { predictions: { where: { status: 'ACTIVE' } }, options: true }
    });
    if (!match) throw new Error('PUBLIC:경기를 찾을 수 없습니다.');
    if (match.status === 'CANCELLED') throw new Error('PUBLIC:취소된 경기는 정산할 수 없습니다.');
    if (match.settledAt) return { alreadySettled: true, paidUsers: 0, totalPaid: 0 };
    if (!match.resultOptionId) throw new Error('PUBLIC:결과 선택지를 먼저 입력해 주세요.');

    const totalPool = match.predictions.reduce((sum, prediction) => sum + prediction.points, 0);
    const winners = match.predictions.filter((prediction) => prediction.optionId === match.resultOptionId);
    const losers = match.predictions.filter((prediction) => prediction.optionId !== match.resultOptionId);
    const winningPool = winners.reduce((sum, prediction) => sum + prediction.points, 0);
    const payouts = allocatePayouts(winners, totalPool, winningPool);

    for (const loser of losers) {
      await tx.prediction.update({ where: { id: loser.id }, data: { status: 'LOST' } });
    }

    for (const payout of payouts) {
      await tx.prediction.update({ where: { id: payout.id }, data: { status: 'WON' } });
      if (payout.payout > 0) {
        const updated = await tx.user.update({
          where: { id: payout.userId },
          data: { points: { increment: payout.payout } },
          select: { points: true }
        });
        await tx.pointLedger.create({
          data: {
            userId: payout.userId,
            type: 'BET_WON',
            amount: payout.payout,
            balanceAfter: updated.points,
            reason: '경기 결과 적중 정산',
            matchId
          }
        });
      }
    }

    await tx.match.update({
      where: { id: matchId },
      data: { status: 'RESULTED', settledAt: new Date() }
    });

    await tx.adminAuditLog.create({
      data: {
        actorId,
        action: 'MATCH_SETTLED',
        matchId,
        metadata: { totalPool, winningPool, paidUsers: payouts.length, totalPaid: payouts.reduce((sum, p) => sum + p.payout, 0) }
      }
    });

    return { alreadySettled: false, paidUsers: payouts.length, totalPaid: payouts.reduce((sum, p) => sum + p.payout, 0) };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function refundMatch(matchId: string, actorId?: string) {
  return prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({ where: { id: matchId }, include: { predictions: { where: { status: 'ACTIVE' } } } });
    if (!match) throw new Error('PUBLIC:경기를 찾을 수 없습니다.');
    if (match.settledAt) throw new Error('PUBLIC:이미 정산된 경기는 취소 환불할 수 없습니다.');

    let refundedUsers = 0;
    let refundedPoints = 0;
    for (const prediction of match.predictions) {
      await tx.prediction.update({ where: { id: prediction.id }, data: { status: 'REFUNDED' } });
      const updated = await tx.user.update({
        where: { id: prediction.userId },
        data: { points: { increment: prediction.points } },
        select: { points: true }
      });
      await tx.pointLedger.create({
        data: {
          userId: prediction.userId,
          type: 'BET_REFUND',
          amount: prediction.points,
          balanceAfter: updated.points,
          reason: '경기 취소로 예측 포인트 환불',
          matchId
        }
      });
      refundedUsers += 1;
      refundedPoints += prediction.points;
    }

    await tx.match.update({ where: { id: matchId }, data: { status: 'CANCELLED' } });
    await tx.adminAuditLog.create({
      data: {
        actorId,
        action: 'MATCH_CANCELLED',
        matchId,
        metadata: { refundedUsers, refundedPoints }
      }
    });

    return { refundedUsers, refundedPoints };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
