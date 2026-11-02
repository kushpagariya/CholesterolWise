import type { AnalysisResponse, FieldErrors, Readings } from './analysis';

export class AnalysisError extends Error {
  constructor(message: string, public fieldErrors: FieldErrors = {}) { super(message); this.name = 'AnalysisError'; }
}

function isAnalysisResponse(value: unknown): value is AnalysisResponse {
  if (!value || typeof value !== 'object') return false;
  const data = value as AnalysisResponse;
  const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  if (data.unit !== 'mg/dL' || !data.readings || !data.metrics || !data.derived || typeof data.review_heading !== 'string') return false;
  if (!['unspecified', 'male', 'female'].includes(data.readings.sex)) return false;
  for (const key of ['ldl', 'hdl', 'total'] as const) {
    const m = data.metrics[key];
    if (!finite(data.readings[key]) || !m || !finite(m.value) || m.value !== data.readings[key]) return false;
    if (![m.label, m.detail, m.reference].every(v => typeof v === 'string') || !['good', 'blue', 'amber', 'red'].includes(m.tone)) return false;
    if (!m.scale || !finite(m.scale.maximum) || m.scale.maximum <= 0 || !finite(m.scale.marker_percent) || !Array.isArray(m.scale.segments) || m.scale.segments.length === 0) return false;
    if (!m.scale.segments.every(s => finite(s.start) && finite(s.end) && s.end > s.start && ['good', 'blue', 'amber', 'red'].includes(s.tone))) return false;
  }
  return [data.derived.non_hdl, data.derived.total_hdl_ratio].every(d => d && finite(d.value) && typeof d.unit === 'string' && typeof d.formula === 'string');
}

export async function analyzeReadings(readings: Readings, signal?: AbortSignal): Promise<AnalysisResponse> {
  const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  // Render's free service can take over 50 seconds to wake after inactivity.
  const timeout = window.setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetch(`${base}/api/analyze`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(readings), signal: controller.signal,
      cache: 'no-store', credentials: 'omit',
    });
    let data: unknown;
    try { data = await response.json(); }
    catch { throw new AnalysisError('The analysis server returned an unexpected response. Please try again.'); }
    if (!response.ok) {
      const error = data as { message?: unknown; field_errors?: unknown } | null;
      const fields: FieldErrors = {};
      if (response.status === 422 && error?.field_errors && typeof error.field_errors === 'object') {
        for (const key of ['ldl', 'hdl', 'total', 'sex'] as const) {
          const message = (error.field_errors as Record<string, unknown>)[key];
          if (typeof message === 'string') fields[key] = message;
        }
      }
      throw new AnalysisError(response.status === 422 && typeof error?.message === 'string' ? error.message : 'The analysis service is unavailable. Please try again shortly.', fields);
    }
    if (!isAnalysisResponse(data)) throw new AnalysisError('The analysis server returned incomplete results. Please try again.');
    return data;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error instanceof AnalysisError) throw error;
    throw new AnalysisError(controller.signal.aborted ? 'The analysis took too long. Please try again.' : 'Unable to reach the analysis server. Please try again when the connection is available.');
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}
