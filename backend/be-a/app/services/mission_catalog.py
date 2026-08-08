from app.schemas.mission import Mission


MISSION_CATALOG = [
    Mission(
        title="기상 후 물 한 잔 마시기",
        description="일어난 뒤 30분 안에 물 한 잔을 천천히 마셔주세요.",
        slot="MORNING",
        mission_type="HYDRATION",
        difficulty="easy",
        duration_minutes=2,
        reason="아침 수분 보충은 부담 없이 하루의 웰니스 루틴을 시작하기 좋아요.",
        verification_criteria=[
            {"id": "cup_visible", "description": "컵이나 물병이 화면에 보여야 함"},
            {"id": "drinking_motion", "description": "물을 마시는 행동이 확인되어야 함"},
        ],
    ),
    Mission(
        title="점심에 선크림 덧바르기",
        description="점심시간이나 외출 전에 선크림을 다시 발라주세요.",
        slot="NOON",
        mission_type="SUN_CARE",
        difficulty="easy",
        duration_minutes=3,
        reason="자외선 노출을 줄이는 습관은 피부 컨디션 관리에 도움이 돼요.",
        verification_criteria=[
            {"id": "sunscreen_visible", "description": "선크림 제품이 화면에 보여야 함"},
            {"id": "application_action", "description": "손이나 피부에 바르는 행동이 확인되어야 함"},
        ],
    ),
    Mission(
        title="자기 전 수분크림 바르기",
        description="세안 후 수분크림을 손이나 얼굴에 부드럽게 발라주세요.",
        slot="EVENING",
        mission_type="MOISTURIZING",
        difficulty="easy",
        duration_minutes=3,
        reason="건조함과 각질 고민이 있다면 저녁 보습 루틴을 꾸준히 유지하는 것이 좋아요.",
        verification_criteria=[
            {"id": "moisturizer_visible", "description": "보습 제품이 화면에 보여야 함"},
            {"id": "application_action", "description": "제품을 바르는 행동이 확인되어야 함"},
        ],
    ),
    Mission(
        title="저녁 이중세안하기",
        description="메이크업이나 선크림을 지운 뒤 순한 세안제로 한 번 더 세안해 주세요.",
        slot="EVENING",
        mission_type="CLEANSING",
        difficulty="medium",
        duration_minutes=5,
        reason="피지와 잔여물을 부드럽게 정리하는 저녁 세안 습관을 추천했어요.",
        verification_criteria=[
            {"id": "cleanser_visible", "description": "세안 제품이 화면에 보여야 함"},
            {"id": "cleansing_action", "description": "세안하는 행동 일부가 확인되어야 함"},
        ],
    ),
    Mission(
        title="잠들기 전 10분 스트레칭하기",
        description="실내에서 무리하지 않는 동작으로 몸을 가볍게 풀어주세요.",
        slot="EVENING",
        mission_type="INDOOR_ACTIVITY",
        difficulty="easy",
        duration_minutes=10,
        reason="짧은 실내 활동으로 긴장을 풀고 편안한 수면 준비를 할 수 있어요.",
        verification_criteria=[
            {"id": "body_visible", "description": "상체 또는 팔다리 동작이 화면에 보여야 함"},
            {"id": "stretching_motion", "description": "스트레칭 동작이 연속해서 확인되어야 함"},
        ],
    ),
    Mission(
        title="저녁 10분 가볍게 산책하기",
        description="안전하고 밝은 길에서 편안한 속도로 걸어주세요.",
        slot="EVENING",
        mission_type="OUTDOOR_ACTIVITY",
        difficulty="easy",
        duration_minutes=10,
        reason="가벼운 산책으로 생활 리듬을 환기하고 스트레스를 낮춰보세요.",
        verification_criteria=[
            {"id": "walking_scene", "description": "걷는 발이나 주변 이동 장면이 보여야 함"},
            {"id": "walking_motion", "description": "야외에서 걷는 움직임이 확인되어야 함"},
        ],
    ),
]
