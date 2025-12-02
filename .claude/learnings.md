# Learnings Log

This file tracks patterns, solutions, and insights discovered while working on the Mela project.

## Patterns

### Category Name Resolution
- **Follow CategoryBreadcrumb pattern**: Use `findCategoryById` + `resolveCategoryNames` helpers
- **Data source**: `config.categoryConfiguration?.categories` contains category objects with `name` property
- **Display logic**: `categoryItem?.name || categoryId` resolves IDs to human-readable names
- **Never**: Create custom humanization functions - use the configuration data

### Variable Name Verification
- **Always check actual variable names** before referencing in components
- **Example**: ListingPage components use `currentListing` not `listing`
- **Pattern**: Read component code to verify variable names, don't assume based on other components

### Redux Duck Pattern
- **File Structure**: `src/ducks/[feature].duck.js` - actions, reducer, thunk in one file
- **Registration**: Add to `src/ducks/index.js` import/export
- **Thunk signature**: `(config) => (dispatch, getState, sdk) => Promise`

### Sharetribe SDK Integration
- **Import pattern**: `import { types as sdkTypes } from '../util/sdkLoader'` (never direct `sharetribe-sdk`)
- **API response**: `sdk.listings.query()` returns `{ data: { data: [], included: [] } }`
- **Image handling**: Attach images from `included` array via relationships
- **Query optimization**: Use `fields.listing`, `fields.image`, `imageVariant.*` for efficiency

### Testing Patterns
```javascript
// Redux Duck Tests
describe('feature.duck', () => {
  describe('Reducer', () => { /* test initial state, actions */ });
  describe('Action creators', () => { /* test action functions */ });
  describe('Thunk', () => { /* test async with mocked SDK */ });
});

// Redux Component Tests - Mock store setup
const store = createStore(() => mockState);
store.dispatch = jest.fn();

// Complete test wrapper (prevents route/context failures)
const TestWrapper = ({ children, config = mockConfig }) => (
  <MemoryRouter>
    <IntlProvider locale="en" messages={mockMessages}>
      <ConfigurationProvider value={config}>
        <RouteConfigurationProvider value={mockRoutes}>
          {children}
        </RouteConfigurationProvider>
      </ConfigurationProvider>
    </IntlProvider>
  </MemoryRouter>
);

// Mock route configuration (required for NamedLink components)
const mockRouteConfiguration = [
  { path: '/signup', exact: true, name: 'SignupPage' },
  { path: '/login', exact: true, name: 'LoginPage' }
];
```

## Issues & Solutions

### SearchPage.duck.js Testing (Duck with Nested Thunks)
- **Issue**: Tests for `searchListings` showed SDK not being called with expected fields
- **Root cause**: `loadData` is the public API that adds `fields.listing`/`include`, then calls `searchListings`
- **Solution**: Test `loadData` not `searchListings`, and make mockDispatch execute thunks
```javascript
// CRITICAL: mockDispatch must execute thunks
const mockDispatch = jest.fn(action => {
  if (typeof action === 'function') {
    return action(mockDispatch, mockGetState, mockSdk);
  }
  return action;
});

// Test loadData (adds fields), not searchListings (makes SDK call)
const thunk = loadData(params, '?page=1', config);
await thunk(mockDispatch, mockGetState, mockSdk);

// Now mockQuery.mock.calls[0][0] has fields.listing, include, etc.
```
- **Required config**: `currency`, `listing.enforceValidListingType`, `layout.listingImage`, `accessControl.marketplace.private`
- **Mock dependencies**: Mock `../../ducks/marketplaceData.duck` addMarketplaceEntities

### CategoryProducts Display Fix (Product Pages)
- **Issue**: UI showed category IDs ("baby-clothing") instead of readable names ("Baby Clothing")
- **Solution**: Applied CategoryBreadcrumb resolution pattern to convert IDs to display names
- **Additional**: Increased products 6→9, exclude current listing from recommendations
- **Key fix**: Used `currentListing?.id?.uuid` not `listing?.id?.uuid` in both ListingPage variants

### Sharetribe Category Hierarchy
- **3-level structure**: Top level (Baby Clothes & Accessories) → Level 2 (Clothing, Shoes) → Level 3 (Tops, Bottoms)
- **Showcase pattern**: Use level 2 for main categories, level 3 for featured items
- **Helper function**: `getShowcaseCategories` extracts subcategories from top-level config
- **Dynamic mapping**: `formatCategoryForDisplay` converts category structure to UI data

### Sharetribe Image Quality Optimization
- **Predefined variants priority**: Use `landscape-crop6x` (2400px), `landscape-crop4x` (1600px) over custom variants
- **Quality enhancement**: Set `q: 85, f: 'auto'` in `createImageVariantConfig` for better quality + WebP support
- **ResponsiveImage pattern**: Always include fallback `src` attribute, not just `srcSet`
- **Sizes optimization**: Use responsive sizes like `(max-width: 767px) 100vw, (max-width: 1024px) 80vw` for high-DPI
- **Variant ordering**: List highest quality first: `['landscape-crop6x', 'landscape-crop4x', 'landscape-crop2x', 'scaled-xlarge']`
- **Test updates**: Update duck tests to expect enhanced quality params: `'w:400;h:400;fit:crop;q:85;f:auto'`

### Sharetribe Listing Fields & Item Aspects Integration
- **Listing Fields**: User-facing filters configured in Sharetribe Console with Name|Value pairs (e.g., "Organic Cotton|organic_cotton")
- **Item Aspects**: Raw classified metadata from ML prompt_engine.py stored as semicolon-separated key-value pairs
- **Integration**: Item Aspects feed into Listing Fields via name-to-value mapping for consistent filtering
- **Configuration**: Use `/scrapper and classifiers/documentation/listing-fields-mapping.json` for field definitions

### Common Test Issues & Solutions
- **SDK import errors**: Use `../util/sdkLoader` not `sharetribe-sdk`
- **Multiple elements**: Use `getAllByTestId` when elements share test IDs
- **Redux connection**: Always wrap with Provider + mock store
- **RouteConfiguration errors**: "reduce is not a function" = missing RouteConfigurationProvider array
- **State shape**: Match exact Redux state structure in test mocks
- **IntersectionObserver errors**: JSDOM limitation - mock needed for components using viewport detection

### SDK Initialization (Follow index.js Pattern)
```javascript
const baseUrl = appSettings.sdk.baseUrl ? { baseUrl: appSettings.sdk.baseUrl } : {};
const sdk = createInstance({
  transitVerbose: appSettings.sdk.transitVerbose,
  clientId: appSettings.sdk.clientId,
  secure: appSettings.usingSSL,
  typeHandlers: apiUtils.typeHandlers,
  ...baseUrl,
  ...assetCdnBaseUrl,
});
```

### Parallel SDK Fetches + Entity Accumulation
- **Issue**: Updating shared object in parallel async = race condition
- **Fix**: Fetch parallel, accumulate sequential
```javascript
const results = await Promise.all(fetchPromises);
let allEntities = {};
results.forEach(r => allEntities = updatedEntities(allEntities, r.responseData, config));
```

### Image Variant Fallback
- **Issue**: Filtering for `listing-card` variants returns empty array if only `default` exists
- **Fix**: `const variants = prefixedVariants.length > 0 ? prefixedVariants : availableVariants;`

### ListingCard Badges (Phase 2)
- **TrustBadges**: Top-left, max 2 certs, white bg
- **ConversionBadges**: Top-right, priority: bestseller > low stock (≤5, red) > new
- **Pattern**: Absolute position within `position: relative` parent

### Sharetribe addMarketplaceEntities Payload Format
- **Issue**: `TypeError: curr is undefined` in `util/data.js` when dispatching entities
- **Root cause**: `addMarketplaceEntities` expects `{ data: { data: [...], included: [...] } }` (nested data structure)
- **Wrong**: `dispatch(addMarketplaceEntities({ data: [...users], included: [...] }))`
- **Correct**: `dispatch(addMarketplaceEntities({ data: { data: [...users], included: [...] } }))`
- **Function signature**: `addMarketplaceEntities(sdkResponse, sanitizeConfig)` where `sdkResponse.data` contains the entities
- **Why nested**: Matches Sharetribe SDK response format where `response.data.data` contains entities

### Entity Denormalization for Relationships
- **Issue**: Profile images not appearing even though included in API response
- **Root cause**: Selectors returning raw entities without joining relationships
- **Solution**: Use `denormalisedEntities(entities, entityRefs, throwIfNotFound)` to join relationships
- **When needed**: Accessing `user.profileImage`, `listing.images`, `listing.author`, or any relationship
- **Entity refs format**: `[{ id: { uuid: 'xxx' }, type: 'user' }]`
- **Example**: See ProfilePage or BrandsPage selectors for pattern

### Handling Null Relationships in Entities
- **Issue**: Reducer errors when entity has `relationships.profileImage.data: null`
- **Root cause**: Users without profile images have null relationship data which breaks marketplace reducer
- **Solution**: Filter out relationships with `data === null` before dispatching to `addMarketplaceEntities`
- **Pattern**: Create clean entity objects with only valid (non-null) relationships
- **Don't mutate**: Build fresh objects instead of using `delete` on SDK response objects

## Session Log
2024-10-10: Fixed CategoryProducts to display proper category names + product filtering improvements
2025-10-10: Implemented HeroProducts with real API integration, randomization, and comprehensive testing
2025-10-13: Resolved image quality issues - switched to predefined high-res variants + enhanced quality settings
2025-11-18: Phase 2 - CategoryShowcase product-first, ListingCard badges, image variant fallback
2025-11-29: Fixed addMarketplaceEntities payload format issue in Brands page implementation