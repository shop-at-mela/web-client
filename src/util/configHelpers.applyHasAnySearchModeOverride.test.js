import { applyHasAnySearchModeOverride, HAS_ANY_SEARCH_MODE_KEYS } from './configHelpers';

describe('applyHasAnySearchModeOverride', () => {
  it('forces searchMode to has_any for occasion, gift_occasion, and recipient', () => {
    const listingFields = [
      { key: 'occasion', schemaType: 'multi-enum', filterConfig: { label: 'Occasion' } },
      { key: 'gift_occasion', schemaType: 'multi-enum', filterConfig: { label: 'Gift Occasion' } },
      { key: 'recipient', schemaType: 'multi-enum', filterConfig: { label: 'Recipient' } },
    ];

    const result = applyHasAnySearchModeOverride(listingFields);

    expect(result).toHaveLength(3);
    result.forEach(field => {
      expect(field.filterConfig.searchMode).toEqual('has_any');
    });
  });

  it('preserves other filterConfig properties on overridden fields', () => {
    const listingFields = [
      { key: 'occasion', schemaType: 'multi-enum', filterConfig: { label: 'Occasion', group: 'primary' } },
    ];

    const [result] = applyHasAnySearchModeOverride(listingFields);

    expect(result.filterConfig).toEqual({ label: 'Occasion', group: 'primary', searchMode: 'has_any' });
  });

  it('creates a filterConfig object when the Console-sourced field has none', () => {
    const listingFields = [{ key: 'recipient', schemaType: 'multi-enum' }];

    const [result] = applyHasAnySearchModeOverride(listingFields);

    expect(result.filterConfig).toEqual({ searchMode: 'has_any' });
  });

  it('leaves other multi-enum fields (e.g. certification) untouched', () => {
    const listingFields = [
      { key: 'certification', schemaType: 'multi-enum', filterConfig: { label: 'Certification' } },
    ];

    const [result] = applyHasAnySearchModeOverride(listingFields);

    expect(result.filterConfig).toEqual({ label: 'Certification' });
    expect(result.filterConfig.searchMode).toBeUndefined();
  });

  it('leaves fields without a matching key completely unchanged (same reference)', () => {
    const untouchedField = { key: 'age_group', schemaType: 'enum', filterConfig: { label: 'Age' } };
    const [result] = applyHasAnySearchModeOverride([untouchedField]);

    expect(result).toBe(untouchedField);
  });

  it('exports the exact list of overridden keys for reuse/inspection', () => {
    expect(HAS_ANY_SEARCH_MODE_KEYS).toEqual(['occasion', 'gift_occasion', 'recipient']);
  });
});
