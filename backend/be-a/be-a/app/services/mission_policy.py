import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


DEFAULT_POLICY_PATH = "config/mission_policy_rules.json"


@dataclass(frozen=True)
class MissionPolicyRules:
    version: str
    max_daily_missions_template: str
    base_constraints: tuple[str, ...]
    forbidden_keywords: tuple[str, ...]
    outdoor_keywords: tuple[str, ...]
    outdoor_mission_types: frozenset[str]
    lower_body_keywords: frozenset[str]
    fine_dust_blocking_levels: frozenset[str]
    heat_threshold_celsius: float
    high_uv_threshold: float

    @classmethod
    def from_dict(cls, data: dict) -> "MissionPolicyRules":
        return cls(
            version=str(data["version"]),
            max_daily_missions_template=str(data["max_daily_missions_template"]),
            base_constraints=tuple(data["base_constraints"]),
            forbidden_keywords=tuple(data["forbidden_keywords"]),
            outdoor_keywords=tuple(data["outdoor_keywords"]),
            outdoor_mission_types=frozenset(data["outdoor_mission_types"]),
            lower_body_keywords=frozenset(data["lower_body_keywords"]),
            fine_dust_blocking_levels=frozenset(data["fine_dust_blocking_levels"]),
            heat_threshold_celsius=float(data["heat_threshold_celsius"]),
            high_uv_threshold=float(data["high_uv_threshold"]),
        )


class FileMissionPolicyRepository:
    """BE B 정책 API/DB 어댑터로 교체 가능한 파일 기반 fallback."""

    def __init__(self, path: Optional[str] = None) -> None:
        self.path = Path(path or os.getenv("MISSION_POLICY_RULES_PATH", DEFAULT_POLICY_PATH))

    def get_active(self) -> MissionPolicyRules:
        with self.path.open(encoding="utf-8") as policy_file:
            return MissionPolicyRules.from_dict(json.load(policy_file))
