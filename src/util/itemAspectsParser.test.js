import {
  parseItemAspects,
  getDisplayValue,
  getFieldValue,
  getBenefit,
  getDisplayAspects,
  getAspectsForSchema,
  filterAspects,
  getAspectsWithBenefits,
  formatAspectsForDisplay,
  validateItemAspects,
} from './itemAspectsParser';

describe('itemAspectsParser', () => {
  // Test data
  const basicItemAspects = 'Material|material: Organic Cotton|organic_cotton; Age Group|age_group: 0-6 months|0_6_months';

  const benefitEnrichedItemAspects = 'Material|material: Organic Cotton|organic_cotton|Soft and breathable, GOTS certified for baby\'s sensitive skin; Age Group|age_group: 0-6 months|0_6_months; Certification|certification: GOTS Certified|gots_certified|Global Organic Textile Standard - safe for baby\'s sensitive skin, no harmful chemicals';

  describe('parseItemAspects', () => {
    it('should parse basic itemAspects string', () => {
      const result = parseItemAspects(basicItemAspects);

      expect(result).toHaveProperty('material');
      expect(result.material).toEqual({
        displayKey: 'Material',
        fieldId: 'material',
        displayValue: 'Organic Cotton',
        fieldValue: 'organic_cotton',
        benefit: null,
      });

      expect(result).toHaveProperty('age_group');
      expect(result.age_group).toEqual({
        displayKey: 'Age Group',
        fieldId: 'age_group',
        displayValue: '0-6 months',
        fieldValue: '0_6_months',
        benefit: null,
      });
    });

    it('should parse benefit-enriched itemAspects string', () => {
      const result = parseItemAspects(benefitEnrichedItemAspects);

      expect(result.material.benefit).toBe('Soft and breathable, GOTS certified for baby\'s sensitive skin');
      expect(result.certification.benefit).toBe('Global Organic Textile Standard - safe for baby\'s sensitive skin, no harmful chemicals');
      expect(result.age_group.benefit).toBeNull();
    });

    it('should handle empty string', () => {
      const result = parseItemAspects('');
      expect(result).toEqual({});
    });

    it('should handle null input', () => {
      const result = parseItemAspects(null);
      expect(result).toEqual({});
    });

    it('should skip malformed attributes', () => {
      const malformed = 'Material|material: Organic Cotton|organic_cotton; InvalidAttribute; Age Group|age_group: 0-6 months|0_6_months';
      const result = parseItemAspects(malformed);

      expect(result).toHaveProperty('material');
      expect(result).toHaveProperty('age_group');
      expect(Object.keys(result)).toHaveLength(2);
    });
  });

  describe('getDisplayValue', () => {
    it('should return display value for existing field', () => {
      const result = getDisplayValue(basicItemAspects, 'material');
      expect(result).toBe('Organic Cotton');
    });

    it('should return null for non-existent field', () => {
      const result = getDisplayValue(basicItemAspects, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getFieldValue', () => {
    it('should return field value for filtering', () => {
      const result = getFieldValue(basicItemAspects, 'material');
      expect(result).toBe('organic_cotton');
    });

    it('should return null for non-existent field', () => {
      const result = getFieldValue(basicItemAspects, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getBenefit', () => {
    it('should return benefit for field with benefit', () => {
      const result = getBenefit(benefitEnrichedItemAspects, 'material');
      expect(result).toBe('Soft and breathable, GOTS certified for baby\'s sensitive skin');
    });

    it('should return null for field without benefit', () => {
      const result = getBenefit(benefitEnrichedItemAspects, 'age_group');
      expect(result).toBeNull();
    });

    it('should return null for non-existent field', () => {
      const result = getBenefit(benefitEnrichedItemAspects, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getDisplayAspects', () => {
    it('should return simple key-value object', () => {
      const result = getDisplayAspects(basicItemAspects);

      expect(result).toEqual({
        'Material': 'Organic Cotton',
        'Age Group': '0-6 months',
      });
    });
  });

  describe('getAspectsForSchema', () => {
    it('should return Schema.org PropertyValue array', () => {
      const result = getAspectsForSchema(basicItemAspects, false);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        '@type': 'PropertyValue',
        name: 'Material',
        value: 'Organic Cotton',
      });
    });

    it('should include benefits when includeBenefits is true', () => {
      const result = getAspectsForSchema(benefitEnrichedItemAspects, true);

      const materialProperty = result.find(prop => prop.name === 'Material');
      expect(materialProperty).toHaveProperty('description');
      expect(materialProperty.description).toBe('Soft and breathable, GOTS certified for baby\'s sensitive skin');

      const ageGroupProperty = result.find(prop => prop.name === 'Age Group');
      expect(ageGroupProperty).not.toHaveProperty('description');
    });

    it('should exclude benefits when includeBenefits is false', () => {
      const result = getAspectsForSchema(benefitEnrichedItemAspects, false);

      result.forEach(prop => {
        expect(prop).not.toHaveProperty('description');
      });
    });
  });

  describe('filterAspects', () => {
    it('should return only specified field IDs', () => {
      const result = filterAspects(benefitEnrichedItemAspects, ['material', 'certification']);

      expect(Object.keys(result)).toHaveLength(2);
      expect(result).toHaveProperty('material');
      expect(result).toHaveProperty('certification');
      expect(result).not.toHaveProperty('age_group');
    });

    it('should return empty object when no matching fields', () => {
      const result = filterAspects(basicItemAspects, ['nonexistent']);
      expect(result).toEqual({});
    });
  });

  describe('getAspectsWithBenefits', () => {
    it('should return only aspects with benefits', () => {
      const result = getAspectsWithBenefits(benefitEnrichedItemAspects);

      expect(Object.keys(result)).toHaveLength(2);
      expect(result).toHaveProperty('material');
      expect(result).toHaveProperty('certification');
      expect(result).not.toHaveProperty('age_group');
    });

    it('should return empty object when no benefits', () => {
      const result = getAspectsWithBenefits(basicItemAspects);
      expect(result).toEqual({});
    });
  });

  describe('formatAspectsForDisplay', () => {
    it('should format for UI table without benefits', () => {
      const result = formatAspectsForDisplay(basicItemAspects, false);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        label: 'Material',
        value: 'Organic Cotton',
      });
      expect(result[0]).not.toHaveProperty('tooltip');
    });

    it('should format for UI table with benefits', () => {
      const result = formatAspectsForDisplay(benefitEnrichedItemAspects, true);

      const materialItem = result.find(item => item.label === 'Material');
      expect(materialItem).toHaveProperty('tooltip');
      expect(materialItem.tooltip).toBe('Soft and breathable, GOTS certified for baby\'s sensitive skin');

      const ageGroupItem = result.find(item => item.label === 'Age Group');
      expect(ageGroupItem).not.toHaveProperty('tooltip');
    });
  });

  describe('validateItemAspects', () => {
    it('should validate correct format', () => {
      const result = validateItemAspects(basicItemAspects);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect empty string', () => {
      const result = validateItemAspects('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('itemAspects string is empty or null');
    });

    it('should detect wrong type', () => {
      const result = validateItemAspects(123);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('itemAspects must be a string');
    });

    it('should detect missing pipe separator', () => {
      const invalid = 'Material material: Organic Cotton|organic_cotton';
      const result = validateItemAspects(invalid);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect missing colon separator', () => {
      const invalid = 'Material|material Organic Cotton|organic_cotton';
      const result = validateItemAspects(invalid);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect malformed key part', () => {
      const invalid = 'Material: Organic Cotton|organic_cotton';
      const result = validateItemAspects(invalid);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Key part'))).toBe(true);
    });

    it('should detect malformed value part', () => {
      const invalid = 'Material|material: Organic Cotton';
      const result = validateItemAspects(invalid);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Value part'))).toBe(true);
    });
  });
});
