import { getBrandUsShipping, getDutiesType, shipsToUs } from './brandShipping';

describe('getBrandUsShipping', () => {
  it('reads brandUsShipping from the author profile', () => {
    const author = { attributes: { profile: { publicData: { brandUsShipping: { duties: 'ddp' } } } } };
    expect(getBrandUsShipping(author)).toEqual({ duties: 'ddp' });
  });

  it.each([[undefined], [null], [{}], [{ attributes: { profile: {} } }], [{ attributes: { profile: { publicData: { brandUsShipping: null } } } }], [{ attributes: { profile: { publicData: { brandUsShipping: 'ddp' } } } }], [{ attributes: { profile: { publicData: { brandUsShipping: ['ddp'] } } } }]])(
    'returns null for missing or malformed data (%#)',
    author => {
      expect(getBrandUsShipping(author)).toBeNull();
    }
  );
});

describe('getDutiesType', () => {
  it('maps the duty states', () => {
    expect(getDutiesType({ duties: 'ddp', method: 'flat_rate' })).toBe('ddp');
    expect(getDutiesType({ duties: 'ddu', method: 'flat_rate' })).toBe('ddu');
  });

  it('treats a missing or unrecognized duties value as unknown', () => {
    expect(getDutiesType({ method: 'flat_rate' })).toBe('unknown');
    expect(getDutiesType({ duties: 'maybe' })).toBe('unknown');
    expect(getDutiesType(null)).toBe('unknown');
    expect(getDutiesType(undefined)).toBe('unknown');
  });

  it('method none wins over duties', () => {
    expect(getDutiesType({ duties: 'ddu', method: 'none' })).toBe('none');
  });
});

describe('shipsToUs', () => {
  it('is true for every known method except none', () => {
    ['free', 'flat_rate', 'flat_rate_free_over_threshold', 'calculated_at_checkout', 'calculated_free_over_threshold'].forEach(
      method => expect(shipsToUs({ method })).toBe(true)
    );
  });

  it('is false for none, unknown methods and no data', () => {
    expect(shipsToUs({ method: 'none' })).toBe(false);
    expect(shipsToUs({ method: 'carrier_pigeon' })).toBe(false);
    expect(shipsToUs({ duties: 'ddp' })).toBe(false);
    expect(shipsToUs(null)).toBe(false);
  });
});
