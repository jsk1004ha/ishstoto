export const POINT_DISCLAIMER =
  '본 서비스의 포인트는 교내 이벤트 참여와 랭킹 표시를 위한 가상 포인트이며, 현금·현물·상품권·외부 재화와 교환하거나 거래할 수 없다.';

export const INITIAL_POINTS = Number(process.env.INITIAL_POINTS ?? 1000);
export const MIN_BET_POINTS = 10;
export const QUICK_BET_POINTS = [10, 50, 100, 250, 500] as const;
export const ALLOW_PREDICTION_REVISION = process.env.ALLOW_PREDICTION_REVISION !== 'false';
export const MAX_PREDICTION_REVISIONS = Number(process.env.MAX_PREDICTION_REVISIONS ?? 1);

export const SPORT_LABEL: Record<string, string> = {
  SOCCER: '축구',
  RELAY: '계주',
  TUG_OF_WAR: '줄다리기',
  BASKETBALL: '농구',
  JUMP_ROPE: '줄넘기'
};

export const SPORT_ICON: Record<string, string> = {
  SOCCER: '⚽',
  RELAY: '🏃',
  TUG_OF_WAR: '🪢',
  BASKETBALL: '🏀',
  JUMP_ROPE: '✨'
};

export const STATUS_LABEL: Record<string, string> = {
  DRAFT: '준비중',
  OPEN: '예측 오픈',
  LOCKED: '마감',
  RESULTED: '결과 완료',
  CANCELLED: '취소'
};

export const OPTION_COLORS = ['#38bdf8', '#34f5c5', '#ff9f1c', '#fb5cff', '#a3e635', '#f472b6'];
