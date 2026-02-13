/**
 * 정비항목 마스터 데이터 (160개 표준 항목)
 * bluehands_jobs_normalized_v4.csv 기반
 */

export interface MasterJobItem {
  jobId: string;
  name: string;      // job_name_norm
  system: string;    // system_type
  workType: string;  // work_type
}

export const JOB_MASTER_LIST: MasterJobItem[] = [
  { jobId: 'BH_0001', name: '워터 펌프 어셈블리 및 가스켓 (텐션조정포함)', system: 'ENGINE', workType: 'ADJUST' },
  { jobId: 'BH_0002', name: '라디에이터 어셈블리', system: 'ENGINE', workType: 'REPLACE' },
  { jobId: 'BH_0003', name: '블로워 어셈블리', system: 'HVAC', workType: 'REPLACE' },
  { jobId: 'BH_0004', name: '라디에이터 상부 호스', system: 'ENGINE', workType: 'REPLACE' },
  { jobId: 'BH_0005', name: '라디에이터 하부 호스', system: 'ENGINE', workType: 'REPLACE' },
  { jobId: 'BH_0006', name: '리어 머플러 어셈블리 (LH)', system: 'EXHAUST', workType: 'REPLACE' },
  { jobId: 'BH_0007', name: '엔진 언더 커버 (LH OR 한개)', system: 'ENGINE', workType: 'REPLACE' },
  { jobId: 'BH_0008', name: '프론트 머드 가드', system: 'BODY', workType: 'REPLACE' },
  { jobId: 'BH_0009', name: '연료 탱크 어셈블리', system: 'FUEL', workType: 'REPLACE' },
  { jobId: 'BH_0010', name: '스로틀 바디 카본 청소', system: 'ENGINE', workType: 'CLEANING' },
  { jobId: 'BH_0011', name: '클러치 릴리스 실린더 어셈블리', system: 'TRANSMISSION', workType: 'REPLACE' },
  { jobId: 'BH_0012', name: '파워 스티어링 오일 펌프 어셈블리', system: 'STEERING', workType: 'REPLACE' },
  { jobId: 'BH_0013', name: '파워 스티어링 오일 압력 호스 어셈블리', system: 'STEERING', workType: 'REPLACE' },
  { jobId: 'BH_0014', name: '파워 스티어링 기어 및 링키지 어셈블리', system: 'STEERING', workType: 'REPLACE' },
  { jobId: 'BH_0015', name: '파워 스티어링 및 링키지 (크로스멤버 탈착후)', system: 'STEERING', workType: 'REMOVE_INSTALL' },
  { jobId: 'BH_0016', name: '라디에이터 및 콘덴서', system: 'ENGINE', workType: 'REPLACE' },
  { jobId: 'BH_0017', name: '라디에이터 그릴 어셈블리', system: 'ENGINE', workType: 'REPLACE' },
  { jobId: 'BH_0018', name: '프런트 휠 가드 어셈블리 (양쪽)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0019', name: '백 패널 몰딩 어셈블리', system: 'BODY', workType: 'REPLACE' },
  { jobId: 'BH_0020', name: '아웃사이드 리어 뷰미러어셈블리 (LH)', system: 'BODY', workType: 'REPLACE' },
  { jobId: 'BH_0021', name: '아웃사이드 리어 뷰미러어셈블리 (RH)', system: 'BODY', workType: 'REPLACE' },
  { jobId: 'BH_0022', name: '아웃사이드 리어 뷰 리모트 컨트롤 미러 어셈블리', system: 'BODY', workType: 'REPLACE' },
  { jobId: 'BH_0023', name: '아웃사이드 리어 뷰 리모트 컨트롤 미러 (RH)', system: 'BODY', workType: 'REPLACE' },
  { jobId: 'BH_0024', name: '아웃사이드 리어 뷰 미러 및 홀더 어셈블리 (LH)', system: 'BODY', workType: 'REPLACE' },
  { jobId: 'BH_0025', name: '아웃사이드 리어 뷰 미러 및 홀더 어셈블리 (RH)', system: 'BODY', workType: 'REPLACE' },
  { jobId: 'BH_0026', name: '헤드 램프 어셈블리 (LH)', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0027', name: '헤드 램프 어셈블리 (양쪽)', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0028', name: '헤드 램프 어셈블리 (RH)', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0029', name: '프론트 포그 램프어셈블리 (LH)', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0030', name: '프론트 포그 램프 어셈블리 (양쪽)', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0031', name: '프론트 포그 램프어셈블리 (RH)', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0032', name: '리어 콤비네이션램프어셈블리 (LH)', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0033', name: '리어 콤비네이션 램프 어셈블리 (양쪽)', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0034', name: '리어 콤비네이션램프어셈블리 (RH)', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0035', name: '리어 콤비네이션램프어셈블리 (LH)', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0036', name: '리어 콤비네이션 인사이드 램프 어셈블리 (양쪽)', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0037', name: '리어 콤비네이션아웃사이드램프어셈블리 (RH)', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0038', name: '클락 스프링 어셈블리 (에어백 포함)', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0039', name: '스톱 램프 스위치 어셈블리', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0040', name: '밧데리-트랜스미터', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0041', name: 'PIC TX 어셈블리', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0042', name: '에어백 컨트롤 모듈', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0043', name: '혼 어셈블리 (LH)', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0044', name: '콘덴서 어셈블리 (**)', system: 'HVAC', workType: 'REPLACE' },
  { jobId: 'BH_0045', name: '컴프레셔 어셈블리 (**)', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0046', name: '디스차지 호스 및 O-링 (**)', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0047', name: '윈드실드 와셔 모터 및 펌프 어셈블리', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0048', name: '윈드실드 와셔 리저버 어셈블리', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0049', name: '리어 쇼크 업소버 어셈블리 (LH)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0050', name: '리어 쇼크 업소버 어셈블리 (RH)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0051', name: '에어컨 배출 및 충전', system: 'HVAC', workType: 'REFILL' },
  { jobId: 'BH_0052', name: '에어컨 가스 충전 (신냉매, 완충)', system: 'HVAC', workType: 'REFILL' },
  { jobId: 'BH_0053', name: '수동 변속기 오일', system: 'TRANSMISSION', workType: 'REPLACE' },
  { jobId: 'BH_0054', name: '전구', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0055', name: '해드 램프 벌브 (한쪽)', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0056', name: '스파크 플러그 어셈블리 (전체)', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0057', name: '엔진 오일 / 필터', system: 'ENGINE', workType: 'REPLACE' },
  { jobId: 'BH_0058', name: '엔진 오일 / 필터 / 에어 클리너', system: 'ENGINE', workType: 'REPLACE' },
  { jobId: 'BH_0059', name: '부동액 (냉각수)', system: 'ENGINE', workType: 'REPLACE' },
  { jobId: 'BH_0060', name: '에어 클리너 필터', system: 'ENGINE', workType: 'REPLACE' },
  { jobId: 'BH_0061', name: 'LPI 필터', system: 'FUEL', workType: 'REPLACE' },
  { jobId: 'BH_0062', name: '배터리 어셈블리', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0063', name: '오토 트랜스액슬 오일', system: 'ELECTRICAL', workType: 'REPLACE' },
  { jobId: 'BH_0064', name: '오토미션 오일 (장비 사용)', system: 'TRANSMISSION', workType: 'REPLACE' },
  { jobId: 'BH_0065', name: '프론트 브레이크 디스크 (LH)', system: 'BRAKE', workType: 'REPLACE' },
  { jobId: 'BH_0066', name: '프론트 브레이크 디스크 (양쪽)', system: 'BRAKE', workType: 'REPLACE' },
  { jobId: 'BH_0067', name: '프론트 브레이크 디스크 (RH)', system: 'BRAKE', workType: 'REPLACE' },
  { jobId: 'BH_0068', name: '파워 스티어링 오일 및 공기빼기', system: 'STEERING', workType: 'REPLACE' },
  { jobId: 'BH_0069', name: '파워 스티어링 오일 (장비사용)', system: 'STEERING', workType: 'REPLACE' },
  { jobId: 'BH_0070', name: '프론트 디스크 브레이크 패드 키트 (LH)', system: 'BRAKE', workType: 'REPLACE' },
  { jobId: 'BH_0071', name: '프론트 디스크 브레이크 패드 키트 (양쪽)', system: 'BRAKE', workType: 'REPLACE' },
  { jobId: 'BH_0072', name: '리어 디스크 브레이크 패드 어셈블리 (양쪽)', system: 'BRAKE', workType: 'REPLACE' },
  { jobId: 'BH_0073', name: '브레이크 오일 및 공기 빼기', system: 'BRAKE', workType: 'REPLACE' },
  { jobId: 'BH_0074', name: '에어컨 필터', system: 'HVAC', workType: 'REPLACE' },
  { jobId: 'BH_0075', name: '연료 필러 도어 어셈블리', system: 'FUEL', workType: 'REPLACE' },
  { jobId: 'BH_0076', name: '휠 밸런스 (2휠)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0077', name: '휠 얼라인먼트 조정 (2휠)', system: 'SUSPENSION', workType: 'ADJUST' },
  { jobId: 'BH_0078', name: '휠 얼라인먼트 조정 (4휠)', system: 'SUSPENSION', workType: 'ADJUST' },
  { jobId: 'BH_0079', name: '휠 얼라인먼트 인스펙션', system: 'SUSPENSION', workType: 'INSPECTION' },
  { jobId: 'BH_0080', name: '타이어 펑크 수리', system: 'SUSPENSION', workType: 'REPAIR' },
  { jobId: 'BH_0081', name: '타이어 및 휠 어셈블리 (1휠)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0082', name: '타이어 어셈블리 및 휠 어셈블리 (2휠)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0083', name: '후드 래취 어셈블리', system: 'BODY', workType: 'REPLACE' },
  { jobId: 'BH_0084', name: '프론트 도어 래취 어셈블리 (LH)', system: 'BODY', workType: 'REPLACE' },
  { jobId: 'BH_0085', name: '프론트 도어 인사이드 핸들 어셈블리', system: 'BODY', workType: 'REPLACE' },
  { jobId: 'BH_0086', name: '프론트 도어 아웃트사이드 핸들 어셈블리 (양쪽)', system: 'BODY', workType: 'REPLACE' },
  { jobId: 'BH_0087', name: '리어 도어 아웃사이드 핸들 어셈블리', system: 'BODY', workType: 'REPLACE' },
  { jobId: 'BH_0088', name: '메인 크래쉬 패드 어셈블리', system: 'BODY', workType: 'REPLACE' },
  { jobId: 'BH_0089', name: '리어 패키지 트레이 트림 어셈블리', system: 'BODY', workType: 'REPLACE' },
  { jobId: 'BH_0090', name: '리어 트랜스버스 트림 어셈블리', system: 'BODY', workType: 'REPLACE' },
  { jobId: 'BH_0091', name: '카울 탑 커버 및 패드 어셈블리', system: 'BODY', workType: 'REPLACE' },
  { jobId: 'BH_0092', name: '프론트 액슬 너클 (LH)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0093', name: '프론트 액슬 너클 (양쪽)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0094', name: '프론트 액슬 너클 (RH)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0095', name: '로워 암 어셈블리 (LH)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0096', name: '로워 암 어셈블리 (양쪽)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0097', name: '로워 암 어셈블리 (RH)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0098', name: '스트러트 인슐레이터 어셈블리 (LH)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0099', name: '스트러트 인슐레이터 어셈블리 (RH)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0100', name: '스트러트 어셈블리', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0101', name: '스트러트 어셈블리 (양쪽)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0102', name: '스트러트 어셈블리 (RH, 프론트쇽업소버)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0103', name: '스테이빌라이저 바', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0104', name: '스테이빌라이저 바 부싱 (양쪽)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0105', name: '스테이빌라이저 링크 어셈블리 (LH)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0106', name: '스테이빌라이저 링크 어셈블리 (양쪽)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0107', name: '스테이빌라이저 링크 어셈블리 (RH)', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0108', name: '리어 크로스멤버 컴플리트', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0109', name: '크로스멤버 어셈블리', system: 'SUSPENSION', workType: 'REPLACE' },
  { jobId: 'BH_0110', name: '크로스멤버 어셈블리 (엔진미장착상태)', system: 'ENGINE', workType: 'REPLACE' },
  { jobId: 'BH_0111', name: '프론트 범퍼 오버홀', system: 'BODY', workType: 'OVERHAUL' },
  { jobId: 'BH_0112', name: '휀더 패널 어셈블리 (LH, 범퍼탈부착미포함)', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0113', name: '쿼터 외측 패널 어셈블리 (RH, 탈부착 미포함)', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0114', name: '라디에이터 서포트 패널 어셈블리 (범퍼, 라디에이터, 콘덴셔 미포함)', system: 'ENGINE', workType: 'REPAIR' },
  { jobId: 'BH_0115', name: '후드 판넬 어셈블리', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0116', name: '크로스멤버 어셈블리', system: 'SUSPENSION', workType: 'REPAIR' },
  { jobId: 'BH_0117', name: '엔진 어셈블리 (탈부착)', system: 'ENGINE', workType: 'REPAIR' },
  { jobId: 'BH_0118', name: '루프 패널 (탈부착 미포함)', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0119', name: '선루프 어셈블리', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0120', name: '헤드라이닝 어셈블리', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0121', name: '테일게이트 판넬 어셈블리', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0122', name: '트렁크 리드 패널 (사상작업포함)', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0123', name: '프론트 도어판넬어셈블리 (LH)', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0124', name: '프론트 도어판넬어셈블리 (RH)', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0125', name: '리어 도어판넬어셈블리 (LH)', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0126', name: '리어 도어판넬어셈블리 (RH)', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0127', name: '프론트 도어 아웃사이드 핸들 어셈블리 (LH)', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0128', name: '아웃사이드 리어 뷰 리모트 컨트롤 미러 어셈블리', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0129', name: '센터 외측 필라 어셈블리 (LH, 탈부착미포함)', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0130', name: '센터 외측 필라 어셈블리 (RH, 탈부착미포함)', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0131', name: '메인 크래쉬 패드 어셈블리', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0132', name: '리어 범퍼 어셈블리 (오버홀)', system: 'BODY', workType: 'OVERHAUL' },
  { jobId: 'BH_0133', name: '백 패널 (탈부착 미포함)', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0134', name: '사이드실 내측 패널 (LH, 탈부착 미포함)', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0135', name: '사이드실 내측 패널 (RH, 탈부착 미포함)', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0136', name: '사이드실 외측 패널 (LH, 탈부착미포함)', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0137', name: '사이드실 외측 패널 (RH, 탈부착미포함)', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0138', name: '프론트 필라 외측 패널 어셈블리 (LH)', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0139', name: '프론트 필라 외측 패널 어셈블리 (RH)', system: 'BODY', workType: 'REPAIR' },
  { jobId: 'BH_0140', name: '프론트 범퍼 도장（탈거된상태)', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0141', name: '휀더 패널 도장 (LH)', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0142', name: '쿼터 외측 패널도장 (LH)', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0143', name: '후드 패널 도장', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0144', name: '루프 패널 도장', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0145', name: '루프 사이드 외측 패널도장 (LH)', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0146', name: '테일 게이트 패널 도장', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0147', name: '트렁크 리드 패널 도장 (판금후)', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0148', name: '프론트 도어 패널 어셈블리도장 (LH/탈거된상태）', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0149', name: '프론트 도어 패널 어셈블리도장 (RH/탈거된상태)', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0150', name: '리어 도어패널도장 (LH)', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0151', name: '리어 도어패널도장 (RH)', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0152', name: '아웃사이드 리어 뷰 미러 도장 (LH, 탈거된상태)', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0153', name: '프론트 필라 외측 패널 어셈블리도장 (LH)', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0154', name: '프론트 필라 외측 패널 어셈블리 도장 (RH)', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0155', name: '센터 외측 필라 어셈블리도장 (LH, 판금후)', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0156', name: '센터 외측 필라 어셈블리도장 (RH, 판금후)', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0157', name: '리어 범퍼 도장 (탈거된 상태)', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0158', name: '백 패널 도장 (판금후)', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0159', name: '사이드실 외측 패널도장 (LH)', system: 'BODY', workType: 'PAINT' },
  { jobId: 'BH_0160', name: '사이드실 외측 패널도장 (RH)', system: 'BODY', workType: 'PAINT' },
];

// job_id → MasterJobItem 빠른 조회용 Map
const JOB_MASTER_MAP = new Map(JOB_MASTER_LIST.map(item => [item.jobId, item]));

/** job_id로 마스터 항목 조회 */
export function getJobMasterById(jobId: string): MasterJobItem | undefined {
  return JOB_MASTER_MAP.get(jobId);
}

/** GPT 프롬프트용 마스터 목록 텍스트 생성 */
export function getJobMasterPromptText(): string {
  return JOB_MASTER_LIST.map(item => `${item.jobId}: ${item.name}`).join('\n');
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()]/g, '')
    .replace(/[\/\-]/g, '')
    .replace(/lh|rh/gi, '')
    .replace(/양쪽/g, '');
}

/** 이름 기반으로 가장 유사한 마스터 항목 1건 조회 (간단 폴백용) */
export function findMasterJobByName(name?: string): MasterJobItem | undefined {
  if (!name) return undefined;
  const target = normalizeForMatch(name);
  if (!target) return undefined;

  const exact = JOB_MASTER_LIST.find((item) => normalizeForMatch(item.name) === target);
  if (exact) return exact;

  return JOB_MASTER_LIST.find((item) => {
    const norm = normalizeForMatch(item.name);
    return target.includes(norm) || norm.includes(target);
  });
}
