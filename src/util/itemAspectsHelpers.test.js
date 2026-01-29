import {
  parseItemAspects,
  getItemSpecificsAttributes,
  getItemAspectsForSEO,
} from './itemAspectsHelpers';

describe('itemAspectsHelpers', () => {
  describe('parseItemAspects', () => {
    it('parses a single item aspect correctly', () => {
      const itemAspectsString = 'Material|material: Handspun Handwoven Denim|handspun_denim|Eco-friendly and artisan-crafted';
      const result = parseItemAspects(itemAspectsString);

      expect(result).toEqual([
        {
          key: 'Material',
          value: 'Handspun Handwoven Denim',
          description: 'Eco-friendly and artisan-crafted',
          fieldId: 'material',
          optionValue: 'handspun_denim',
        },
      ]);
    });

    it('parses multiple item aspects correctly', () => {
      const itemAspectsString =
        'Type|type: Pencil Pouch|pencil_pouch|Fun and stylish for school supplies; Material|material: Handspun Handwoven Denim|handspun_denim|Eco-friendly and artisan-crafted; Design|design: Embroidered Stamps|embroidered_stamps|Playful and unique design';
      const result = parseItemAspects(itemAspectsString);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        key: 'Type',
        value: 'Pencil Pouch',
        description: 'Fun and stylish for school supplies',
        fieldId: 'type',
        optionValue: 'pencil_pouch',
      });
      expect(result[1]).toEqual({
        key: 'Material',
        value: 'Handspun Handwoven Denim',
        description: 'Eco-friendly and artisan-crafted',
        fieldId: 'material',
        optionValue: 'handspun_denim',
      });
      expect(result[2]).toEqual({
        key: 'Design',
        value: 'Embroidered Stamps',
        description: 'Playful and unique design',
        fieldId: 'design',
        optionValue: 'embroidered_stamps',
      });
    });

    it('handles item aspects with dimensions format', () => {
      const itemAspectsString = 'Dimensions|dimensions: 20cm L x 8cm W x 8cm H|20x8x8cm|Compact size for easy carrying';
      const result = parseItemAspects(itemAspectsString);

      expect(result).toEqual([
        {
          key: 'Dimensions',
          value: '20cm L x 8cm W x 8cm H',
          description: 'Compact size for easy carrying',
          fieldId: 'dimensions',
          optionValue: '20x8x8cm',
        },
      ]);
    });

    it('returns empty array for null or undefined input', () => {
      expect(parseItemAspects(null)).toEqual([]);
      expect(parseItemAspects(undefined)).toEqual([]);
      expect(parseItemAspects('')).toEqual([]);
    });

    it('returns empty array for non-string input', () => {
      expect(parseItemAspects(123)).toEqual([]);
      expect(parseItemAspects({})).toEqual([]);
      expect(parseItemAspects([])).toEqual([]);
    });

    it('handles malformed item aspects gracefully', () => {
      const itemAspectsString = 'InvalidFormat';
      const result = parseItemAspects(itemAspectsString);

      expect(result).toEqual([]);
    });

    it('skips item aspects without colon separator', () => {
      const itemAspectsString = 'Type|type Pencil Pouch|pencil_pouch|Fun; Material|material: Denim|denim|Eco-friendly';
      const result = parseItemAspects(itemAspectsString);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('Material');
    });

    it('skips item aspects without proper field format', () => {
      const itemAspectsString = 'Type: Pencil Pouch|pencil_pouch|Fun; Material|material: Denim|denim|Eco-friendly';
      const result = parseItemAspects(itemAspectsString);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('Material');
    });

    it('handles item aspects with only display value (no option value)', () => {
      const itemAspectsString = 'Material|material: Handspun Denim';
      const result = parseItemAspects(itemAspectsString);

      expect(result).toEqual([
        {
          key: 'Material',
          value: 'Handspun Denim',
          description: '',
          fieldId: 'material',
          optionValue: '',
        },
      ]);
    });

    it('handles item aspects with whitespace', () => {
      const itemAspectsString = '  Material | material :  Handspun Denim | handspun_denim | Eco-friendly  ';
      const result = parseItemAspects(itemAspectsString);

      expect(result).toEqual([
        {
          key: 'Material',
          value: 'Handspun Denim',
          description: 'Eco-friendly',
          fieldId: 'material',
          optionValue: 'handspun_denim',
        },
      ]);
    });

    it('handles item aspects with special characters in values', () => {
      const itemAspectsString = 'Size|size: 20cm x 8cm (Large)|large_size|Perfect for all-day use';
      const result = parseItemAspects(itemAspectsString);

      expect(result).toEqual([
        {
          key: 'Size',
          value: '20cm x 8cm (Large)',
          description: 'Perfect for all-day use',
          fieldId: 'size',
          optionValue: 'large_size',
        },
      ]);
    });

    it('handles trailing semicolon', () => {
      const itemAspectsString = 'Material|material: Denim|denim|Eco-friendly;';
      const result = parseItemAspects(itemAspectsString);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('Material');
    });
  });

  describe('getItemSpecificsAttributes', () => {
    it('returns parsed attributes from itemAspects', () => {
      const publicData = {
        itemAspects: 'Material|material: Handspun Denim|handspun_denim|Eco-friendly; Type|type: Pencil Pouch|pencil_pouch|Fun',
      };

      const result = getItemSpecificsAttributes(publicData);

      expect(result).toEqual([
        { key: 'Material', value: 'Handspun Denim' },
        { key: 'Type', value: 'Pencil Pouch' },
      ]);
    });

    it('includes brand at the beginning if provided and not in itemAspects', () => {
      const publicData = {
        brand: 'Choose Kind',
        itemAspects: 'Material|material: Handspun Denim|handspun_denim|Eco-friendly',
      };

      const result = getItemSpecificsAttributes(publicData);

      expect(result[0]).toEqual({ key: 'Brand', value: 'Choose Kind' });
      expect(result[1]).toEqual({ key: 'Material', value: 'Handspun Denim' });
    });

    it('does not duplicate brand if already in itemAspects', () => {
      const publicData = {
        brand: 'Choose Kind',
        itemAspects: 'Brand|brand: Choose Kind|choose_kind|Sustainable brand; Material|material: Denim|denim|Eco',
      };

      const result = getItemSpecificsAttributes(publicData);

      expect(result).toHaveLength(2);
      expect(result.filter(attr => attr.key.toLowerCase() === 'brand')).toHaveLength(1);
    });

    it('includes SKU at the end if provided', () => {
      const publicData = {
        itemAspects: 'Material|material: Denim|denim|Eco',
        sku: 'CK-PP-001',
      };

      const result = getItemSpecificsAttributes(publicData);

      expect(result[result.length - 1]).toEqual({ key: 'SKU', value: 'CK-PP-001' });
    });

    it('returns empty array if no itemAspects and no brand', () => {
      const publicData = {};

      const result = getItemSpecificsAttributes(publicData);

      expect(result).toEqual([]);
    });

    it('returns only brand and SKU if no itemAspects', () => {
      const publicData = {
        brand: 'Choose Kind',
        sku: 'CK-PP-001',
      };

      const result = getItemSpecificsAttributes(publicData);

      expect(result).toEqual([
        { key: 'Brand', value: 'Choose Kind' },
        { key: 'SKU', value: 'CK-PP-001' },
      ]);
    });

    it('handles malformed itemAspects gracefully', () => {
      const publicData = {
        brand: 'Choose Kind',
        itemAspects: 'Invalid format without proper structure',
      };

      const result = getItemSpecificsAttributes(publicData);

      expect(result).toEqual([{ key: 'Brand', value: 'Choose Kind' }]);
    });
  });

  describe('getItemAspectsForSEO', () => {
    it('returns combined descriptions from item aspects', () => {
      const publicData = {
        itemAspects:
          'Material|material: Handspun Denim|handspun_denim|Eco-friendly and artisan-crafted; Type|type: Pencil Pouch|pencil_pouch|Fun and stylish; Design|design: Embroidered|embroidered|Playful',
      };

      const result = getItemAspectsForSEO(publicData);

      expect(result).toBe(
        'Material: Eco-friendly and artisan-crafted. Type: Fun and stylish. Design: Playful'
      );
    });

    it('returns empty string if no itemAspects', () => {
      const publicData = {};

      const result = getItemAspectsForSEO(publicData);

      expect(result).toBe('');
    });

    it('returns empty string if itemAspects is empty', () => {
      const publicData = {
        itemAspects: '',
      };

      const result = getItemAspectsForSEO(publicData);

      expect(result).toBe('');
    });

    it('filters out aspects without descriptions', () => {
      const publicData = {
        itemAspects:
          'Material|material: Handspun Denim|handspun_denim|Eco-friendly; Type|type: Pencil Pouch|pencil_pouch',
      };

      const result = getItemAspectsForSEO(publicData);

      expect(result).toBe('Material: Eco-friendly');
    });

    it('handles single aspect with description', () => {
      const publicData = {
        itemAspects: 'Material|material: Handspun Denim|handspun_denim|Eco-friendly and artisan-crafted',
      };

      const result = getItemAspectsForSEO(publicData);

      expect(result).toBe('Material: Eco-friendly and artisan-crafted');
    });

    it('handles malformed itemAspects', () => {
      const publicData = {
        itemAspects: 'Invalid format',
      };

      const result = getItemAspectsForSEO(publicData);

      expect(result).toBe('');
    });
  });
});
