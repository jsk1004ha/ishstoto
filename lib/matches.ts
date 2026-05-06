import { prisma } from '@/lib/prisma';
import { computePools } from '@/lib/betting';

export async function getRanking(userId?: string) {
  const users = await prisma.user.findMany({
    where: { role: { not: 'BANNED' } },
    select: {
      id: true,
      nickname: true,
      points: true,
      createdAt: true,
      predictions: { select: { status: true } }
    }
  });

  const ranked = users
    .map((user) => {
      const participated = user.predictions.filter((prediction) => prediction.status !== 'REFUNDED').length;
      const won = user.predictions.filter((prediction) => prediction.status === 'WON').length;
      const completed = user.predictions.filter((prediction) => prediction.status === 'WON' || prediction.status === 'LOST').length;
      return {
        id: user.id,
        nickname: user.nickname,
        points: user.points,
        participated,
        won,
        hitRate: completed > 0 ? Math.round((won / completed) * 1000) / 10 : 0,
        createdAt: user.createdAt
      };
    })
    .sort((a, b) => b.points - a.points || b.won - a.won || a.createdAt.getTime() - b.createdAt.getTime())
    .map((user, index) => ({ ...user, rank: index + 1 }));

  return {
    ranking: ranked,
    me: userId ? ranked.find((user) => user.id === userId) ?? null : null
  };
}

export async function getMatchSummaries(userId?: string) {
  const matches = await prisma.match.findMany({
    orderBy: [{ status: 'asc' }, { startsAt: 'asc' }],
    include: {
      options: { orderBy: { sortOrder: 'asc' } },
      predictions: { where: { status: { not: 'REFUNDED' } }, select: { userId: true, optionId: true, points: true, status: true } }
    }
  });

  return matches.map((match) => {
    const pools = computePools(match.options, match.predictions);
    const myPrediction = userId ? match.predictions.find((prediction) => prediction.userId === userId) ?? null : null;
    return {
      id: match.id,
      title: match.title,
      sportType: match.sportType,
      description: match.description,
      status: match.status,
      startsAt: match.startsAt,
      locksAt: match.locksAt,
      resultOptionId: match.resultOptionId,
      settledAt: match.settledAt,
      totalPoints: pools.totalPoints,
      totalParticipants: pools.totalParticipants,
      options: pools.optionPools,
      myPrediction
    };
  });
}

export async function getMatchDetail(id: string, userId?: string) {
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      options: { orderBy: { sortOrder: 'asc' } },
      predictions: {
        where: { status: { not: 'REFUNDED' } },
        include: { user: { select: { nickname: true } }, option: { select: { label: true } } },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  if (!match) return null;

  const pools = computePools(match.options, match.predictions);
  const myPrediction = userId ? match.predictions.find((prediction) => prediction.userId === userId) ?? null : null;

  return {
    ...match,
    totalPoints: pools.totalPoints,
    totalParticipants: pools.totalParticipants,
    optionPools: pools.optionPools,
    myPrediction
  };
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nickname: true,
      realName: true,
      studentNumber: true,
      generation: true,
      points: true,
      createdAt: true,
      ledgers: { orderBy: { createdAt: 'desc' }, take: 30, include: { match: { select: { title: true } } } },
      predictions: { orderBy: { createdAt: 'desc' }, include: { match: true, option: true } }
    }
  });
  return user;
}
