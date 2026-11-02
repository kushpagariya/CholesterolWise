from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator
from pydantic_core import PydanticCustomError

SexContext = Literal["unspecified", "male", "female"]
Tone = Literal["good", "blue", "amber", "red"]
MetricKey = Literal["ldl", "hdl", "total"]

# These caps catch unit/typing errors. They are input guardrails, not clinical ranges.
INPUT_LIMITS = {"ldl": 1000, "hdl": 300, "total": 1500}


class Readings(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ldl: Annotated[float, Field(strict=True, gt=0, le=INPUT_LIMITS["ldl"], allow_inf_nan=False)]
    hdl: Annotated[float, Field(strict=True, gt=0, le=INPUT_LIMITS["hdl"], allow_inf_nan=False)]
    total: Annotated[float, Field(strict=True, gt=0, le=INPUT_LIMITS["total"], allow_inf_nan=False)]
    sex: SexContext = "unspecified"

    @field_validator("total")
    @classmethod
    def check_total(cls, value: float, info: ValidationInfo) -> float:
        for key in ("ldl", "hdl"):
            if key in info.data and value < info.data[key]:
                raise PydanticCustomError(
                    "inconsistent_total",
                    "Total cholesterol cannot be lower than {component}. Check your report.",
                    {"component": key.upper()},
                )
        return value


class Category(BaseModel):
    label: str
    tone: Tone
    reference: str
    detail: str


class RangeSegment(BaseModel):
    start: float
    end: float
    tone: Tone


class ReferenceScale(BaseModel):
    maximum: float
    segments: list[RangeSegment]
    marker_percent: float


class MetricResult(Category):
    value: float
    scale: ReferenceScale


class DerivedValue(BaseModel):
    value: float
    unit: str
    formula: str


class DerivedResults(BaseModel):
    non_hdl: DerivedValue
    total_hdl_ratio: DerivedValue


class AnalysisResponse(BaseModel):
    readings: Readings
    unit: Literal["mg/dL"] = "mg/dL"
    metrics: dict[MetricKey, MetricResult]
    derived: DerivedResults
    review_heading: str
    scope: str
    engine_version: str
    sources: list[str]
