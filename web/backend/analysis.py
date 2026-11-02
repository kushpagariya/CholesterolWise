"""All clinical thresholds, interpretations, and derived calculations live here."""

from decimal import Decimal, ROUND_HALF_UP

from .models import (
    AnalysisResponse, Category, DerivedResults, DerivedValue, MetricKey,
    MetricResult, RangeSegment, Readings, ReferenceScale, SexContext,
)

ENGINE_VERSION = "1.0.0"
SCOPE = "General reference categories for adults aged 20 and over; not personalized treatment targets."
SOURCES = [
    "https://medlineplus.gov/lab-tests/cholesterol-levels/",
    "https://medlineplus.gov/ency/article/000403.htm",
]

# Each upper bound is exclusive; None denotes the final open-ended category.
LDL_RULES = [
    (100, Category(label="Optimal", tone="good", reference="Below 100 mg/dL", detail="Within the general optimal LDL category. Your personal LDL goal may be lower depending on your health history.")),
    (130, Category(label="Near optimal", tone="blue", reference="100–129 mg/dL", detail="Slightly above the general optimal LDL category. Consider this value alongside your other cardiovascular risk factors.")),
    (160, Category(label="Borderline high", tone="amber", reference="130–159 mg/dL", detail="Above the general optimal range. A healthcare professional can help put this result in context.")),
    (190, Category(label="High", tone="red", reference="160–189 mg/dL", detail="In the high LDL category. Discuss this result and your personal goals with a healthcare professional.")),
    (None, Category(label="Very high", tone="red", reference="190 mg/dL or above", detail="In the very high LDL category. Arrange a clinical review, including discussion of family history and possible contributing factors.")),
]
TOTAL_RULES = [
    (200, Category(label="Desirable", tone="good", reference="Below 200 mg/dL", detail="Within the general desirable category. Total cholesterol includes multiple types of cholesterol, so read it alongside LDL and HDL.")),
    (240, Category(label="Borderline high", tone="amber", reference="200–239 mg/dL", detail="In the borderline-high category. LDL, HDL and your wider health context help explain what this means for you.")),
    (None, Category(label="High", tone="red", reference="240 mg/dL or above", detail="In the high category. Review the full lipid panel with a healthcare professional.")),
]


def hdl_rules(sex: SexContext) -> list[tuple[float | None, Category]]:
    low = 50 if sex == "female" else 40
    rules: list[tuple[float | None, Category]] = [
        (low, Category(label="Low", tone="amber", reference=f"Below {low} mg/dL", detail="Below the general adult HDL reference for the selected context. HDL is one part of the overall picture, rather than a stand-alone treatment target.")),
    ]
    if sex == "unspecified":
        rules.append((50, Category(label="Context-dependent", tone="blue", reference="40–49 mg/dL: context matters", detail="This value is below the usual adult female reference and above the low threshold for adult men. Add sex context for a more specific explanation.")))
    rules.extend([
        (60, Category(label="Intermediate", tone="blue", reference="50–59 mg/dL" if sex == "female" else "40–59 mg/dL", detail="Above the low threshold for the selected context, but below 60 mg/dL. Interpret it alongside the rest of your lipid panel.")),
        (None, Category(label="Generally favorable", tone="good", reference="60 mg/dL or above", detail="Generally considered a favorable HDL level. A higher HDL result does not cancel out high LDL or other cardiovascular risk factors.")),
    ])
    return rules


def rules_for(key: MetricKey, sex: SexContext) -> list[tuple[float | None, Category]]:
    return LDL_RULES if key == "ldl" else TOTAL_RULES if key == "total" else hdl_rules(sex)


def classify(key: MetricKey, value: float, sex: SexContext) -> MetricResult:
    rules = rules_for(key, sex)
    category = next(category for upper, category in rules if upper is None or value < upper)
    maximum = {"ldl": 250, "hdl": 90, "total": 320}[key]
    segments: list[RangeSegment] = []
    start = 0.0
    for upper, item in rules:
        end = float(upper if upper is not None else maximum)
        segments.append(RangeSegment(start=start, end=end, tone=item.tone))
        start = end
    return MetricResult(
        **category.model_dump(), value=value,
        scale=ReferenceScale(maximum=maximum, segments=segments, marker_percent=max(1, min(98, value / maximum * 100))),
    )


def analyze(readings: Readings) -> AnalysisResponse:
    # Decimal avoids binary-float artifacts in values such as 210.1 - 45.2.
    total = Decimal(str(readings.total))
    hdl = Decimal(str(readings.hdl))
    non_hdl = total - hdl
    ratio = (total / hdl).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    results = {key: classify(key, getattr(readings, key), readings.sex) for key in ("ldl", "hdl", "total")}
    return AnalysisResponse(
        readings=readings, metrics=results,
        derived=DerivedResults(
            non_hdl=DerivedValue(value=float(non_hdl), unit="mg/dL", formula="Total cholesterol − HDL cholesterol"),
            total_hdl_ratio=DerivedValue(value=float(ratio), unit="ratio", formula="Total cholesterol ÷ HDL cholesterol"),
        ),
        review_heading="Bring your results to a professional" if readings.ldl >= 160 else "Start a useful conversation",
        scope=SCOPE, engine_version=ENGINE_VERSION, sources=SOURCES,
    )


def reference_ranges() -> dict:
    from .models import INPUT_LIMITS
    return {
        "unit": "mg/dL", "scope": SCOPE, "engine_version": ENGINE_VERSION,
        "input_limits": INPUT_LIMITS, "sources": SOURCES,
        "categories": {
            "ldl": [{"upper_exclusive": bound, **c.model_dump()} for bound, c in LDL_RULES],
            "total": [{"upper_exclusive": bound, **c.model_dump()} for bound, c in TOTAL_RULES],
            "hdl": {sex: [{"upper_exclusive": bound, **c.model_dump()} for bound, c in hdl_rules(sex)] for sex in ("unspecified", "male", "female")},
        },
        "calculations": {
            "non_hdl": "Total cholesterol − HDL cholesterol",
            "total_hdl_ratio": "Total cholesterol ÷ HDL cholesterol (rounded to 2 decimal places)",
        },
    }
