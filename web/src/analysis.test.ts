import { describe, expect, it } from 'vitest';
import { validateInputs } from './analysis';

describe('basic form checks', () => {
  const values = { ldl: '120', hdl: '45', total: '210' };
  it('accepts decimal entries for submission to the server', () => expect(validateInputs({ ...values, ldl: '120.5' })).toEqual({}));
  it.each(['', ' ', '-5', '0', 'NaN', 'Infinity', 'oops'])('rejects unusable LDL entry %s', ldl => expect(validateInputs({ ...values, ldl }).ldl).toBeTruthy());
  it('leaves clinical rules and cross-field validation to the backend', () => expect(validateInputs({ ...values, ldl: '900', total: '100' })).toEqual({}));
});
