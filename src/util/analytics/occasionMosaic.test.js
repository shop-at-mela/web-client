import { pushMosaicImpression, pushMosaicTileClick } from './occasionMosaic';

describe('occasionMosaic analytics', () => {
  beforeEach(() => {
    window.dataLayer = [];
  });

  it('pushes an impression with position, tile count and listing id', () => {
    pushMosaicImpression('diwali', 1, 4, 'abc');
    expect(window.dataLayer).toEqual([
      { event: 'mosaic_impression', occasion: 'diwali', position: 1, tile_count: 4, listing_id: 'abc' },
    ]);
  });

  it('pushes a click, with a null listing id when none is known', () => {
    pushMosaicTileClick('gifting', 3, 4);
    expect(window.dataLayer).toEqual([
      { event: 'mosaic_tile_click', occasion: 'gifting', position: 3, tile_count: 4, listing_id: null },
    ]);
  });
});
