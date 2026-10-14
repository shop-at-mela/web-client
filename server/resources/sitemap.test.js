const { categoryPaths } = require('./sitemap');

describe('sitemap categoryPaths', () => {
  it('lists level 1 and level 2 category URLs', () => {
    expect(
      categoryPaths([
        {
          id: 'Fashion',
          subcategories: [{ id: 'Women', subcategories: [{ id: 'Deep' }] }, { id: 'Men' }],
        },
        { id: 'Toys' },
      ])
    ).toEqual([
      { url: '/categories/Fashion' },
      { url: '/categories/Fashion/Women' },
      { url: '/categories/Fashion/Men' },
      { url: '/categories/Toys' },
    ]);
  });

  it('tolerates missing or malformed input', () => {
    expect(categoryPaths(undefined)).toEqual([]);
    expect(categoryPaths([{ name: 'no id' }, null])).toEqual([]);
  });
});
