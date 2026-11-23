import { getBrandCountry, getBrandOriginLine } from './brandOrigin';

describe('getBrandCountry', () => {
  it('defaults to India when no country is set', () => {
    expect(getBrandCountry({})).toBe('India');
    expect(getBrandCountry(undefined)).toBe('India');
  });

  it("uses the brand's own country", () => {
    expect(getBrandCountry({ brandCountry: 'Sri Lanka' })).toBe('Sri Lanka');
  });
});

describe('getBrandOriginLine', () => {
  it('joins city and the default country', () => {
    expect(getBrandOriginLine({ brandCity: 'Jaipur' })).toBe('Jaipur, India');
  });

  it('never labels a non-Indian city as India', () => {
    expect(getBrandOriginLine({ brandCity: 'Colombo', brandCountry: 'Sri Lanka' })).toBe(
      'Colombo, Sri Lanka'
    );
  });

  it('appends the country to a bare brandOrigin only when missing', () => {
    expect(getBrandOriginLine({ brandOrigin: 'Mumbai' })).toBe('Mumbai, India');
    expect(getBrandOriginLine({ brandOrigin: 'Mumbai, India' })).toBe('Mumbai, India');
    expect(getBrandOriginLine({ brandOrigin: 'Kathmandu', brandCountry: 'Nepal' })).toBe(
      'Kathmandu, Nepal'
    );
  });

  it('returns the bare country when only brandCountry is set', () => {
    expect(getBrandOriginLine({ brandCountry: 'Bangladesh' })).toBe('Bangladesh');
  });

  it('returns null with no data, or India when asked to fall back', () => {
    expect(getBrandOriginLine({})).toBeNull();
    expect(getBrandOriginLine({}, { fallbackToCountry: true })).toBe('India');
  });
});
