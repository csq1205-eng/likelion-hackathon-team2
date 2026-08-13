import re
from typing import Annotated, Generic, Optional, TypeVar, Union

from pydantic import BaseModel, BeforeValidator, ConfigDict


def to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(word.capitalize() for word in rest)


def validate_external_id(value):
    """숫자형 BE C ID와 UUID 기반 BE B ID를 모두 안전하게 받는다."""
    if isinstance(value, bool):
        raise ValueError("ID는 boolean일 수 없습니다.")
    if isinstance(value, int):
        if value <= 0:
            raise ValueError("숫자 ID는 양수여야 합니다.")
        return value
    if isinstance(value, str):
        normalized = value.strip()
        if not normalized:
            raise ValueError("문자열 ID는 비어 있을 수 없습니다.")
        if len(normalized) > 128 or not re.fullmatch(r"[A-Za-z0-9._:-]+", normalized):
            raise ValueError("문자열 ID 형식이 올바르지 않습니다.")
        return normalized
    raise ValueError("ID는 양의 정수 또는 문자열이어야 합니다.")


ExternalId = Annotated[Union[int, str], BeforeValidator(validate_external_id)]


class ApiModel(BaseModel):
    """Python에서는 snake_case, API JSON에서는 camelCase를 사용한다."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


ResponseData = TypeVar("ResponseData")


class ApiResponse(ApiModel, Generic[ResponseData]):
    """최종 API 명세서의 공통 성공 응답."""

    success: bool = True
    data: Optional[ResponseData] = None
    message: Optional[str] = None
