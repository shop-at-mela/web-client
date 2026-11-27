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

const { listingSitemapPaths, queryAllListingPaths } = require('./sitemap');

const listing = (uuid, title) => ({ id: { uuid }, attributes: { title } });

describe('sitemap listings', () => {
  it('emits canonical l/:slug/:id paths, never bare l/:id', () => {
    const paths = listingSitemapPaths([
      listing('aaa', 'Rose Print Kurta Set'),
      listing('bbb', ''),
      { attributes: { title: 'no id' } },
    ]);
    expect(paths).toEqual(['l/rose-print-kurta-set/aaa', 'l/no-slug/bbb']);
    paths.forEach(p => expect(p).toMatch(/^l\/[^/]+\/[^/]+$/));
  });

  it('pages through every published listing, titles only', async () => {
    const query = jest.fn(({ page }) =>
      Promise.resolve({
        data: {
          data: [listing(`id-${page}`, `Item ${page}`)],
          meta: { totalPages: 3 },
        },
      })
    );
    const paths = await queryAllListingPaths({ listings: { query } });
    expect(query).toHaveBeenCalledTimes(3);
    expect(query).toHaveBeenCalledWith({ page: 1, perPage: 100, 'fields.listing': ['title'] });
    expect(paths).toEqual(['l/item-1/id-1', 'l/item-2/id-2', 'l/item-3/id-3']);
  });

  it('stops at 100 pages (10 000 listings)', async () => {
    const query = jest.fn(() => Promise.resolve({ data: { data: [], meta: { totalPages: 500 } } }));
    await queryAllListingPaths({ listings: { query } });
    expect(query).toHaveBeenCalledTimes(100);
  });
});
