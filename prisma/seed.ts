import bcrypt from 'bcryptjs';
import { PrismaClient, SportType } from '@prisma/client';
import { INITIAL_POINTS, OPTION_COLORS } from '../lib/constants';
import { sportsFestivalMatches } from '../lib/sports-schedule';

const prisma = new PrismaClient();

type SeedMatch = {
  title: string;
  sportType: SportType;
  description: string;
  options: string[];
  startsAt: Date;
  locksAt: Date;
};

const matches: SeedMatch[] = sportsFestivalMatches.map((match) => ({
  ...match,
  sportType: match.sportType as SportType,
  options: [...match.options]
}));

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
      include: { options: true }
    }));
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
