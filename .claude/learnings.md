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

## Session Log
2024-10-10: Fixed CategoryProducts to display proper category names + product filtering improvements
2025-10-10: Implemented HeroProducts with real API integration, randomization, and comprehensive testing
2025-10-13: Resolved image quality issues - switched to predefined high-res variants + enhanced quality settings
2025-11-18: Phase 2 - CategoryShowcase product-first, ListingCard badges, image variant fallback