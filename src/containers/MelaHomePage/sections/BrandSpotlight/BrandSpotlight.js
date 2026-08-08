import React, { useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { NamedLink, ProductCarousel } from '../../../../components';
import { getWeeklyFlagshipBrandId, getBrandSlugById } from '../../../../config/configBrands';
import { denormalisedEntities, updatedEntities } from '../../../../util/data';
import { pushSpotlightView, pushSpotlightBrandClick } from '../../../../util/analytics/homepageEditorial';
import sdk from '../../../../util/homepageSdk';

import css from './BrandSpotlight.module.css';

const MAX_PRODUCTS = 8;

/**
 * Module A: Brand Spotlight (homepage-editorial-modules.md).
 * Deterministic weekly rotation through the 5 flagship brands — one brand treated the
 * way a magazine would treat it. Everything it needs (brandHeroImages, brandCraft, bio,
 * hero listing ids) is already seeded (P1.1b); no new backend.
 *
 * Product row is the brand's own bestsellers (pub_isBestseller), rendered via the
 * shared ProductCarousel component (decision 2026-07-26) instead of a static 3-item
 * grid — lets a brand with more bestsellers than fit on screen still show them all.
 *
 * No outbound Shopify link here (decision 2026-07-26, matching BrandStorefront.js) —
 * the sole CTA is "See {Brand} on Mela".
 */
const BrandSpotlight = () => {
  const [brand, setBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const rootRef = useRef(null);
  const hasFiredView = useRef(false);
  const intl = useIntl();

  const brandId = getWeeklyFlagshipBrandId();

  useEffect(() => {
    if (!brandId) {
      setIsLoading(false);
      return undefined;
    }

    let cancelled = false;

    const fetchSpotlight = async () => {
      try {
        const userResponse = await sdk.users.show({
          id: brandId,
          include: ['profileImage'],
          'fields.image': ['variants.square-small', 'variants.square-small2x'],
          'fields.user': ['profile', 'metadata'],
        });

        let productEntities = [];
        const listingsResponse = await sdk.listings.query({
          author_id: brandId,
          pub_isBestseller: true,
          perPage: MAX_PRODUCTS,
          include: ['images'],
          'fields.listing': ['title', 'price', 'publicData'],
          'fields.image': ['variants.square-small', 'variants.square-small2x'],
        });

        if (listingsResponse?.data) {
          const entities = updatedEntities({}, listingsResponse.data);
          const ids = listingsResponse.data.data.map(l => l.id.uuid);
          const refs = ids.map(id => ({ id: { uuid: id }, type: 'listing' }));
          productEntities = denormalisedEntities(entities, refs, false);
        }

        if (!cancelled) {
          setBrand(userResponse?.data?.data || null);
          setProducts(productEntities.slice(0, MAX_PRODUCTS));
        }
      } catch {
        // Leave brand null — component renders nothing (see below).
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchSpotlight();
    return () => {
      cancelled = true;
    };
  }, [brandId]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !rootRef.current || !brand) return undefined;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !hasFiredView.current) {
          hasFiredView.current = true;
          pushSpotlightView(brandId);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [brand, brandId]);

  if (isLoading || !brand) return null;

  const { displayName, bio = '', publicData = {} } = brand.attributes?.profile || {};
  const { brandCraft, brandHeroImages } = publicData;
  const heroImageUrl = Array.isArray(brandHeroImages) && brandHeroImages.length > 0 ? brandHeroImages[0] : null;
  const brandSlug = getBrandSlugById(brandId);
  const brandLinkProps = brandSlug
    ? { name: 'BrandPage', params: { brandSlug } }
    : { name: 'ProfilePage', params: { id: brandId } };

  const tagline = publicData.brandTagline || bio.split('.')[0]?.trim();
  const afterTagline = tagline ? bio.slice(bio.indexOf(tagline) + tagline.length).replace(/^[.\s]+/, '') : bio;
  const storySentence = afterTagline.split('.')[0]?.trim();

  return (
    <section className={css.root} ref={rootRef}>
      <span className={css.overline}>
        <FormattedMessage id="BrandSpotlight.overline" />
      </span>

      <div className={css.banner}>
        {heroImageUrl ? (
          <img src={heroImageUrl} alt={displayName} className={css.bannerImg} />
        ) : (
          <div className={css.bannerFallback} aria-hidden="true" />
        )}
        <span className={css.madeInIndia}>
          <FormattedMessage id="BrandSpotlight.madeInIndia" />
        </span>
      </div>

      <div className={css.body}>
        <h2 className={css.brandName}>{displayName}</h2>

        {brandCraft && <span className={css.craftChip}>✦ {brandCraft}</span>}

        {storySentence && <p className={css.story}>{storySentence}.</p>}

        <ProductCarousel
          title={intl.formatMessage(
            { id: 'BrandSpotlight.bestsellersTitle', defaultMessage: 'Bestsellers from {brand}' },
            { brand: displayName }
          )}
          listings={products}
          minItems={1}
          viewAllLinkName={brandLinkProps.name}
          viewAllLinkParams={brandLinkProps.params}
          showInrPrice={false}
        />

        <div className={css.ctas}>
          {/* NamedLink doesn't forward onClick — wrap it so the click still bubbles to
              this handler. display:contents keeps the wrapper out of the flex layout. */}
          <span className={css.ctaLinkWrap} onClick={() => pushSpotlightBrandClick(brandId)}>
            <NamedLink {...brandLinkProps} className={css.btnSolid}>
              <FormattedMessage id="BrandSpotlight.seeOnMela" values={{ brand: displayName }} />
            </NamedLink>
          </span>
        </div>

        <p className={css.rotationNote}>
          <FormattedMessage id="BrandSpotlight.rotationNote" />
        </p>
      </div>
    </section>
  );
};

export default BrandSpotlight;
