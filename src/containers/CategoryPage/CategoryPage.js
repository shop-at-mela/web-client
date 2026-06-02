import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Link, useLocation, useParams } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { getListingsById } from '../../ducks/marketplaceData.duck';

import { Page, LayoutSingleColumn, NamedLink, ListingCard } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import { OccasionStrip } from '../MelaHomePage/sections/CategoryShowcase/CategoryShowcase';

import css from './CategoryPage.module.css';

// ── Per-category editorial descriptions ───────────────────────────────────────
// Keyed by L0 category ID. Used for <meta description> and visible page copy.
// Copy is derived from the category hierarchy data in Mela-scrapper-integrations.

const CATEGORY_DESCRIPTIONS = {
  'Baby-Kids':
    'From handwoven bandhini onesies to festival-ready lehengas for toddlers — shop Indian-made clothing, nursery essentials, toys, and gear for babies and children, ethically crafted by indie brands.',
  Clothing:
    'Tops, bottoms, dresses, sleepwear, outerwear, and festive wear — Indian-made baby and kids clothing in organic fabrics and traditional prints.',
  Footwear:
    'Soft-sole first walkers and kids shoes crafted in India — supportive, playful designs rooted in traditional techniques.',
  Accessories:
    'Hats, hair accessories, bags, socks, and bibs — handcrafted Indian accessories for babies and toddlers.',
  Nursery:
    'Cribs, bedding, and nursery decor inspired by Indian artisanship — create a warm, culturally rich space for your little one.',
  Gear:
    'Strollers, carriers, high chairs, and travel essentials from Indian brands — built for modern parents on the move.',
  Feeding:
    'Bottles, tableware, and feeding essentials designed in India — safe, thoughtfully made tools for every mealtime stage.',
  Toys:
    'Baby toys, learning kits, plush animals, and creative play sets — Indian-made toys that spark imagination from birth.',
  Fashion:
    'Indian handloom sarees, block-printed kurtas, embroidered juttis, and Nehru jackets — curated contemporary and ethnic fashion from independent Indian designers.',
  'Home-Kitchen':
    'Handcrafted dhurries, brass serveware, block-print cushion covers, and teak furniture — artisanal Indian home décor and kitchen essentials for spaces that tell a story.',
  'Beauty-Wellness':
    'Ayurvedic face oils, cold-pressed hair treatments, rose petal soaps, and adaptogenic supplements — Indian wellness rituals bottled by indie beauty brands.',
  'Skincare':
    'Face care, body lotions, serums, and sun protection formulated with Ayurvedic botanicals — clean Indian beauty rooted in centuries of ritual.',
  'Hair-Care':
    'Oils, shampoos, serums, and hair treatments crafted from Indian herbs and cold-pressed botanicals for stronger, healthier hair.',
  'Ayurveda-Supplements':
    'Immunity boosters, adaptogens, and women\'s health supplements from small-batch Indian Ayurveda brands — wellness the traditional way.',
  'Jewelry-Accessories':
    'Silver jhumkas, oxidized pendant sets, hand-embroidered clutches, and heritage bangles — Indian jewelry and accessories made for everyday wear and festive dressing.',
  'Food-Gourmet':
    'Single-origin chai blends, stone-ground spice mixes, artisanal mango pickles, and cold-brew Indian coffee — pantry staples from small-batch Indian food producers.',
  'Art-Craft':
    'Original Madhubani paintings, Pattachitra art prints, handmade journals, and Gond tribal art — curated works from Indian folk and contemporary artists.',
};

const getCategoryDescription = (categoryId, intl, categoryName) => {
  return (
    CATEGORY_DESCRIPTIONS[categoryId] ||
    intl.formatMessage({ id: 'CategoryPage.description' }, { categoryName })
  );
};

// ── Category config helpers ────────────────────────────────────────────────

/**
 * Find a category by its id in the nested config tree.
 */
const findCategoryById = (categories, id) => {
  if (!categories || !id) return null;
  for (const cat of categories) {
    if (cat.id === id) return cat;
    if (cat.subcategories?.length) {
      const found = findCategoryById(cat.subcategories, id);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Build a /categories path manually — avoids path-to-regexp compile issues
 * with optional params in route definitions.
 */
const categoryPath = (level1, level2, level3) => {
  let path = `/categories/${level1}`;
  if (level2) path += `/${level2}`;
  if (level3) path += `/${level3}`;
  return path;
};

/**
 * Build breadcrumb items from URL path params.
 * Returns array of { id, name, path } from root to current level.
 */
const buildBreadcrumbs = (categories, level1, level2, level3) => {
  const crumbs = [];

  const l1Cat = findCategoryById(categories, level1);
  if (l1Cat) {
    crumbs.push({
      id: l1Cat.id,
      name: l1Cat.name,
      path: categoryPath(level1),
    });
  }

  if (level2) {
    const l2Cat = findCategoryById(l1Cat?.subcategories || [], level2);
    if (l2Cat) {
      crumbs.push({
        id: l2Cat.id,
        name: l2Cat.name,
        path: categoryPath(level1, level2),
      });
    }
  }

  if (level3) {
    const l2Cat = findCategoryById(l1Cat?.subcategories || [], level2);
    const l3Cat = findCategoryById(l2Cat?.subcategories || [], level3);
    if (l3Cat) {
      crumbs.push({
        id: l3Cat.id,
        name: l3Cat.name,
        path: categoryPath(level1, level2, level3),
      });
    }
  }

  return crumbs;
};

// ── BreadcrumbList JSON-LD ─────────────────────────────────────────────────

const buildBreadcrumbSchema = (rootURL, breadcrumbs) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: rootURL,
    },
    ...breadcrumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 2,
      name: crumb.name,
      item: `${rootURL}${crumb.path}`,
    })),
  ],
});

// ── LandingPage path helper ────────────────────────────────────────────────

const getLandingPagePath = routeConfiguration => {
  try {
    return createResourceLocatorString('LandingPage', routeConfiguration, {}, {});
  } catch (e) {
    return '/';
  }
};

const getBrandsPagePath = routeConfiguration => {
  try {
    return createResourceLocatorString('BrandsPage', routeConfiguration, {}, {});
  } catch (e) {
    return '/brands';
  }
};

// ── Root categories view (/categories with no level params) ───────────────

const RootCategoriesPage = ({ categories, scrollingDisabled, config, routeConfiguration, intl }) => {
  const marketplaceName = config.marketplaceName;
  const rootDescription =
    'Discover authentic Indian baby products, handloom fashion, artisanal home décor, Ayurvedic beauty, gourmet foods, and handcrafted jewelry — curated from independent Indian brands shipping to the US.';
  const pageTitle = intl.formatMessage(
    { id: 'CategoryPage.title' },
    {
      categoryName: intl.formatMessage({ id: 'CategoryPage.allCategories', defaultMessage: 'All Categories' }),
      marketplaceName,
    }
  );
  const canonicalURL = `${config.marketplaceRootURL}/categories`;
  const landingPath = getLandingPagePath(routeConfiguration);

  // ItemList schema — one entry per L0 category
  const schema = [
    {
      '@type': 'ItemList',
      name: pageTitle,
      description: rootDescription,
      url: canonicalURL,
      itemListElement: categories.map((cat, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: cat.name,
        url: `${config.marketplaceRootURL}${categoryPath(cat.id)}`,
      })),
    },
  ];

  return (
    <Page
      title={pageTitle}
      description={rootDescription}
      schema={schema}
      canonicalURL={canonicalURL}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <nav className={css.breadcrumb} aria-label="Category navigation">
            <Link to={landingPath} className={css.breadcrumbLink}>
              <FormattedMessage id="CategoryPage.home" />
            </Link>
            <span className={css.breadcrumbSep} aria-hidden="true"> › </span>
            <span className={css.breadcrumbCurrent}>
              <FormattedMessage id="CategoryPage.allCategories" defaultMessage="All Categories" />
            </span>
          </nav>
          <header className={css.header}>
            <h1 className={css.title}>
              <FormattedMessage id="CategoryPage.allCategories" defaultMessage="All Categories" />
            </h1>
            <p className={css.description}>{rootDescription}</p>
          </header>
          <div className={css.categoryCardGrid}>
            {categories.map(cat => {
              const topSubs = (cat.subcategories || []).slice(0, 3);
              return (
                <Link key={cat.id} to={categoryPath(cat.id)} className={css.categoryCard}>
                  <h2 className={css.categoryCardTitle}>{cat.name}</h2>
                  {topSubs.length > 0 && (
                    <ul className={css.categoryCardSubs}>
                      {topSubs.map(sub => (
                        <li key={sub.id} className={css.categoryCardSub}>
                          {sub.name}
                        </li>
                      ))}
                    </ul>
                  )}
                  <span className={css.categoryCardCta}>
                    <FormattedMessage id="CategoryPage.browseCategory" defaultMessage="Browse →" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

// ── Component ──────────────────────────────────────────────────────────────

const CategoryPageComponent = props => {
  const { listings, scrollingDisabled, searchInProgress } = props;

  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const location = useLocation();
  const { level1, level2, level3 } = useParams();

  const categories = config.categoryConfiguration?.categories || [];

  // Root view: /categories with no level1
  if (!level1) {
    return (
      <RootCategoriesPage
        categories={categories}
        scrollingDisabled={scrollingDisabled}
        config={config}
        routeConfiguration={routeConfiguration}
        intl={intl}
      />
    );
  }

  const breadcrumbs = buildBreadcrumbs(categories, level1, level2, level3);

  // Deepest category is what we're currently viewing
  const currentCrumb = breadcrumbs[breadcrumbs.length - 1];
  const currentCategory = currentCrumb
    ? findCategoryById(categories, currentCrumb.id)
    : null;

  // Subcategories of the current level — used for navigation pills
  const subcategories = currentCategory?.subcategories || [];

  // Occasion strip: scope to deepest available category level so results stay relevant
  const occasionCategoryParams = level3
    ? { pub_categoryLevel3: level3 }
    : level2
    ? { pub_categoryLevel2: level2 }
    : { pub_categoryLevel1: level1 };

  if (!currentCategory) {
    // Unknown category slug — let it fall through to 404 via NotFoundPage
    return null;
  }

  const marketplaceName = config.marketplaceName;
  const pageTitle = intl.formatMessage(
    { id: 'CategoryPage.title' },
    { categoryName: currentCategory.name, marketplaceName }
  );
  const pageDescription = getCategoryDescription(currentCategory.id, intl, currentCategory.name);

  // Canonical URL — strip any search params from the category URL
  const canonicalPath = location.pathname;
  const canonicalURL = `${config.marketplaceRootURL}${canonicalPath}`;

  // Schema.org: BreadcrumbList + CollectionPage (no @context — Page wraps in @graph)
  const schemaListings = listings.map((l, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${config.marketplaceRootURL}/l/${l.id.uuid}`,
    name: l.attributes.title,
  }));

  const schema = [
    buildBreadcrumbSchema(config.marketplaceRootURL, breadcrumbs),
    {
      '@type': 'CollectionPage',
      name: pageTitle,
      description: pageDescription,
      url: canonicalURL,
      mainEntity: {
        '@type': 'ItemList',
        name: currentCategory.name,
        itemListElement: schemaListings,
      },
    },
  ];

  const landingPath = getLandingPagePath(routeConfiguration);
  const brandsPath = getBrandsPagePath(routeConfiguration);

  return (
    <Page
      title={pageTitle}
      description={pageDescription}
      schema={schema}
      canonicalURL={canonicalURL}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSingleColumn
        topbar={<TopbarContainer />}
        footer={<FooterContainer />}
      >
        <div className={css.root}>
          {/* Breadcrumb nav */}
          <nav className={css.breadcrumb} aria-label="Category navigation">
            <Link to={landingPath} className={css.breadcrumbLink}>
              <FormattedMessage id="CategoryPage.home" />
            </Link>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb.id}>
                <span className={css.breadcrumbSep} aria-hidden="true"> › </span>
                {i < breadcrumbs.length - 1 ? (
                  <Link to={crumb.path} className={css.breadcrumbLink}>
                    {crumb.name}
                  </Link>
                ) : (
                  <span className={css.breadcrumbCurrent}>{crumb.name}</span>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Page header */}
          <header className={css.header}>
            <h1 className={css.title}>{currentCategory.name}</h1>
            <p className={css.description}>{pageDescription}</p>
          </header>

          {/* Subcategory pills — shown when subcategories exist */}
          {subcategories.length > 0 && (
            <div className={css.subcategoryNav}>
              {subcategories.map(sub => (
                <Link
                  key={sub.id}
                  to={level2 ? categoryPath(level1, level2, sub.id) : categoryPath(level1, sub.id)}
                  className={css.subcategoryPill}
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}

          {/* Occasion strip — occasion products scoped to this category */}
          <div className={css.occasionSection}>
            <OccasionStrip config={config} additionalQueryParams={occasionCategoryParams} />
          </div>

          {/* Product grid */}
          <section className={css.productsSection}>
            {searchInProgress ? (
              <div className={css.loading}>
                <FormattedMessage id="CategoryPage.loadingProducts" />
              </div>
            ) : listings.length === 0 ? (
              <div className={css.empty}>
                <p className={css.emptyText}>
                  <FormattedMessage
                    id="CategoryPage.noProducts"
                    values={{ categoryName: currentCategory.name }}
                  />
                </p>
                <Link to={brandsPath} className={css.emptyLink}>
                  <FormattedMessage id="CategoryPage.browseBrands" />
                </Link>
              </div>
            ) : (
              <ul className={css.productGrid}>
                {listings.map(l => (
                  <li key={l.id.uuid} className={css.productItem}>
                    <ListingCard listing={l} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentPageResultIds, searchInProgress } = state.SearchPage;
  return {
    listings: getListingsById(state, currentPageResultIds),
    searchInProgress,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const CategoryPage = compose(connect(mapStateToProps))(CategoryPageComponent);

export default CategoryPage;
