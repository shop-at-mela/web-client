import React, { useEffect, useState } from 'react';
import { FormattedMessage } from '../../../../util/reactIntl';
import { NamedLink } from '../../../../components';
import { getAllBrandIds, getBrandSlugById } from '../../../../config/configBrands';
import { pushCraftTileClick } from '../../../../util/analytics/homepageEditorial';
import sdk from '../../../../util/homepageSdk';

import css from './CraftStories.module.css';

const TILE_COUNT = 3;

/** Day-of-year (UTC) — seeds the daily trio rotation (P1.3b). */
const getDayOfYear = (date = new Date()) => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  return Math.floor((date - start) / 86400000);
};

/**
 * Deterministic daily rotation through the eligible set: a stable window of
 * TILE_COUNT brands that advances by one each day, wrapping around.
 */
const pickDailyTrio = eligibleBrands => {
  if (eligibleBrands.length === 0) return [];
  const start = getDayOfYear() % eligibleBrands.length;
  const count = Math.min(TILE_COUNT, eligibleBrands.length);
  return Array.from({ length: count }, (_, i) => eligibleBrands[(start + i) % eligibleBrands.length]);
};

/**
 * Module C: Craft Stories (homepage-editorial-modules.md).
 * The craft chips written for all 19 brands, used as a discovery surface — a module
 * Amazon structurally cannot publish. Eligible: active brands with both a non-empty
 * brandCraft and at least one hero image; rotates a different trio daily.
 */
const CraftStories = () => {
  const [tiles, setTiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchEligibleBrands = async () => {
      const brandIds = getAllBrandIds();
      try {
        const responses = await Promise.all(
          brandIds.map(id =>
            sdk.users
              .show({
                id,
                include: ['profileImage'],
                'fields.user': ['profile'],
              })
              .then(res => res?.data?.data || null)
              .catch(() => null)
          )
        );

        const eligible = responses.filter(brand => {
          const publicData = brand?.attributes?.profile?.publicData || {};
          return (
            !!publicData.brandCraft &&
            Array.isArray(publicData.brandHeroImages) &&
            publicData.brandHeroImages.length > 0
          );
        });

        if (!cancelled) {
          setTiles(pickDailyTrio(eligible));
        }
      } catch {
        // Leave empty — module hides itself.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchEligibleBrands();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isLoading && tiles.length === 0) return null;

  return (
    <section className={css.root}>
      <h2 className={css.title}>
        <FormattedMessage id="CraftStories.title" />
      </h2>
      <p className={css.subtitle}>
        <FormattedMessage id="CraftStories.subtitle" />
      </p>

      <div className={css.tiles}>
        {isLoading
          ? [1, 2, 3].map(i => <div key={i} className={`${css.tile} ${css.skeleton}`} />)
          : tiles.map(brand => {
              const { displayName, publicData = {} } = brand.attributes.profile;
              const brandSlug = getBrandSlugById(brand.id.uuid);
              const linkProps = brandSlug
                ? { name: 'BrandPage', params: { brandSlug } }
                : { name: 'ProfilePage', params: { id: brand.id.uuid } };

              return (
                // NamedLink doesn't forward onClick — wrap so the click still bubbles;
                // display:contents keeps the wrapper out of the tiles grid layout.
                <span
                  key={brand.id.uuid}
                  className={css.tileLinkWrap}
                  onClick={() => pushCraftTileClick(brand.id.uuid)}
                >
                  <NamedLink {...linkProps} className={css.tile}>
                    <img
                      src={publicData.brandHeroImages[0]}
                      alt={displayName}
                      className={css.tileImage}
                    />
                    <span className={css.scrim} aria-hidden="true" />
                    <span className={css.tileText}>
                      <span className={css.craft}>{publicData.brandCraft}</span>
                      <span className={css.brand}>{displayName}</span>
                    </span>
                    <span className={css.arrow} aria-hidden="true">
                      →
                    </span>
                  </NamedLink>
                </span>
              );
            })}
      </div>

      <p className={css.rotationNote}>
        <FormattedMessage
          id="CraftStories.rotationNote"
          values={{ count: getAllBrandIds().length }}
        />
      </p>
    </section>
  );
};

export default CraftStories;
