from typing import ClassVar, FrozenSet

from pydantic import BaseModel, ConfigDict


def to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(word.capitalize() for word in rest)


class ApiModel(BaseModel):
    """Python에서는 snake_case, API JSON에서는 camelCase를 사용한다 (be-a와 동일 규칙)."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

    # 상황에 따라 null로 명시해야 하는 필드(예: 202 응답의 result/reason)와
    # 아예 생략해야 하는 필드(예: 최초 업로드의 retryCount)가 섞여 있어
    # pydantic의 exclude_none 하나로는 명세서 예시를 그대로 재현할 수 없다.
    # 서브클래스가 _omit_if_none으로 "생략 대상" 필드명(camelCase)을 지정한다.
    _omit_if_none: ClassVar[FrozenSet[str]] = frozenset()

    def to_payload(self) -> dict:
        payload = self.model_dump(by_alias=True, mode="json")
        for key in self._omit_if_none:
            if payload.get(key) is None:
                payload.pop(key, None)
        return payload
