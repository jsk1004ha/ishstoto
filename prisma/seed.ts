import bcrypt from 'bcryptjs';
import { Prisma, PrismaClient, SportType } from '@prisma/client';
import { INITIAL_POINTS, OPTION_COLORS } from '../lib/constants';

const prisma = new PrismaClient();

const now = new Date();
const hours = (value: number) => new Date(now.getTime() + value * 60 * 60 * 1000);

type SeedMatch = {
  title: string;
  sportType: SportType;
  description: string;
  options: string[];
  startsAt: Date;
  locksAt: Date;
};

const matches: SeedMatch[] = [
  { title: '축구 예선: 1반 vs 2반', sportType: 'SOCCER', description: '운동장 메인 경기. 응원 열기가 가장 뜨거운 축구 예선입니다.', options: ['1반', '2반'], startsAt: hours(8), locksAt: hours(7) },
  { title: '농구 결승: 3반 vs 4반', sportType: 'BASKETBALL', description: '체육관 코트를 달구는 농구 결승전입니다.', options: ['3반', '4반'], startsAt: hours(12), locksAt: hours(11) },
  { title: '줄다리기: 1반 vs 4반', sportType: 'TUG_OF_WAR', description: '단합력과 함성이 승부를 가르는 줄다리기 경기입니다.', options: ['1반', '4반'], startsAt: hours(16), locksAt: hours(15) },
  { title: '계주 결승', sportType: 'RELAY', description: '1반부터 4반까지 4반 경쟁 구조의 하이라이트 계주입니다.', options: ['1반', '2반', '3반', '4반'], startsAt: hours(20), locksAt: hours(19) },
  { title: '단체 줄넘기 챌린지', sportType: 'JUMP_ROPE', description: '2개 이상 팀이 참가 가능한 단체 줄넘기 기록 경쟁입니다.', options: ['1반', '2반', '3반', '4반'], startsAt: hours(24), locksAt: hours(23) }
];

const studentNicknames = ['번개응원단', '민트스프린터', '오렌지센터', '네온골잡이', '계주요정', '줄다리기왕', '농구도사', '파란함성', '승부예측러', '체육대장'];

async function main() {
  console.log('Resetting seed data...');
  await prisma.adminAuditLog.deleteMany();
  await prisma.pointLedger.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.matchOption.deleteMany();
  await prisma.match.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 12);
  const adminHash = await bcrypt.hash('Admin1234!', 12);

  const admin = await prisma.user.create({
    data: {
      loginId: 'admin',
      passwordHash: adminHash,
      nickname: '운영본부',
      realName: '관리자',
      studentNumber: '0000',
      generation: 0,
      role: 'ADMIN',
      points: INITIAL_POINTS
    }
  });
  await prisma.pointLedger.create({ data: { userId: admin.id, type: 'INITIAL_GRANT', amount: INITIAL_POINTS, balanceAfter: INITIAL_POINTS, reason: '관리자 초기 포인트' } });

  const users = [];
  for (let i = 0; i < studentNicknames.length; i++) {
    const user = await prisma.user.create({
      data: {
        loginId: `student${i + 1}`,
        passwordHash,
        nickname: studentNicknames[i],
        realName: `학생${i + 1}`,
        studentNumber: `26${String(i + 1).padStart(2, '0')}`,
        generation: 23,
        role: 'USER',
        points: INITIAL_POINTS
      }
    });
    await prisma.pointLedger.create({ data: { userId: user.id, type: 'INITIAL_GRANT', amount: INITIAL_POINTS, balanceAfter: INITIAL_POINTS, reason: '회원가입 초기 포인트 지급' } });
    users.push(user);
  }

  const createdMatches = [];
  for (const match of matches) {
    createdMatches.push(await prisma.match.create({
      data: {
        title: match.title,
        sportType: match.sportType,
        description: match.description,
        status: 'OPEN',
        startsAt: match.startsAt,
        locksAt: match.locksAt,
        createdBy: admin.id,
        options: {
          create: match.options.map((label, index) => ({ label, className: label, color: OPTION_COLORS[index % OPTION_COLORS.length], sortOrder: index }))
        }
      },
      include: { options: true, predictions: true }
    }));
  }

  const betAmounts = [120, 80, 200, 50, 150, 300, 90, 250, 110, 180];
  for (let matchIndex = 0; matchIndex < createdMatches.length; matchIndex++) {
    const match = createdMatches[matchIndex];
    const localPredictions: { userId: string; optionId: string; points: number; status: 'ACTIVE' }[] = [];
    for (let userIndex = 0; userIndex < users.length; userIndex++) {
      if ((userIndex + matchIndex) % 5 === 0) continue;
      const user = users[userIndex];
      const option = match.options[(userIndex + matchIndex) % match.options.length];
      const points = betAmounts[(userIndex + matchIndex) % betAmounts.length];
      const nextPredictions = [...localPredictions, { userId: user.id, optionId: option.id, points, status: 'ACTIVE' as const }];
      const total = nextPredictions.reduce((sum, prediction) => sum + prediction.points, 0);
      const optionTotal = nextPredictions.filter((prediction) => prediction.optionId === option.id).reduce((sum, prediction) => sum + prediction.points, 0);
      const odds = optionTotal > 0 ? Number((total / optionTotal).toFixed(2)) : 1;
      const updated = await prisma.user.update({ where: { id: user.id }, data: { points: { decrement: points } } });
      await prisma.prediction.create({ data: { userId: user.id, matchId: match.id, optionId: option.id, points, oddsAtBet: new Prisma.Decimal(odds), status: 'ACTIVE' } });
      await prisma.pointLedger.create({ data: { userId: user.id, type: 'BET_PLACED', amount: -points, balanceAfter: updated.points, reason: '시드 예측 참여', matchId: match.id } });
      localPredictions.push({ userId: user.id, optionId: option.id, points, status: 'ACTIVE' });
    }
  }

  await prisma.adminAuditLog.create({ data: { actorId: admin.id, action: 'MATCH_CREATED', metadata: { seed: true, matches: createdMatches.length } } });
  console.log('Seed complete');
  console.log('Admin login: admin / Admin1234!');
  console.log('Student login: student1 / Password123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
