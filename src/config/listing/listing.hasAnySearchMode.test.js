import {
  applyHasAnySearchModeOverride,
  HAS_ANY_SEARCH_MODE_KEYS,
  withLocalOnlyListingFields,
  listingConfig,
  liftStaleCategoryLimits,
} from './listing';
import * as defaultListing from './defaultListing';

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
      {
        key: 'occasion',
        schemaType: 'multi-enum',
        filterConfig: { label: 'Occasion', group: 'primary' },
      },
    ];

    const [result] = applyHasAnySearchModeOverride(listingFields);

    expect(result.filterConfig).toEqual({
      label: 'Occasion',
      group: 'primary',
      searchMode: 'has_any',
    });
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

describe('withLocalOnlyListingFields', () => {
  it('appends localOnly built-ins that the hosted fields lack', () => {
    const hosted = [{ key: 'color' }];
    const defaults = [{ key: 'isBestseller', localOnly: true }, { key: 'size' }];
    expect(withLocalOnlyListingFields(hosted, defaults).map(f => f.key)).toEqual([
      'color',
      'isBestseller',
    ]);
  });

  it('keeps hosted duplicates so validation can still warn about them', () => {
    const hosted = [{ key: 'color' }, { key: 'color' }];
    expect(withLocalOnlyListingFields(hosted, [])).toHaveLength(2);
  });
});

describe('Mela listing fields through listingConfig.validate', () => {
  const run = hostedFields =>
    listingConfig.validate(
      {
        hasListingTypesAsset: true,
        hasNonEmptyListingTypes: true,
        hasListingFieldsAsset: true,
        listingTypes: [],
        listingFields: hostedFields,
      },
      { defaults: { listing: defaultListing }, resolved: {} }
    ).value.listingFields;

  it('keeps the localOnly isBestseller field from the built-in defaults', () => {
    const field = run([]).find(f => f.key === 'isBestseller');
    expect(field).toBeDefined();
    expect(field.schemaType).toBe('boolean');
  });

  it('forces has_any on a hosted occasion field', () => {
    const occasion = {
      key: 'occasion',
      label: 'Occasion',
      scope: 'public',
      schemaType: 'multi-enum',
      enumOptions: [{ option: 'diwali', label: 'Diwali' }],
      filterConfig: { indexForSearch: true, label: 'Occasion' },
    };
    expect(run([occasion]).find(f => f.key === 'occasion').filterConfig.searchMode).toBe('has_any');
  });

  it('keeps a hosted field limited to a category id that no longer exists', () => {
    const color = {
      key: 'color',
      label: 'Color',
      scope: 'public',
      schemaType: 'multi-enum',
      enumOptions: [{ option: 'red', label: 'Red' }],
      categoryConfig: { limitToCategoryIds: true, categoryIds: ['Baby-Clothes-Accessories'] },
      filterConfig: { indexForSearch: true, label: 'Color' },
    };
    const validate = categories =>
      listingConfig.validate(
        {
          hasListingTypesAsset: true,
          hasNonEmptyListingTypes: true,
          hasListingFieldsAsset: true,
          listingTypes: [],
          listingFields: [color],
        },
        {
          defaults: { listing: defaultListing },
          resolved: { categoryConfiguration: { categories } },
        }
      );
    const { value, issues } = validate([{ id: 'fashion', name: 'Fashion', subcategories: [] }]);
    const kept = value.listingFields.find(f => f.key === 'color');
    expect(kept).toBeDefined();
    expect(kept.categoryConfig.limitToCategoryIds).toBe(false);
    expect(issues.map(i => i.code)).not.toContain('LISTING_FIELD_UNSUPPORTED');
  });
});

describe('liftStaleCategoryLimits', () => {
  it('clears the category limit only for the listed keys', () => {
    const fields = [
      { key: 'age_group', categoryConfig: { limitToCategoryIds: true, categoryIds: ['old'] } },
      { key: 'brand', categoryConfig: { limitToCategoryIds: true, categoryIds: ['old'] } },
      { key: 'material' },
    ];
    const [ageGroup, brand, material] = liftStaleCategoryLimits(fields);
    expect(ageGroup.categoryConfig).toEqual({ limitToCategoryIds: false });
    expect(brand.categoryConfig.limitToCategoryIds).toBe(true);
    expect(material).toEqual({ key: 'material' });
  });
});
