"""
미션 조회 — mission_id로부터 신뢰할 수 있는 메타데이터(소유자 user_id, 슬롯)를 가져온다.

BE B는 user_id/slot을 호출자(BE A)가 같이 보낸 값으로 신뢰하지 않는다.
mission_id는 BE A/C가 발급한 불투명 문자열일 뿐이고, "이 mission_id가 누구
것인지"는 BE C(missions/mission_clips)가 가진 사실이다. 그 사실을 호출자가
대신 알려주는 필드로 받으면, 그 필드가 잘못되거나(버그) 조작되면(내부 키
유출 등) 엉뚱한 사용자에게 클립이 귀속되거나 탈퇴 시 클립 정리가 조용히
빗나갈 수 있다 — 그래서 BE B가 직접 조회해서 확인한다.

이 함수는 MISSION-004(유효 시간대 검증, abuse_policy.py), MISSION-005(일일
호출 제한), withdrawal-cleanup 연계(user_id 부여) 세 곳에서 공통으로 필요한
"mission_id -> 신뢰 가능한 메타데이터" 조회를 한 곳에 모은 인터페이스다.

실제 조회 방식(BE C/BE A에 대한 내부 HTTP 호출인지, 공유 조회 라이브러리인지)은
아직 팀에서 확정되지 않았다. 확정되면 이 함수 본문만 채우면 된다 — 호출부는
이미 이 시그니처를 기준으로 작성한다. 그 전까지는 NotImplementedError로 막아둔다:
조용히 None을 반환하면 "조회했는데 없더라"와 "아직 연결도 안 됐다"를 구분할 수
없어서, 실제로 연결되기 전에 이 값에 의존하는 로직이 있다면 시끄럽게 터지는 게 낫다.
"""
from typing import TypedDict

# get_mission()이 실제로 연결되기 전까지는 main.py의 upload_clip이 clips.user_id를
# 채울 방법이 없어서, 모든 클립의 user_id가 NULL로 남는다. 이 상태에서는
# POST /api/ai/clips/withdrawal-cleanup이 "이 사용자 클립을 조회했더니 없더라"와
# "애초에 조회할 방법이 없다"를 구분하지 못하고 둘 다 NO_CLIPS(성공)로 보고하게 된다 —
# 그러면 BE C가 탈퇴를 완료로 확정해버려서 실제로는 안 지워진 개인 클립이 남을 수 있다.
# main.py의 withdrawal_cleanup은 이 플래그가 False인 동안 절대 성공을 주장하지 않고
# 스펙의 500 FAILED 계약(재시도/운영 확인 대상)을 대신 반환한다.
# get_mission()을 구현하고 upload_clip이 실제로 호출하도록 연결한 뒤에만 True로 바꿀 것.
USER_ID_LINKING_WIRED = False


class MissionInfo(TypedDict):
    # 반드시 str(정수)여야 한다. 접두사/패딩 금지 (예: "u-42", "0042" 불가 - "42"만 허용).
    # 이유: main.py의 withdrawal_cleanup이 요청받은 userId(JSON 정수)를 str(body.userId)로
    # 바꿔서 clips.user_id를 조회한다(WHERE user_id = ?, 순수 문자열 일치 - 정규화 없음).
    # 여기서 다른 포맷("u-42" 등)으로 저장하면 조회가 조용히 실패해서 그 클립은
    # 탈퇴 정리 대상에서 영원히 빠진다. BE C가 보내는 userId가 실제 정수(Long)이므로,
    # 이 함수도 항상 진짜 정수를 str()로 바꾼 값을 돌려줘야 양쪽이 항상 일치한다
    # (수동으로 포맷/패딩한 문자열이 아니라).
    user_id: str
    slot: str  # MORNING / NOON / EVENING — abuse_policy.MISSION_SLOT_WINDOWS 참고


def get_mission(mission_id: str) -> MissionInfo:
    """mission_id로 미션 메타데이터(소유자 user_id, 슬롯)를 조회한다.

    TODO(승환님): 실제 조회 방식 확정 필요.
    - BE C/BE A에 대한 내부 API 호출인가, 아니면 다른 공유 리소스인가?
    - 네트워크 호출이면 타임아웃/실패 시 정책(재시도? 즉시 실패?)도 함께 정해야
      main.py 쪽 예외 처리(WellLogError 계층)에 맞춰 연결할 수 있다.
    확정되면 이 함수 본문만 채우면 된다 — main.py/abuse_policy 연계부는 이미
    이 시그니처(mission_id -> MissionInfo)를 기준으로 작성해뒀다.

    user_id 포맷 주의: 반환하는 user_id는 반드시 str(int) 형태여야 한다
    (MissionInfo 정의 참고) — POST /api/ai/clips/withdrawal-cleanup의 userId(정수)를
    str()로 바꾼 값과 정확히 일치해야 클립이 조회된다.
    """
    raise NotImplementedError(
        "get_mission()은 아직 연결되지 않았습니다. "
        "mission_id -> user_id/slot 조회 방식이 확정되면 구현하세요."
    )
