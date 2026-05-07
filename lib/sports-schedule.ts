export const SPORTS_FESTIVAL_DATE = '2026-05-07';

export type SportsFestivalSportType = 'SOCCER' | 'DODGEBALL' | 'RELAY';

export type SportsFestivalMatch = {
  title: string;
  sportType: SportsFestivalSportType;
  description: string;
  options: string[];
  startsAt: Date;
  locksAt: Date;
};

function kstDate(time: string) {
  return new Date(`${SPORTS_FESTIVAL_DATE}T${time}:00+09:00`);
}

function matchTime(time: string) {
  const startsAt = kstDate(time);
  return {
    startsAt,
    locksAt: new Date(startsAt.getTime() - 10 * 60 * 1000)
  };
}

export const sportsFestivalMatches: SportsFestivalMatch[] = [
  {
    title: '축구 3-4위전 1학년: 1반 vs 3반',
    sportType: 'SOCCER',
    description: 'PDF 일정표 4번. 1학년 1반:3반, 09:30~10:10(1).',
    options: ['1학년 1반', '1학년 3반'],
    ...matchTime('09:30')
  },
  {
    title: '축구 3-4위전 2학년: 1반 vs 4반',
    sportType: 'SOCCER',
    description: 'PDF 일정표 4번. 2학년 1반:4반, 10:10~10:50(2).',
    options: ['2학년 1반', '2학년 4반'],
    ...matchTime('10:10')
  },
  {
    title: '여학생 연합피구 1학년: 1+3반 vs 2+4반',
    sportType: 'DODGEBALL',
    description: 'PDF 일정표 5번. 1학년 1+3반:2+4반, 10:50~11:10(1). 예선 표기: 1학년 2:1/4:3.',
    options: ['1학년 1+3반', '1학년 2+4반'],
    ...matchTime('10:50')
  },
  {
    title: '여학생 연합피구 2학년: 2+3반 vs 1+4반',
    sportType: 'DODGEBALL',
    description: 'PDF 일정표 5번. 2학년 2+3반:1+4반, 11:10~11:30(2). 예선 표기: 2학년 2:4/3:1.',
    options: ['2학년 2+3반', '2학년 1+4반'],
    ...matchTime('11:10')
  },
  {
    title: '축구 1-2위전 1학년: 2반 vs 4반',
    sportType: 'SOCCER',
    description: 'PDF 일정표 9번. 1학년 2반:4반, 13:15~13:55(1).',
    options: ['1학년 2반', '1학년 4반'],
    ...matchTime('13:15')
  },
  {
    title: '축구 1-2위전 2학년: 2반 vs 3반',
    sportType: 'SOCCER',
    description: 'PDF 일정표 9번. 2학년 2반:3반, 13:55~14:35(2).',
    options: ['2학년 2반', '2학년 3반'],
    ...matchTime('13:55')
  },
  {
    title: '계주 우승반: 1반 vs 2반 vs 3반 vs 4반',
    sportType: 'RELAY',
    description: 'PDF 일정표 10번. 이어달리기 14:35~15:40. 1반~4반 중 계주 우승반 하나를 선택합니다.',
    options: ['1반', '2반', '3반', '4반'],
    ...matchTime('14:35')
  }
];
