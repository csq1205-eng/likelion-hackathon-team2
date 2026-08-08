from pydantic import BaseModel, ConfigDict


def to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(word.capitalize() for word in rest)


class ApiModel(BaseModel):
    """Python에서는 snake_case, API JSON에서는 camelCase를 사용한다."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
