import React from 'react';
import '@testing-library/jest-dom';

describe('Category Resolution Functions', () => {
  // Mock category configuration structure from the console output
  const mockCategoryConfig = [
    {
      "name": "Baby Clothes & Accessories",
      "id": "Baby-Clothes-Accessories",
      "subcategories": [
        {
          "name": "Clothing",
          "id": "Baby-Clothing",
          "subcategories": [
            {
              "name": "Tops & One-Pieces",
              "id": "Baby-Clothing-Tops-One-Pieces",
              "subcategories": []
            },
            {
              "name": "Bottoms",
              "id": "Baby-Clothing-Bottoms",
              "subcategories": []
            },
            {
              "name": "Outerwear & Jackets",
              "id": "Baby-Clothing-Outerwear-Jackets",
              "subcategories": []
            }
          ]
        },
        {
          "name": "Shoes",
          "id": "Baby-Shoes",
          "subcategories": [
            {
              "name": "Booties & First Walkers",
              "id": "Baby-Shoes-Booties-First-Walkers",
              "subcategories": []
            },
            {
              "name": "Sneakers",
              "id": "Baby-Shoes-Sneakers",
              "subcategories": []
            }
          ]
        }
      ]
    },
    {
      "name": "Electronics",
      "id": "Electronics",
      "subcategories": [
        {
          "name": "Computers",
          "id": "Electronics-Computers",
          "subcategories": [
            {
              "name": "Laptops",
              "id": "Electronics-Computers-Laptops",
              "subcategories": []
            }
          ]
        }
      ]
    }
  ];

  // Helper function to recursively search through nested category structure
  const findCategoryById = (categories, categoryId) => {
    if (!categories || !Array.isArray(categories)) return null;

    for (const category of categories) {
      if (category.id === categoryId) {
        return category;
      }
      if (category.subcategories && category.subcategories.length > 0) {
        const found = findCategoryById(category.subcategories, categoryId);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to resolve category IDs to readable names
  const resolveCategoryNames = (categoryIds, categoryConfig) => {
    if (!categoryConfig || !categoryIds) return {};

    const resolved = {};
    Object.keys(categoryIds).forEach(levelKey => {
      const categoryId = categoryIds[levelKey];
      if (categoryId) {
        const categoryItem = findCategoryById(categoryConfig, categoryId);
        resolved[levelKey] = categoryItem?.name || categoryId; // Use 'name' property
      }
    });
    return resolved;
  };

  describe('findCategoryById', () => {
    it('finds category at top level', () => {
      const result = findCategoryById(mockCategoryConfig, 'Electronics');
      expect(result).toBeDefined();
      expect(result.name).toBe('Electronics');
      expect(result.id).toBe('Electronics');
    });

    it('finds category at second level', () => {
      const result = findCategoryById(mockCategoryConfig, 'Baby-Clothing');
      expect(result).toBeDefined();
      expect(result.name).toBe('Clothing');
      expect(result.id).toBe('Baby-Clothing');
    });

    it('finds category at third level', () => {
      const result = findCategoryById(mockCategoryConfig, 'Baby-Clothing-Tops-One-Pieces');
      expect(result).toBeDefined();
      expect(result.name).toBe('Tops & One-Pieces');
      expect(result.id).toBe('Baby-Clothing-Tops-One-Pieces');
    });

    it('finds category in different branch', () => {
      const result = findCategoryById(mockCategoryConfig, 'Baby-Shoes-Sneakers');
      expect(result).toBeDefined();
      expect(result.name).toBe('Sneakers');
      expect(result.id).toBe('Baby-Shoes-Sneakers');
    });

    it('returns null for non-existent category', () => {
      const result = findCategoryById(mockCategoryConfig, 'Non-Existent-Category');
      expect(result).toBeNull();
    });

    it('handles null or undefined categories array', () => {
      expect(findCategoryById(null, 'Any-Category')).toBeNull();
      expect(findCategoryById(undefined, 'Any-Category')).toBeNull();
      expect(findCategoryById([], 'Any-Category')).toBeNull();
    });

    it('handles non-array categories input', () => {
      expect(findCategoryById('not-an-array', 'Any-Category')).toBeNull();
      expect(findCategoryById({}, 'Any-Category')).toBeNull();
    });

    it('handles categories without subcategories', () => {
      const simpleCategoryConfig = [
        { name: 'Simple', id: 'simple-id' }
      ];
      const result = findCategoryById(simpleCategoryConfig, 'simple-id');
      expect(result).toBeDefined();
      expect(result.name).toBe('Simple');
    });
  });

  describe('resolveCategoryNames', () => {
    it('resolves single level category', () => {
      const categoryIds = {
        level1: 'Baby-Clothes-Accessories'
      };

      const result = resolveCategoryNames(categoryIds, mockCategoryConfig);

      expect(result).toEqual({
        level1: 'Baby Clothes & Accessories'
      });
    });

    it('resolves multiple level categories', () => {
      const categoryIds = {
        level1: 'Baby-Clothes-Accessories',
        level2: 'Baby-Clothing',
        level3: 'Baby-Clothing-Tops-One-Pieces'
      };

      const result = resolveCategoryNames(categoryIds, mockCategoryConfig);

      expect(result).toEqual({
        level1: 'Baby Clothes & Accessories',
        level2: 'Clothing',
        level3: 'Tops & One-Pieces'
      });
    });

    it('resolves categories from different branches', () => {
      const categoryIds = {
        level1: 'Electronics',
        level2: 'Electronics-Computers',
        level3: 'Electronics-Computers-Laptops'
      };

      const result = resolveCategoryNames(categoryIds, mockCategoryConfig);

      expect(result).toEqual({
        level1: 'Electronics',
        level2: 'Computers',
        level3: 'Laptops'
      });
    });

    it('handles sparse category levels', () => {
      const categoryIds = {
        level1: 'Baby-Clothes-Accessories',
        level3: 'Baby-Clothing-Tops-One-Pieces' // Missing level2
      };

      const result = resolveCategoryNames(categoryIds, mockCategoryConfig);

      expect(result).toEqual({
        level1: 'Baby Clothes & Accessories',
        level3: 'Tops & One-Pieces'
      });
      expect(result.level2).toBeUndefined();
    });

    it('falls back to category ID when not found in config', () => {
      const categoryIds = {
        level1: 'Baby-Clothes-Accessories',
        level2: 'Non-Existent-Category'
      };

      const result = resolveCategoryNames(categoryIds, mockCategoryConfig);

      expect(result).toEqual({
        level1: 'Baby Clothes & Accessories',
        level2: 'Non-Existent-Category' // Falls back to ID
      });
    });

    it('handles empty category IDs', () => {
      const categoryIds = {};

      const result = resolveCategoryNames(categoryIds, mockCategoryConfig);

      expect(result).toEqual({});
    });

    it('handles null/undefined category IDs', () => {
      expect(resolveCategoryNames(null, mockCategoryConfig)).toEqual({});
      expect(resolveCategoryNames(undefined, mockCategoryConfig)).toEqual({});
    });

    it('handles null/undefined category config', () => {
      const categoryIds = {
        level1: 'Baby-Clothes-Accessories'
      };

      expect(resolveCategoryNames(categoryIds, null)).toEqual({});
      expect(resolveCategoryNames(categoryIds, undefined)).toEqual({});
    });

    it('handles category IDs with null/undefined values', () => {
      const categoryIds = {
        level1: 'Baby-Clothes-Accessories',
        level2: null,
        level3: undefined,
        level4: ''
      };

      const result = resolveCategoryNames(categoryIds, mockCategoryConfig);

      expect(result).toEqual({
        level1: 'Baby Clothes & Accessories'
        // level2, level3, level4 should not be included
      });
    });

    it('handles categories with special characters in names', () => {
      const specialCategoryConfig = [
        {
          name: 'Baby & Kids',
          id: 'baby-kids',
          subcategories: [
            {
              name: 'Toys, Games & Books',
              id: 'toys-games-books',
              subcategories: []
            }
          ]
        }
      ];

      const categoryIds = {
        level1: 'baby-kids',
        level2: 'toys-games-books'
      };

      const result = resolveCategoryNames(categoryIds, specialCategoryConfig);

      expect(result).toEqual({
        level1: 'Baby & Kids',
        level2: 'Toys, Games & Books'
      });
    });

    it('handles deeply nested categories', () => {
      const deepCategoryConfig = [
        {
          name: 'Level 1',
          id: 'level-1',
          subcategories: [
            {
              name: 'Level 2',
              id: 'level-2',
              subcategories: [
                {
                  name: 'Level 3',
                  id: 'level-3',
                  subcategories: [
                    {
                      name: 'Level 4',
                      id: 'level-4',
                      subcategories: [
                        {
                          name: 'Level 5',
                          id: 'level-5',
                          subcategories: []
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ];

      const categoryIds = {
        level1: 'level-1',
        level2: 'level-2',
        level3: 'level-3',
        level4: 'level-4',
        level5: 'level-5'
      };

      const result = resolveCategoryNames(categoryIds, deepCategoryConfig);

      expect(result).toEqual({
        level1: 'Level 1',
        level2: 'Level 2',
        level3: 'Level 3',
        level4: 'Level 4',
        level5: 'Level 5'
      });
    });
  });

  describe('integration scenarios', () => {
    it('simulates real-world listing page category resolution', () => {
      // Simulate data that would come from currentListing.attributes.publicData
      const publicData = {
        categoryLevel1: 'Baby-Clothes-Accessories',
        categoryLevel2: 'Baby-Clothing',
        categoryLevel3: 'Baby-Clothing-Tops-One-Pieces'
      };

      const categoryIds = {
        level1: publicData.categoryLevel1,
        level2: publicData.categoryLevel2,
        level3: publicData.categoryLevel3
      };

      const resolvedNames = resolveCategoryNames(categoryIds, mockCategoryConfig);

      // This is what would be passed to CategoryBreadcrumb component
      expect(resolvedNames).toEqual({
        level1: 'Baby Clothes & Accessories',
        level2: 'Clothing',
        level3: 'Tops & One-Pieces'
      });
    });

    it('handles incomplete category paths gracefully', () => {
      // Some listings might only have level1 and level3 without level2
      const publicData = {
        categoryLevel1: 'Baby-Clothes-Accessories',
        categoryLevel3: 'Baby-Clothing-Tops-One-Pieces'
        // Missing categoryLevel2
      };

      const categoryIds = {
        level1: publicData.categoryLevel1,
        level2: publicData.categoryLevel2, // undefined
        level3: publicData.categoryLevel3
      };

      const resolvedNames = resolveCategoryNames(categoryIds, mockCategoryConfig);

      expect(resolvedNames).toEqual({
        level1: 'Baby Clothes & Accessories',
        level3: 'Tops & One-Pieces'
        // level2 should not be present
      });
    });
  });
});