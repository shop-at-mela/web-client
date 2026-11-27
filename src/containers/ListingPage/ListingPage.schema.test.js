import React from 'react';
import '@testing-library/jest-dom';

import { types as sdkTypes } from '../../util/sdkLoader';
import { createUser, createListing } from '../../util/testData';
import {
  renderWithProviders as render,
  testingLibrary,
  getRouteConfiguration,
  getHostedConfiguration,
  getDefaultConfiguration,
} from '../../util/testHelpers';
import { mergeConfig } from '../../util/configHelpers';
import { createIntl, createIntlCache } from '../../util/reactIntl';
import enMessages from '../../translations/en.json';

import { ListingPageComponent as CarouselComponent } from './ListingPageCarousel';
import { ListingPageComponent as CoverPhotoComponent } from './ListingPageCoverPhoto';

const { UUID } = sdkTypes;
const { waitFor } = testingLibrary;

// Real messages so the SEO description fallback can be asserted as it ships.
const testIntl = createIntl({ locale: 'en', messages: enMessages }, createIntlCache());

global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const listingTypes = [
  {
    id: 'sell-bicycles',
    transactionProcess: {
      name: 'default-purchase',
      alias: 'default-purchase/release-1',
    },
    unitType: 'item',
  },
  {
    id: 'rent-bicycles-nightly',
    transactionProcess: {
      name: 'default-booking',
      alias: 'default-booking/release-1',
    },
    unitType: 'night',
  },
  {
    id: 'rent-bicycles-daily',
    transactionProcess: {
      name: 'default-booking',
      alias: 'default-booking/release-1',
    },
    unitType: 'day',
  },
];

const capitalizeFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1);
const addSpaces = str => str.split('-').join(' ');
const labelize = str => addSpaces(capitalizeFirstLetter(str));

const generateCategories = optionStrings => {
  return optionStrings.reduce((converted, entry) => {
    const isArray = Array.isArray(entry);
    const option = isArray
      ? { id: entry[0], name: labelize(entry[0]), subcategories: generateCategories(entry[1]) }
      : { id: entry, name: labelize(entry) };
    return [...converted, option];
  }, []);
};
const categories = generateCategories([
  ['dogs', ['labradors', 'poodles']],
  ['cats', ['burmese', 'egyptian-mau']],
  ['fish', [['freshwater', ['grayling', 'arctic-char', 'pike']], 'saltwater']],
  ['birds', ['parrot', 'macaw']],
]);
//console.log(JSON.stringify(categories, null, 2));

const listingFields = [
  {
    key: 'cat',
    scope: 'public',
    listingTypeConfig: {
      limitToListingTypeIds: true,
      listingTypeIds: ['sell-bicycles'],
    },
    categoryConfig: {
      limitToCategoryIds: true,
      categoryIds: ['cats'],
    },
    schemaType: 'enum',
    enumOptions: [{ option: 'cat_1', label: 'Cat 1' }, { option: 'cat_2', label: 'Cat 2' }],
    filterConfig: {
      showFilter: true,
    },
    showConfig: {
      label: 'Cat',
      isDetail: true,
    },
  },
  {
    key: 'amenities',
    scope: 'public',
    listingTypeConfig: {
      limitToListingTypeIds: true,
      listingTypeIds: ['rent-bicycles-daily', 'rent-bicycles-nightly', 'rent-bicycles-hourly'],
    },
    schemaType: 'multi-enum',
    enumOptions: [
      { option: 'feat_1', label: 'Feat 1' },
      { option: 'feat_2', label: 'Feat 2' },
      { option: 'feat_3', label: 'Feat 3' },
    ],
    filterConfig: {
      showFilter: true,
    },
    showConfig: {
      label: 'Amenities',
      searchMode: 'has_all',
      group: 'secondary',
    },
  },
];

const getConfig = variantType => {
  const hostedConfig = getHostedConfiguration();
  return {
    ...hostedConfig,
    // mergeConfig() derives listing.listingTypes/listingFields and categoryConfiguration
    // from these raw hosted-asset shapes (see util/configHelpers.js mergeListingConfig /
    // mergeConfig), ignoring a `listing`/`categoryConfiguration` key passed in directly.
    listingTypes: { listingTypes },
    listingFields: { listingFields },
    categories: { categories },
    layout: {
      ...hostedConfig.layout,
      listingPage: { variantType },
    },
  };
};

const SEARCH = '?utm_source=pinterest&utm_medium=social&utm_campaign=brand_w1';
const HASH = '#reviews';

const brandListing = ({ brand, brandStoreUrl, extraPublicData = {}, extraAttributes = {} }) =>
  createListing(
    'listing-schema',
    {
      ...extraAttributes,
      title: 'Cotton Kurta',
      description: 'A soft cotton kurta.',
      publicData: {
        listingType: 'sell-bicycles',
        transactionProcessAlias: 'default-purchase/release-1',
        unitType: 'item',
        categoryLevel1: 'cats',
        cat: 'cat_1',
        ...(brand ? { brand } : {}),
        ...extraPublicData,
      },
    },
    {
      author: createUser('brand-author', {
        profile: {
          displayName: brand || 'Author',
          abbreviatedName: 'BA',
          publicData: brandStoreUrl ? { brandStoreUrl } : {},
        },
      }),
      currentStock: 1,
    }
  );

const renderPage = (Component, variantType, listing, overrides = {}) => {
  const config = getConfig(variantType);
  const props = {
    config: mergeConfig(config, getDefaultConfiguration()),
    intl: testIntl,
    params: { id: 'listing-schema', slug: 'cotton-kurta' },
    getListing: () => listing,
    getOwnListing: () => null,
    reviews: [],
    fetchReviewsInProgress: false,
    fetchReviewsError: null,
    sendReviewInProgress: false,
    sendReviewError: null,
    monthlyTimeSlots: {},
    fetchTimeSlotsError: null,
    filterConfig: [],
    showListingError: null,
    callSetInitialValues: jest.fn(),
    onManageDisableScrolling: jest.fn(),
    onFetchTimeSlots: jest.fn(),
    onFetchReviews: jest.fn(),
    onSendReview: jest.fn(),
    scrollingDisabled: false,
    inquiryModalOpenForListingId: null,
    lineItems: null,
    fetchLineItemsInProgress: false,
    fetchLineItemsError: null,
    onContactUser: jest.fn(),
    onSubmitInquiry: jest.fn(),
    history: { push: jest.fn() },
    location: { search: SEARCH, hash: HASH, pathname: '/l/cotton-kurta/listing-schema' },
    ...overrides,
  };
  return render(<Component {...props} />, { config, routeConfiguration: getRouteConfiguration() });
};

const readProductSchema = async () => {
  let product;
  await waitFor(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    const graphs = scripts.map(s => JSON.parse(s.textContent));
    const nodes = graphs.flatMap(g => g['@graph'] || [g]);
    product = nodes.find(n => n['@type'] === 'Product');
    expect(product).toBeTruthy();
  });
  return product;
};

describe.each([['carousel', CarouselComponent], ['coverPhoto', CoverPhotoComponent]])(
  'Product JSON-LD (%s layout)',
  (variantType, Component) => {
    afterEach(() => {
      document.head.innerHTML = '';
    });

    it('makes the brand the seller, with its own store URL when present', async () => {
      renderPage(
        Component,
        variantType,
        brandListing({ brand: 'Nicobar', brandStoreUrl: 'https://global.nicobar.com' })
      );
      const product = await readProductSchema();
      expect(product.offers.seller).toEqual({
        '@type': 'Organization',
        name: 'Nicobar',
        url: 'https://global.nicobar.com',
      });
      expect(product.brand).toEqual({ '@type': 'Brand', name: 'Nicobar' });
    });

    it('asserts no seller at all when the listing has no brand (never Mela)', async () => {
      renderPage(Component, variantType, brandListing({ brand: null }));
      const product = await readProductSchema();
      expect(product.offers.seller).toBeUndefined();
      expect(JSON.stringify(product)).not.toMatch(/"seller"/);
    });

    it('has no audience, no Target Market property and no diaspora wording', async () => {
      renderPage(Component, variantType, brandListing({ brand: 'Nicobar' }));
      const product = await readProductSchema();
      expect(product.audience).toBeUndefined();
      const json = JSON.stringify(product);
      expect(json).not.toMatch(/Target Market/);
      expect(json).not.toMatch(/diaspora/i);
      expect(json).not.toMatch(/delivered to USA/i);
    });

    it('has no shipping details in the offer (PRD P2.1 is blocked)', async () => {
      renderPage(Component, variantType, brandListing({ brand: 'Nicobar' }));
      const product = await readProductSchema();
      expect(product.offers.shippingDetails).toBeUndefined();
      expect(JSON.stringify(product)).not.toMatch(/shippingDetails|OfferShippingDetails/);
    });

    it('offers.url is the canonical path without query string or hash', async () => {
      renderPage(Component, variantType, brandListing({ brand: 'Nicobar' }));
      const product = await readProductSchema();
      expect(product.offers.url).toMatch(/\/l\/cotton-kurta\/listing-schema$/);
      expect(product.offers.url).not.toMatch(/[?#]|utm_/);
    });

    it('uses the neutral fallback description when the listing has no metaDescription', async () => {
      renderPage(Component, variantType, brandListing({ brand: 'Nicobar' }));
      const product = await readProductSchema();
      expect(product.description).toMatch(/^Cotton Kurta by Nicobar, curated on /);
      expect(product.description.length).toBeLessThanOrEqual(160);
      expect(product.description).not.toMatch(/diaspora|delivered|authentic/i);
    });

    it('has no Cultural Heritage property and a product-first title', async () => {
      renderPage(Component, variantType, brandListing({ brand: 'Nicobar' }));
      const product = await readProductSchema();
      expect(JSON.stringify(product)).not.toMatch(/Cultural Heritage|Authentic Indian/);
      await waitFor(() => expect(document.title).toBe('Cotton Kurta by Nicobar | MarketplaceX'));
    });

    it('keeps a listing metaDescription when one is set', async () => {
      renderPage(
        Component,
        variantType,
        brandListing({ brand: 'Nicobar', extraPublicData: { metaDescription: 'Custom meta.' } })
      );
      const product = await readProductSchema();
      expect(product.description).toBe('Custom meta.');
    });

    it('declares the slug URL as canonical, equal to offers.url', async () => {
      renderPage(Component, variantType, brandListing({ brand: 'Nicobar' }));
      const product = await readProductSchema();
      const canonical = document.head.querySelector('link[rel="canonical"]');
      expect(canonical.getAttribute('href')).toBe(product.offers.url);
      expect(canonical.getAttribute('href')).toMatch(/\/l\/cotton-kurta\/listing-schema$/);
    });

    it('marks a closed listing OutOfStock', async () => {
      renderPage(
        Component,
        variantType,
        brandListing({ brand: 'Nicobar', extraAttributes: { state: 'closed' } })
      );
      const product = await readProductSchema();
      expect(product.offers.availability).toBe('https://schema.org/OutOfStock');
    });

    it('emits no Product node when there is no price (never an Offer without a price)', async () => {
      renderPage(
        Component,
        variantType,
        brandListing({ brand: 'Nicobar', extraAttributes: { price: null } })
      );
      await waitFor(() =>
        expect(document.head.querySelector('link[rel="canonical"]')).toBeTruthy()
      );
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      expect(scripts.map(sc => sc.textContent).join('')).not.toMatch(/"@type":"Product"/);
    });
  }
);

describe.each([['carousel', CarouselComponent], ['coverPhoto', CoverPhotoComponent]])(
  'SSR status flags (%s layout)',
  (variantType, Component) => {
    it.each([['no slug (/l/:id)', undefined], ['an old or wrong slug', 'old-title']])(
      'marks the redirect for %s as permanent (301)',
      (_label, slug) => {
        const staticContext = {};
        renderPage(Component, variantType, brandListing({ brand: 'Nicobar' }), {
          params: { id: 'listing-schema', ...(slug ? { slug } : {}) },
          staticContext,
        });
        expect(staticContext.permanentRedirect).toBe(true);
      }
    );

    it('does not redirect the canonical slug URL', () => {
      const staticContext = {};
      renderPage(Component, variantType, brandListing({ brand: 'Nicobar' }), { staticContext });
      expect(staticContext.permanentRedirect).toBeUndefined();
    });

    it('answers a malformed listing id (400) with a 404', () => {
      const staticContext = {};
      renderPage(Component, variantType, brandListing({ brand: 'Nicobar' }), {
        showListingError: { status: 400 },
        staticContext,
      });
      expect(staticContext.notfound).toBe(true);
      expect(staticContext.unavailable).toBeUndefined();
    });

    it('answers a non-UUID listing id with a 404 even when the error has no status', () => {
      const staticContext = {};
      renderPage(Component, variantType, brandListing({ brand: 'Nicobar' }), {
        params: { id: 'not-a-uuid', slug: 'x' },
        showListingError: { type: 'error' },
        staticContext,
      });
      expect(staticContext.notfound).toBe(true);
      expect(staticContext.unavailable).toBeUndefined();
    });

    it.each([429, 500, 503])(
      'marks a %s listing error as temporarily unavailable (503)',
      status => {
        const staticContext = {};
        renderPage(Component, variantType, brandListing({ brand: 'Nicobar' }), {
          params: { id: '00000000-0000-0000-0000-000000000001', slug: 'cotton-kurta' },
          showListingError: { status },
          staticContext,
        });
        expect(staticContext.unavailable).toBe(true);
        expect(staticContext.notfound).toBeUndefined();
      }
    );
  }
);
