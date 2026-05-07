# ISHS 포인트 승부예측

학교 체육대회 전용 **가상 포인트 승부예측 랭킹 사이트**입니다. 포인트는 사이트 내부 랭킹용이며 금전적 가치가 없습니다.

> 본 서비스의 포인트는 교내 이벤트 참여와 랭킹 표시를 위한 가상 포인트이며, 현금·현물·상품권·외부 재화와 교환하거나 거래할 수 없다.

## 주요 기능

- 리로스쿨 본인인증 어댑터 구조 + 현재 `mockRiroAuth` 제공
- 회원가입/로그인, bcrypt 비밀번호 해시, httpOnly JWT 세션
- 경기 생성/수정/오픈/마감/결과 입력/정산/취소 환불 관리자 기능
- 경기별 선택지 풀, 참여자 수, 퍼센트, 실시간 가상 배당 표시
- 예측 참여, 마감 전 1회 수정 설정, 즉시 포인트 차감과 PointLedger 기록
- 중복 정산 방지(`settledAt`)와 반올림 오차 조정 정산
- 닉네임 공개 랭킹, 내 정보/포인트 변동 내역
- 모바일 우선 다크 네온 UI, Framer Motion 애니메이션, 하단 탭바

## 파일 구조

```text
app/                    Next.js App Router 페이지와 Route Handler
  api/                  인증, 경기, 예측, 랭킹, 관리자 API
  admin/                관리자 화면
  matches/              경기 목록/상세 예측 화면
components/             공통 UI, 예측 폼, 랭킹, 관리자 폼
lib/                    세션, Prisma, 리로 인증 어댑터, 배당/정산/환불 로직
prisma/                 Prisma SQLite schema, seed
__tests__/              배당/정산 단위 테스트
```

## 설치

```bash
npm install
cp .env.example .env
```

`.env` 예시:

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="32자-이상의-랜덤-문자열로-교체"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
ALLOW_PREDICTION_REVISION="true"
MAX_PREDICTION_REVISIONS="1"
INITIAL_POINTS="1000"
```

## SQLite DB 준비

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

기본 DB는 SQLite입니다. `DATABASE_URL="file:./dev.db"`는 `prisma/schema.prisma` 기준으로 `prisma/dev.db`를 생성하며, 해당 DB 파일은 git에 커밋하지 않습니다.

## 샘플 계정

Seed 실행 후:

- 관리자: `admin` / `Admin1234!`
- 학생: `student1` ~ `student10` / `Password123!`

리로스쿨 mock 인증은 4자 이상 비밀번호면 통과합니다. ID가 `admin`으로 시작하면 관리자 권한으로 가입됩니다.

## 검증 명령어

```bash
npm run typecheck
npm run test
npm run build
```

## 보안/운영 메모

- 리로스쿨 ID/PW는 저장하지 않습니다. `lib/riro/auth-adapter.ts`의 `riroAuthAdapter`만 실제 API 또는 ISHS_Wiki의 `check_riro_login` 방식으로 교체하세요.
- 포인트 차감, 정산, 환불은 서버 트랜잭션에서 처리하며 클라이언트가 보낸 배당/포인트 계산을 신뢰하지 않습니다.
- 예측 API는 메모리 기반 rate limit을 포함합니다. 운영 배포에서는 Redis/KV 기반 rate limit으로 교체하는 것을 권장합니다.
- 현금성 보상, 상품 교환, 외부 결제, 포인트 양도/송금/거래 기능은 포함하지 않았고 추가하지 않아야 합니다.
