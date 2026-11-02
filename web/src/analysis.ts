// Shared API shapes and basic form checks. Clinical rules live in backend/analysis.py.
export type SexContext = 'unspecified' | 'male' | 'female';
export type Readings = { ldl: number; hdl: number; total: number; sex: SexContext };
export type MetricKey = 'ldl' | 'hdl' | 'total';
export type Tone = 'good' | 'blue' | 'amber' | 'red';
export type FieldErrors = Partial<Record<MetricKey | 'sex', string>>;
export type ReferenceScale = { maximum: number; marker_percent: number; segments: { start: number; end: number; tone: Tone }[] };
export type MetricResult = { value: number; label: string; tone: Tone; detail: string; reference: string; scale: ReferenceScale };
export type DerivedValue = { value: number; unit: string; formula: string };
export type AnalysisResponse = {
  readings: Readings;
  unit: 'mg/dL';
  metrics: Record<MetricKey, MetricResult>;
  derived: { non_hdl: DerivedValue; total_hdl_ratio: DerivedValue };
  review_heading: string;
  scope: string;
  engine_version: string;
  sources: string[];
};

export const sample: Readings = { ldl: 120, hdl: 45, total: 210, sex: 'unspecified' };

export function validateInputs(values: Record<MetricKey, string>): FieldErrors {
  const errors: FieldErrors = {};
  for (const key of ['ldl', 'hdl', 'total'] as const) {
    if (!values[key].trim()) errors[key] = 'Enter a value from your report.';
    else if (!Number.isFinite(Number(values[key])) || Number(values[key]) <= 0) errors[key] = 'Enter a number greater than zero.';
  }
  return errors;
}
