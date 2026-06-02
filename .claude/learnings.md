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

### Mobile-First CSS for Feature Sections
- **Apply visual treatments progressively**: Minimal on mobile (maximize content), enhanced on desktop (breathing room)
- **Mobile (< 768px)**: Padding only, no backgrounds/borders/gradients
- **Tablet+**: Add backgrounds, borders, rounded corners
- **Why**: Mobile screen real estate is precious, desktop benefits from visual polish

### Horizontal Scroll Affordance
- **Show 15-20% of next card** to indicate scrollability (Netflix/Amazon/Airbnb pattern)
- **Progressive card counts**: 1+peek (mobile) → 2+peek (tablet) → 3+peek (desktop) → 4+peek (XL)
- **Use calc() for responsive widths**: `calc(31vw - 32px)` shows 3 full + 20% peek
- **Gradient indicator positioning**: Use `::before` on parent container (not scrolling child) so it stays fixed at edge
- **Padding structure**: Parent = vertical only, Header = horizontal, Scroll container = left only (right extends to edge)

### Tab Navigation Component Selection
- **LinkTabNavHorizontal**: For route-based navigation (`linkProps.name`, `linkProps.params`)
- **ButtonTabNavHorizontal**: For state-based navigation (`onClick` handlers)
- **Common mistake**: Using ButtonTabNavHorizontal with linkProps → empty/non-rendering tabs

### Lazy Loading Pattern
- **Intersection Observer** with 200px `rootMargin` for smooth loading before user reaches end
- **Batch size**: 12 items (3-4 rows on desktop grid)
- **Trigger element**: Invisible div with `ref` at end of visible items

### Test Prop Name Consistency
- **Issue**: Using parent component's variable name instead of child's actual prop name
- **Example**: BrandStorySection expects `brandStory` prop, not `bio` (even though parent has `bio`)
- **Pattern**: Read component implementation to verify exact prop names, don't assume

### path-to-regexp v8 Incompatibility with React Router v5 Optional Params
- **Issue**: `createResourceLocatorString` and `NamedLink` call `compile()` from path-to-regexp v8, which doesn't support the `?` optional param syntax (e.g., `/:level2?`). React Router v5 uses its own bundled path-to-regexp v1 for matching which does support `?`.
- **Impact**: Routes with optional params (like `/categories/:level1/:level2?/:level3?`) will throw at link-building time, not at match time.
- **Solution**: Build paths manually for routes with optional params instead of using `createResourceLocatorString`:
```javascript
const categoryPath = (level1, level2, level3) => {
  let path = `/categories/${level1}`;
  if (level2) path += `/${level2}`;
  if (level3) path += `/${level3}`;
  return path;
};
// Use <Link to={categoryPath(l1, l2)}> instead of <NamedLink name="CategoryPage" params={...}>
```
- **Applies to**: Any container that generates links to routes with `?` optional params.

### Canonical URL Override on Page Component
- **Pattern**: `Page` accepts a `canonicalURL` prop that overrides the auto-generated canonical.
- **Use case**: Brand pages at `/u/:uuid` should canonicalize to `/brands/:slug`. Category pages should canonicalize to the clean path (no query params).
- **Implementation**: `<Page canonicalURL={brandCanonicalUrl}>` — if `null`/`undefined`, falls back to normal behavior.

### Brand Slug ↔ UUID Resolution
- **Pattern**: `getBrandSlugById(uuid)` and `getBrandIdBySlug(slug)` in `src/config/configBrands.js`.
- **Used in**: `ProfilePage.js` (canonical URL), `ProfilePage.duck.js` (loadData for /brands/:brandSlug route), `BrandCard.js`, `BrandCardHome.js` (link routing).
- **Duck**: `loadData` branches on `params.brandSlug` — resolves slug → UUID, then calls shared `loadProfileByUserId`. Returns 404 error if slug not found.

### CategoryPage Reuses SearchPage Duck
- **No new duck needed**: CategoryPage connects to `state.SearchPage` (currentPageResultIds, searchInProgress).
- **loadData**: Points to `pageDataLoadingAPI.SearchPage.loadData` in routeConfiguration.
- **Category filtering**: Handled by `convertCategoryPathParamsToQueryParams` in SearchPage.shared.js — the URL params are automatically converted to search filters.

### Testing Connected Pages (with Page/Helmet)
- **Requires HelmetProvider** from `react-helmet-async` wrapping the render tree.
- **Mock TopbarContainer and FooterContainer** to avoid deep dependency chain in unit tests.
- **Required mock state shape**: `{ SearchPage: { currentPageResultIds: [], searchInProgress: false }, marketplaceData: { entities: {} }, ui: { disableScrollRequests: [] } }`.
- `ui.scrollingDisabled: false` is WRONG — the actual key is `ui.disableScrollRequests: []` (array).

### Sharetribe Upstream Merge Strategy
- **Remote chain**: `sharetribe/web-template` (remote: `sharetribe`) → `shop-at-mela/web-client` (remote: `upstream`) → `ppjogani/web-client` (remote: `origin`)
- **Push branch**: Local `main` → `upstream/test` (not `upstream/main`): `git push upstream main:test`
- **Merge incrementally by version tag** — never merge all 900+ commits at once; go tag-by-tag (v9.0.0, v9.1.0, v10.0.0, ...) to keep conflict scope manageable
- **CHANGELOG.md**: Always `git rm CHANGELOG.md` — Mela doesn't use it, sharetribe modifies it every release

### Mela Brand Values — Always Keep in Conflicts
- **Primary color**: `--marketplaceColor: #262261` (purple) — never accept sharetribe's default
- **Button color**: `--colorPrimaryButton: #e67e71` (coral) — never accept sharetribe's default
- **Topbar navigation**: Keep `CategoriesPage` and `BrandsPage` links; sharetribe repurposes these components for SignupPage/LoginPage
- **Mobile menu Browse section**: Keep Mela's custom Browse/Account sections; sharetribe removes them

### Redux Toolkit Migration (v9.0.0+)
- **`@reduxjs/toolkit`**: Added as dependency in v9.0.0. Run `yarn install` after first merge that includes it.
- **`CURRENT_USER_SHOW_SUCCESS` removed**: Replaced with `fetchCurrentUserThunk.fulfilled.type` from `user.duck`. Import `fetchCurrentUserThunk` and derive the type — payload shape (user entity) is unchanged.
- **`migrateLocalSavesToProfile`**: Must be preserved in `login` and `signupWithIdp` wrappers in `auth.duck.js`. Chain `.then(() => dispatch(migrateLocalSavesToProfile()))` after `.unwrap()` in both wrappers.
- **Test pattern changed**: Duck tests now use Redux store + action type assertions, not direct dispatch mocks.

### Babel Compatibility (v9.0.0+)
- **`@babel/plugin-proposal-private-property-in-object`**: Add to `devDependencies` — sharetribe's dependencies import it transitively but don't declare it, causing a crash at startup.

### SearchPage SEO (Keep Mela Logic in Conflicts)
- **`SearchPage.shared.js` `createSearchResultSchema`**: Our version uses `location` param to generate custom SEO titles for `/categories/*` and `/brands/*` URLs. Sharetribe adds `pageHeading` param. Resolution: accept both params; pass `pageHeading` in the default case's `schemaTitle` interpolation.

### Semantic HTML Changes (v10.7.0+)
- Sharetribe replaced `<div>` with `<ul>/<li>` for listing cards and menu items (accessibility).
- **SearchResultsPanel**: Accept `<ul>/<li>` structure, keep Mela badge calculation logic inside.
- **TopbarMobileMenu authenticated links**: Accept `<ul>/<li>`, keep Mela Browse section as-is.

## Session Log
2024-10-10: Fixed CategoryProducts to display proper category names + product filtering improvements
2025-10-10: Implemented HeroProducts with real API integration, randomization, and comprehensive testing
2025-10-13: Resolved image quality issues - switched to predefined high-res variants + enhanced quality settings
2025-11-18: Phase 2 - CategoryShowcase product-first, ListingCard badges, image variant fallback
2025-11-29: Fixed addMarketplaceEntities payload format issue in Brands page implementation
2025-12-15: Brand storefront UX - scroll affordance, mobile-first CSS, lazy loading, tab navigation component fix
2026-04-19: Sharetribe upstream merge v8.8.0→v10.7.0 — incremental tag-by-tag strategy, Redux Toolkit migration fixes, Mela brand color/nav preservation patterns