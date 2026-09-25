import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Link, useHistory, useLocation, useParams } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { getListingsById } from '../../ducks/marketplaceData.duck';
import { applyCategoryMerchandising } from '../../util/categoryMerchandising';
import { parse, stringify } from '../../util/urlHelpers';
import { deriveBrandCraftLine } from '../../util/brandCraft';

import {
  Page,
  LayoutSingleColumn,
  NamedLink,
  ListingCard,
  BrandCardHome,
  BrandCarousel,
} from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import { OccasionStrip, AgeNavigation } from '../MelaHomePage/sections/CategoryShowcase/CategoryShowcase';
import BrandFilterPopup from './BrandFilterPopup/BrandFilterPopup';
import { getCategoryBrandTiles, getCategoryBrandCarousel } from './CategoryPage.duck';

import css from './CategoryPage.module.css';

// P1.2: interleave a brand tile roughly every 2 grid rows. The grid's column count is
// responsive (2/3/4 — see CategoryPage.module.css), so a fixed item-count interval is an
// approximation across breakpoints rather than a literal "2 rows" at every width.
const BRAND_TILE_INTERLEAVE_EVERY = 6;

/**
 * Builds the grid render list: listing entries with brand tiles spliced in every
 * BRAND_TILE_INTERLEAVE_EVERY items, cycling through the fetched brand tiles until
 * they're exhausted (never repeating a brand within one page).
 */
const buildCategoryGridItems = (mergedListings, brandTiles) => {
  const items = [];
  let tileCursor = 0;

  mergedListings.forEach((listing, index) => {
    items.push({ type: 'listing', listing });

    const isInsertionPoint = (index + 1) % BRAND_TILE_INTERLEAVE_EVERY === 0;
    if (isInsertionPoint && tileCursor < brandTiles.length) {
      items.push({ type: 'brandTile', brand: brandTiles[tileCursor] });
      tileCursor += 1;
    }
  });

  return items;
};

// ── Per-category editorial content ─────────────────────────────────────────────
// Keyed by L0 category ID. `description` feeds <meta description> and the visible
// intro paragraph; `faqQuestion`/`faqAnswer` feed a visible question-form heading
// plus a matching Question/Answer JSON-LD node (GEO fix, 2026-09-25). Copy follows
// the "living culture, not heritage" framing rule (see UXR §8A in
// seo-aeo-category-brand-pages-prd.md) — craft is described as made in India today,
// never as an antique or heritage relic.

// Manually maintained "content last reviewed" date for all entries below — bump by
// hand only when this copy actually changes. Not derived from listing data: an
// auto-computed date would be a freshness-spam pattern AI answer engines discount.
export const CATEGORY_CONTENT_LAST_UPDATED = '2026-09-25';

export const CATEGORY_CONTENT = {
  'Baby-Kids': {
    description:
      "Mela's Baby & Kids category brings together clothing, footwear, nursery bedding and decor, feeding essentials, gear, and toys from independent Indian brands. Pieces range from bandhani-dyed onesies and hand block-printed swaddles to festive lehengas sized for toddlers, all made in India today by small labels designing for babies and children from newborn through the early school years.",
    faqQuestion: 'What baby and kids products can I buy from Indian brands on Mela?',
    faqAnswer:
      'Mela sells baby and kids clothing, footwear, accessories, nursery bedding and decor, feeding essentials, gear, and toys, all from independent brands that make their products in India. The range covers everyday basics like onesies and bibs as well as festive wear such as mini lehengas and kurta sets.',
  },
  Clothing: {
    description:
      "Indian-made baby and kids clothing on Mela includes tops, bottoms, dresses, sleepwear, outerwear, and festive wear from independent Indian labels. Many pieces use organic fabrics and prints that are hand block printed or dyed in Indian workshops today, with designs spanning soft everyday basics for newborns to kurta sets and lehengas for celebrations.",
    faqQuestion: 'Where can I buy Indian-made organic clothes for babies and kids?',
    faqAnswer:
      'Mela carries baby and kids clothing from independent Indian brands, including tops, dresses, sleepwear, outerwear, and festive wear. Many of these pieces are made from organic fabrics and finished with hand block prints or hand-dyed patterns produced in India.',
  },
  Footwear: {
    description:
      'Kids footwear on Mela comes from independent Indian brands making soft-sole first walkers, booties, and everyday shoes for babies and young children. Indian makers are designing these shoes today with supportive, flexible soles and playful colors and prints, built for small, growing feet at every stage from first steps through the preschool years and beyond.',
    faqQuestion: 'Are there soft-sole baby shoes made in India?',
    faqAnswer:
      'Yes. Mela lists soft-sole first walkers and booties from independent Indian brands, alongside everyday shoes for toddlers and young children. The designs focus on supportive, flexible soles for small, growing feet.',
  },
  Accessories: {
    description:
      'Baby and toddler accessories on Mela include hats, hair clips and headbands, bags, socks, and bibs from independent Indian brands. Many are handmade in small Indian workshops using cotton, muslin, and hand block-printed or embroidered fabrics, pairing practical daily-use items with the prints and colors that contemporary Indian designers are producing right now.',
    faqQuestion: 'What handmade baby accessories does Mela sell?',
    faqAnswer:
      'Mela sells hats, hair accessories, bags, socks, and bibs for babies and toddlers from independent Indian brands. Many of these accessories are handmade in India from cotton or muslin, often with hand block prints or embroidery.',
  },
  Nursery: {
    description:
      'Nursery products on Mela include cribs, crib and cot bedding, quilts, and room decor from independent Indian brands. Indian makers produce these pieces today using techniques such as hand block printing and embroidery, giving nurseries a warm, handmade look drawn from contemporary Indian craft rather than mass-produced prints.',
    faqQuestion: 'What nursery products from Indian brands does Mela sell?',
    faqAnswer:
      "Mela's Nursery category lists cribs, crib bedding, quilts, and nursery decor from independent Indian brands. The pieces are made in India, with textiles often finished using techniques such as hand block printing and embroidery.",
  },
  Gear: {
    description:
      "Baby gear on Mela covers strollers, carriers, high chairs, and travel essentials from independent Indian brands. These products are designed in India for everyday use by modern families, from carriers and high chairs to compact travel pieces, and sit alongside the rest of Mela's Indian-made baby and kids range for one-stop shopping.",
    faqQuestion: 'Does Mela sell baby carriers and strollers from Indian brands?',
    faqAnswer:
      "Yes. Mela's Baby Gear category includes strollers, baby carriers, high chairs, and travel essentials from independent Indian brands. These products are designed in India for everyday family use at home and on the move.",
  },
  Feeding: {
    description:
      'Feeding products on Mela include baby bottles, plates, bowls, cups, cutlery, and other mealtime essentials from independent Indian brands. The range spans first bottles through toddler self-feeding, and reflects how Indian brands are designing safe, practical, thoughtfully made tableware for babies and children today, for every mealtime stage.',
    faqQuestion: 'What baby feeding products from India are available on Mela?',
    faqAnswer:
      'Mela offers baby bottles, plates, bowls, cups, cutlery, and other feeding essentials from independent Indian brands. The range covers each stage from first bottles to toddler self-feeding, with products designed and made in India.',
  },
  Toys: {
    description:
      'Toys on Mela include baby toys, plush animals, learning kits, and creative play sets from independent Indian brands. Indian toy makers design these today for children from birth upward, from first sensory toys and soft plush companions to hands-on learning kits and open-ended creative sets that build curiosity.',
    faqQuestion: 'What kinds of Indian-made toys does Mela sell?',
    faqAnswer:
      "Mela's Toys category includes baby toys, plush animals, learning kits, and creative play sets from independent Indian brands. The toys are made in India for babies and young children, covering early sensory play through hands-on learning.",
  },
  Fashion: {
    description:
      'Fashion on Mela brings together handloom sarees, hand block-printed kurtas, embroidered juttis, Nehru jackets, and everyday contemporary clothing from independent Indian designers. Weavers, printers, and embroiderers across India are making these pieces today, and the labels on Mela range from modern everyday wear to festive and wedding-season outfits for women and men.',
    faqQuestion: 'Where can I buy handloom sarees and kurtas from independent Indian designers in the US?',
    faqAnswer:
      'Mela sells handloom sarees, hand block-printed kurtas, Nehru jackets, embroidered juttis, and contemporary clothing from independent Indian designers, shipping to the US. Pieces range from everyday wear to festive and wedding-season outfits, made by weavers, printers, and embroiderers in India today.',
  },
  'Home-Kitchen': {
    description:
      'Home & Kitchen on Mela features handwoven dhurries, brass serveware, hand block-printed cushion covers, table linen, and teak furniture from independent Indian brands. Weavers, metalworkers, printers, and woodworkers across India make these pieces today for contemporary homes, pairing handmade techniques with modern shapes for living rooms, dining tables, and kitchens.',
    faqQuestion: "Are Mela's home décor and kitchen products handmade in India?",
    faqAnswer:
      "Much of Mela's Home & Kitchen range is handmade in India, including handwoven dhurries, brass serveware, and hand block-printed cushion covers and table linen. The category also includes teak furniture and kitchen essentials from independent Indian brands.",
  },
  'Beauty-Wellness': {
    description:
      'Beauty & Wellness on Mela includes Ayurvedic face oils, cold-pressed hair oils, handmade rose petal soaps, skincare, and adaptogenic supplements from independent Indian beauty brands. These brands formulate with Indian botanicals such as rose, turmeric, neem, and ashwagandha, producing small-batch products in India today that apply Ayurvedic ingredients to modern skincare and self-care routines.',
    faqQuestion: 'Where can I buy Ayurvedic beauty products from Indian brands in the US?',
    faqAnswer:
      'Mela brings together independent Indian beauty and wellness brands selling Ayurvedic face oils, hair oils, handmade soaps, skincare, and supplements, shipping to the US. Many of these brands make small-batch products in India with botanicals like rose, turmeric, neem, and ashwagandha.',
  },
  Skincare: {
    description:
      'Skincare on Mela covers face care, body lotions, serums, and sun protection from independent Indian beauty brands. Formulas draw on Ayurvedic botanicals such as saffron, turmeric, and neem, and are made in small batches in India today by brands blending those ingredients with contemporary skincare formats like lightweight serums and daily sunscreens.',
    faqQuestion: 'What is Ayurvedic skincare and where can I buy it from Indian brands?',
    faqAnswer:
      'Ayurvedic skincare uses botanicals from the Ayurvedic system, such as saffron, turmeric, sandalwood, and neem, in products like face oils, serums, and lotions. Mela sells Ayurvedic face care, body care, serums, and sun protection from independent Indian brands that formulate and make their products in India.',
  },
  'Hair-Care': {
    description:
      'Hair Care on Mela includes hair oils, shampoos, serums, and treatments from independent Indian brands. Many products are made with cold-pressed oils and Indian herbs such as amla and bhringraj, and are produced in small batches in India today by brands updating the familiar practice of hair oiling for current routines.',
    faqQuestion: 'Where can I buy Indian herbal hair oils in the US?',
    faqAnswer:
      'Mela sells hair oils, shampoos, serums, and treatments from independent Indian brands, shipping to the US. Many are made in small batches with cold-pressed oils and Indian herbs such as amla and bhringraj.',
  },
  'Ayurveda-Supplements': {
    description:
      "Ayurveda & Supplements on Mela includes immunity blends, adaptogens such as ashwagandha and tulsi, and women's health supplements from small-batch Indian Ayurveda brands. These brands prepare herbal formulations in India today, offering Ayurvedic ingredients in everyday formats like capsules, powders, and teas designed to fit into current daily wellness routines.",
    faqQuestion: 'What Ayurvedic supplements does Mela sell?',
    faqAnswer:
      "Mela sells immunity blends, adaptogens like ashwagandha and tulsi, and women's health supplements from small-batch Ayurveda brands based in India. Products come in formats such as capsules, powders, and teas.",
  },
  'Jewelry-Accessories': {
    description:
      'Jewelry & Accessories on Mela includes silver jhumkas, oxidized pendant sets, bangles, and hand-embroidered clutches from independent Indian brands. Silversmiths, metalworkers, and embroiderers across India make these pieces today, in designs that move easily between everyday wear, office dressing, and festive occasions like weddings and Diwali.',
    faqQuestion: 'Where can I buy handmade silver jhumkas from Indian brands?',
    faqAnswer:
      "Mela's Jewelry & Accessories category lists silver jhumkas, oxidized pendant sets, bangles, and hand-embroidered clutches from independent Indian brands. The pieces are made in India and range from everyday earrings to festive sets.",
  },
  'Food-Gourmet': {
    description:
      "Food & Gourmet is a category Mela is building out for pantry staples from small-batch Indian food producers — think single-origin chai blends, stone-ground spice mixes, mango pickles, and Indian coffee, sourced from specific Indian regions. Mela is currently onboarding food and gourmet brands for this category, so check back as new producers join.",
    faqQuestion: 'Does Mela sell Indian food and pantry staples like chai, spices, and pickles?',
    faqAnswer:
      "Not yet — Mela is onboarding small-batch Indian food producers for chai, spice mixes, pickles, and coffee, so this category doesn't have live listings today. In the meantime, explore Mela's live categories like Fashion, Home & Kitchen, and Beauty & Wellness.",
  },
  // Not currently populated — see LEVEL1_TO_BRAND_CATEGORY in CategoryPage.duck.js,
  // which has no brand-category mapping for Food-Gourmet or Art-Craft. Copy below is
  // written to describe the category honestly without claiming live inventory.
  'Art-Craft': {
    description:
      'Art & Craft is a category Mela is building out for original works by Indian artists — Madhubani paintings, Pattachitra prints, Gond artworks, and handmade paper journals. Madhubani, Pattachitra, and Gond are living art forms practiced by working artists in Bihar, Odisha, and Madhya Pradesh today. Mela is onboarding artists and craft studios for this category, so new pieces will appear as brands join.',
    faqQuestion: 'Does Mela sell original Indian art like Madhubani or Gond paintings?',
    faqAnswer:
      "Not yet — Mela is onboarding Indian artists and craft studios for original Madhubani, Pattachitra, and Gond work, so this category doesn't have live listings today. Check back soon, or explore Mela's live categories in the meantime.",
  },
  root: {
    description:
      'Mela is a marketplace for independent Indian brands shipping to the US. Its live categories cover baby and kids products, handloom and contemporary fashion, handmade home décor and kitchenware, Ayurvedic beauty and wellness, and jewelry and accessories, all made in India today by designers, artisans, and makers. Mela is also building out Food & Gourmet and Art & Craft categories as new producers and artists join.',
    faqQuestion: 'What can I buy on Mela?',
    faqAnswer:
      'Mela sells products made in India by independent Indian brands, shipping to the US. Live categories include baby and kids clothing and gear, fashion, home and kitchen, beauty and wellness, and jewelry and accessories — with Food & Gourmet and Art & Craft coming soon as Mela onboards more brands.',
  },
};

const getCategoryContent = (categoryId, intl, categoryName) => {
  return (
    CATEGORY_CONTENT[categoryId] || {
      description: intl.formatMessage({ id: 'CategoryPage.description' }, { categoryName }),
      faqQuestion: intl.formatMessage({ id: 'CategoryPage.faqQuestion' }, { categoryName }),
      faqAnswer: intl.formatMessage({ id: 'CategoryPage.faqAnswer' }, { categoryName }),
    }
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
 * Brand filter options for the current page, sourced from the "Shop {L1} Brands" carousel
 * data already fetched for this page (no separate API call) — every option is guaranteed to
 * have at least one listing at the current category depth. Each option carries its craft
 * line (see util/brandCraft.js) for BrandFilterPopup's two-line rows.
 */
const brandFilterOptions = brandCarousel =>
  brandCarousel.map(({ brand }) => ({
    id: brand.id.uuid,
    name: brand.attributes.profile.displayName,
    craft: deriveBrandCraftLine(brand),
  }));

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
  const rootContent = CATEGORY_CONTENT.root;
  const rootDescription = rootContent.description;
  const pageTitle = intl.formatMessage(
    { id: 'CategoryPage.title' },
    {
      categoryName: intl.formatMessage({ id: 'CategoryPage.allCategories', defaultMessage: 'All Categories' }),
      marketplaceName,
    }
  );
  const canonicalURL = `${config.marketplaceRootURL}/categories`;
  const landingPath = getLandingPagePath(routeConfiguration);
  // Reference (not duplicate) the Organization entity Page.js already injects into
  // every page's JSON-LD @graph, so authorship can be attributed without inventing a
  // fabricated named author persona.
  const organizationRef = { '@id': `${config.marketplaceRootURL}#organization` };

  // ItemList schema — one entry per L0 category, plus a Question/Answer node so the
  // visible FAQ heading below has a matching structured-data counterpart.
  const schema = [
    {
      '@type': 'ItemList',
      name: pageTitle,
      description: rootDescription,
      url: canonicalURL,
      author: organizationRef,
      itemListElement: categories.map((cat, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: cat.name,
        url: `${config.marketplaceRootURL}${categoryPath(cat.id)}`,
      })),
    },
    {
      '@type': 'FAQPage',
      author: organizationRef,
      mainEntity: [
        {
          '@type': 'Question',
          name: rootContent.faqQuestion,
          acceptedAnswer: { '@type': 'Answer', text: rootContent.faqAnswer },
        },
      ],
    },
  ];

  return (
    <Page
      title={pageTitle}
      description={rootDescription}
      schema={schema}
      canonicalURL={canonicalURL}
      scrollingDisabled={scrollingDisabled}
      published={CATEGORY_CONTENT_LAST_UPDATED}
      updated={CATEGORY_CONTENT_LAST_UPDATED}
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
            <p className={css.byline}>Last reviewed {CATEGORY_CONTENT_LAST_UPDATED}</p>
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
          {/* Collapsed-by-default FAQ accordion (per seo-aeo-category-brand-pages-prd.md
              §5A/§8C: "visible to user, not hidden", positioned after the main content,
              not stacked above it — moved here 2026-09-25 after it was found stacked in
              the header, pushing products below the fold). Question/answer text stays in
              the DOM at all times so it remains crawlable/quotable even while collapsed. */}
          <details className={css.faqAccordion}>
            <summary className={css.faqSummary}>
              <h2 className={css.faqQuestion}>{rootContent.faqQuestion}</h2>
            </summary>
            <p className={css.faqAnswer}>{rootContent.faqAnswer}</p>
            <p className={css.byline}>Curated by the Mela team</p>
          </details>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

// ── Component ──────────────────────────────────────────────────────────────

const CategoryPageComponent = props => {
  const { listings, brandTiles = [], brandCarousel = [], scrollingDisabled, searchInProgress } = props;

  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();
  const { level1, level2, level3 } = useParams();

  // Brand filter — backed directly by Sharetribe's `author_id` query param (single UUID
  // only; no OR/comma-list support). Options come from the brand-carousel data already
  // fetched for this page, so every option is guaranteed to have listings here.
  const currentSearchParams = parse(location.search);
  const selectedBrandId = currentSearchParams.author_id;
  const selectedBrandEntry = brandCarousel.find(({ brand }) => brand.id.uuid === selectedBrandId);
  const selectedBrandName = selectedBrandEntry?.brand.attributes.profile.displayName;

  const handleBrandFilterSelect = brandId => {
    const nextParams = { ...currentSearchParams, author_id: brandId || null };
    const search = stringify(nextParams);
    // preserveScroll: the whole point of this control sitting next to the grid is that
    // picking a brand narrows what's below it in place — Routes.js's global
    // setPageScrollPosition otherwise resets scroll to the top on every navigation
    // (including a search-only change like this one), which would yank the shopper away
    // from the grid they just filtered.
    history.push({
      pathname: categoryPath(level1, level2, level3),
      search: search ? `?${search}` : '',
      state: { preserveScroll: true },
    });
  };

  // P1.2: brand-diversity cap + utility-item demotion, then interleaved brand tiles.
  // No brand tile is spliced in while a brand filter is active — every listing already
  // belongs to that brand, so its own "Shop All" tile would just point back at this page.
  const mergedListings = applyCategoryMerchandising(listings);
  const gridItems = buildCategoryGridItems(mergedListings, selectedBrandId ? [] : brandTiles);

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
  const categoryContent = getCategoryContent(currentCategory.id, intl, currentCategory.name);
  const pageDescription = categoryContent.description;

  // Canonical URL — strip any search params from the category URL
  const canonicalPath = location.pathname;
  const canonicalURL = `${config.marketplaceRootURL}${canonicalPath}`;
  // Reference (not duplicate) the Organization entity Page.js already injects into
  // every page's JSON-LD @graph, so authorship can be attributed without inventing a
  // fabricated named author persona.
  const organizationRef = { '@id': `${config.marketplaceRootURL}#organization` };

  // Schema.org: BreadcrumbList + CollectionPage + FAQPage (no @context — Page wraps in @graph)
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
      author: organizationRef,
      mainEntity: {
        '@type': 'ItemList',
        name: currentCategory.name,
        itemListElement: schemaListings,
      },
    },
    {
      '@type': 'FAQPage',
      author: organizationRef,
      mainEntity: [
        {
          '@type': 'Question',
          name: categoryContent.faqQuestion,
          acceptedAnswer: { '@type': 'Answer', text: categoryContent.faqAnswer },
        },
      ],
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
      published={CATEGORY_CONTENT_LAST_UPDATED}
      updated={CATEGORY_CONTENT_LAST_UPDATED}
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
            <p className={css.byline}>Last reviewed {CATEGORY_CONTENT_LAST_UPDATED}</p>
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

          {/* "Shop {L1} Brands" carousel — always the full L1 brand roster, each tile's
              products scoped to the current page's deepest category level. Brands with no
              listings at that depth are dropped by the duck before this ever renders.
              L0 only: on L1/L2 pages this duplicated the grid's own brand filter ~1,900px
              apart with opposite behavior (carousel ejects off-page; filter narrows in
              place). */}
          {brandCarousel.length > 0 && !level2 && (
            <div className={css.brandCarouselSection}>
              <h2 className={css.brandCarouselTitle}>
                <FormattedMessage
                  id="CategoryPage.brandCarouselTitle"
                  defaultMessage="Shop {categoryName} Brands"
                  values={{ categoryName: breadcrumbs[0]?.name || currentCategory.name }}
                />
              </h2>
              <BrandCarousel
                items={brandCarousel}
                getKey={({ brand }) => brand.id.uuid}
                renderItem={({ brand, products }) => (
                  <BrandCardHome
                    brand={brand}
                    products={products}
                    showCertifications={true}
                    showPlaceholders={false}
                  />
                )}
              />
            </div>
          )}

          {/* P1.3: "Shop Baby by Age" relocated here from the homepage — Baby & Kids
              L0 page only, not sub-pages (the age filter doesn't map cleanly onto
              Clothing/Footwear/etc. sub-categories). */}
          {level1 === 'Baby-Kids' && !level2 && (
            <div className={css.occasionSection}>
              <AgeNavigation config={config} />
            </div>
          )}

          {/* Product grid */}
          <section className={css.productsSection}>
            <div className={css.gridHeader}>
              <h2 className={css.gridHeading}>
                {selectedBrandName ? (
                  <FormattedMessage
                    id="CategoryPage.gridHeadingFiltered"
                    values={{ brandName: selectedBrandName, categoryName: currentCategory.name }}
                  />
                ) : (
                  <FormattedMessage
                    id="CategoryPage.gridHeadingAll"
                    values={{ categoryName: currentCategory.name }}
                  />
                )}
              </h2>
              {/* Gated to >=3 options — below that (e.g. Beauty-Wellness, Home-Kitchen
                  today) the dropdown has nothing meaningful to narrow. */}
              {brandCarousel.length >= 3 && (
                <BrandFilterPopup
                  id="CategoryPage.brandFilter"
                  brands={brandFilterOptions(brandCarousel)}
                  selectedBrandId={selectedBrandId}
                  selectedBrandName={selectedBrandName}
                  onSelect={handleBrandFilterSelect}
                />
              )}
            </div>
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
                {gridItems.map(entry =>
                  entry.type === 'listing' ? (
                    <li key={entry.listing.id.uuid} className={css.productItem}>
                      <ListingCard listing={entry.listing} />
                    </li>
                  ) : (
                    <li
                      key={`brand-tile-${entry.brand.id.uuid}`}
                      className={`${css.productItem} ${css.brandTileItem}`}
                    >
                      <BrandCardHome
                        brand={entry.brand}
                        products={mergedListings
                          .filter(l => l.author?.id?.uuid === entry.brand.id.uuid)
                          .slice(0, 2)}
                        maxProducts={2}
                        showCertifications={false}
                        showPlaceholders={false}
                      />
                    </li>
                  )
                )}
              </ul>
            )}
          </section>

          {/* Collapsed-by-default FAQ accordion (per seo-aeo-category-brand-pages-prd.md
              §5A/§8C: "visible to user, not hidden", positioned after the product grid,
              not stacked above it — moved here 2026-09-25 after it was found stacked in
              the header, pushing products below the fold). Question/answer text stays in
              the DOM at all times so it remains crawlable/quotable even while collapsed. */}
          <details className={css.faqAccordion}>
            <summary className={css.faqSummary}>
              <h2 className={css.faqQuestion}>{categoryContent.faqQuestion}</h2>
            </summary>
            <p className={css.faqAnswer}>{categoryContent.faqAnswer}</p>
            <p className={css.byline}>Curated by the Mela team</p>
          </details>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentPageResultIds, searchInProgress } = state.SearchPage;
  return {
    listings: getListingsById(state, currentPageResultIds),
    brandTiles: getCategoryBrandTiles(state),
    brandCarousel: getCategoryBrandCarousel(state),
    searchInProgress,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const CategoryPage = compose(connect(mapStateToProps))(CategoryPageComponent);

export default CategoryPage;
