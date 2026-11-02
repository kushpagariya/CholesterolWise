import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeReadings } from './api';
import { sample } from './analysis';

function serverResult() {
  return {
    readings: sample, unit: 'mg/dL', review_heading: 'Server review heading',
    metrics: Object.fromEntries((['ldl', 'hdl', 'total'] as const).map(key => [key, {
      value: sample[key], label: `Server ${key} result`, tone: 'blue', detail: 'From server', reference: 'Server reference',
      scale: { maximum: 500, marker_percent: 25, segments: [{ start: 0, end: 500, tone: 'blue' }] },
    }])),
    derived: { non_hdl: { value: 165, unit: 'mg/dL', formula: 'Server formula' }, total_hdl_ratio: { value: 4.67, unit: 'ratio', formula: 'Server formula' } },
  };
}

beforeEach(() => vi.stubGlobal('window', globalThis));
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('analysis API client', () => {
  it('sends a JSON POST and displays the server interpretation unchanged', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(serverResult()), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await analyzeReadings(sample);
    expect(result.metrics.ldl.label).toBe('Server ldl result');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/analyze');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(sample);
    expect(fetchMock.mock.calls[0][1].cache).toBe('no-store');
  });
  it('preserves server validation errors for the form', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Check total', field_errors: { total: 'Review your total' } }), { status: 422 })));
    await expect(analyzeReadings(sample)).rejects.toMatchObject({ message: 'Check total', fieldErrors: { total: 'Review your total' } });
  });
  it('does not compute a local fallback when the server is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network error')));
    await expect(analyzeReadings(sample)).rejects.toThrow('Unable to reach the analysis server');
  });
  it('rejects a static-host HTML response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Not an API</html>')));
    await expect(analyzeReadings(sample)).rejects.toThrow('unexpected response');
  });
  it('rejects an incomplete successful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ readings: sample }))));
    await expect(analyzeReadings(sample)).rejects.toThrow('incomplete results');
  });
  it('supports cancellation when a user leaves a pending request', async () => {
    vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))));
    const controller = new AbortController();
    const pending = analyzeReadings(sample, controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('times out slow requests with a retryable message', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))));
    const pending = expect(analyzeReadings(sample)).rejects.toThrow('took too long');
    await vi.advanceTimersByTimeAsync(90000);
    await pending;
  });
});
