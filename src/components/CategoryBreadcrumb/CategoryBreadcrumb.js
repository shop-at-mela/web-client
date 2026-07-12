import React from 'react';
import { array, bool, object, oneOfType, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';
import { NamedLink, IconArrowHead } from '../../components';

import css from './CategoryBreadcrumb.module.css';

/**
 * Parse category hierarchy from category string or object
 * Supports formats like:
 * - "Baby Care > Feeding > Bottles" (string with separators)
 * - ["Baby Care", "Feeding", "Bottles"] (array)
 * - { main: "Baby Care", sub: "Feeding", specific: "Bottles" } (object)
 * - { level1: "Baby Care", level2: "Feeding", level3: "Bottles" } (object)
 *
 * Each entry carries a levelNumber so links can be built against the
 * pub_categoryLevelN search params that filter real listing fields
 * (categoryLevel1/2/3) - the same convention SearchPage, CategoryPage, and
 * CategoryShowcase use elsewhere in the app.
 */
const parseCategoryHierarchy = (category) => {
  if (!category) return [];

  // If it's a string with separators (>, /, |, etc.)
  if (typeof category === 'string') {
    // Split by common separators and clean whitespace
    const separators = /[>\/|→\-]/;
    const names = separators.test(category)
      ? category.split(separators).map(cat => cat.trim()).filter(Boolean)
      : [category];
    return names.map((name, index) => ({ name, levelNumber: index + 1 }));
  }

  // If it's an array
  if (Array.isArray(category)) {
    return category.filter(Boolean).map((name, index) => ({ name, levelNumber: index + 1 }));
  }

  // If it's an object with hierarchy properties
  if (typeof category === 'object') {
    const hierarchy = [];

    // Support both legacy format (main, sub, specific, detailed) and level-based format
    if (category.main) hierarchy.push({ name: category.main, levelNumber: 1 });
    if (category.sub) hierarchy.push({ name: category.sub, levelNumber: 2 });
    if (category.specific) hierarchy.push({ name: category.specific, levelNumber: 3 });
    if (category.detailed) hierarchy.push({ name: category.detailed, levelNumber: 4 });

    // Support level-based format (level1, level2, level3, etc.)
    const levelKeys = Object.keys(category)
      .filter(key => key.startsWith('level'))
      .sort(); // Sort to ensure correct order (level1, level2, level3, etc.)

    levelKeys.forEach(key => {
      if (category[key]) {
        hierarchy.push({ name: category[key], levelNumber: Number(key.replace('level', '')) });
      }
    });

    return hierarchy;
  }

  return [];
};

/**
 * Build category paths for search filtering.
 * Each path accumulates the pub_categoryLevelN params for every level up to
 * and including itself, matching the flat query params SearchPage expects.
 */
const buildCategoryPaths = (hierarchy) => {
  const paths = [];
  const cumulativeParams = new URLSearchParams();

  hierarchy.forEach((entry, index) => {
    cumulativeParams.set(`pub_categoryLevel${entry.levelNumber}`, entry.name);

    paths.push({
      name: entry.name,
      search: cumulativeParams.toString(),
      level: index,
    });
  });

  return paths;
};

/**
 * CategoryBreadcrumb component displays hierarchical category navigation
 * with links to filter by each category level
 */
const CategoryBreadcrumb = ({
  rootClassName = null,
  className = null,
  category,
  showHomeLink = false,
  separator = '>',
}) => {

  const hierarchy = parseCategoryHierarchy(category);

  if (!hierarchy || hierarchy.length === 0) {
    return null;
  }

  const categoryPaths = buildCategoryPaths(hierarchy);
  const classes = classNames(rootClassName || css.root, className);

  return (
    <nav className={classes} aria-label="Category breadcrumb">
      <ul className={css.breadcrumbList}>
        {showHomeLink && (
          <li className={css.breadcrumbItem}>
            <NamedLink
              name="SearchPage"
              className={css.breadcrumbLink}
              title="View all products"
            >
              <span><FormattedMessage id="CategoryBreadcrumb.home" /></span>
            </NamedLink>
            <IconArrowHead
              direction="right"
              size="small"
              className={css.chevronIcon}
            />
          </li>
        )}

        {categoryPaths.map((categoryPath, index) => {
          const isLast = index === categoryPaths.length - 1;

          return (
            <li key={categoryPath.search} className={css.breadcrumbItem}>
              <NamedLink
                name="SearchPage"
                to={{
                  search: `?${categoryPath.search}`
                }}
                className={isLast ? css.currentCategory : css.breadcrumbLink}
                title={`View all products in ${categoryPath.name}`}
                {...(isLast ? { 'aria-current': 'page' } : {})}
              >
                <span>{categoryPath.name}</span>
              </NamedLink>
              {!isLast && (
                <IconArrowHead
                  direction="right"
                  size="small"
                  className={css.chevronIcon}
                />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};


CategoryBreadcrumb.propTypes = {
  rootClassName: string,
  className: string,
  category: oneOfType([
    string,
    array,
    object,
  ]).isRequired,
  showHomeLink: bool,
  separator: string,
};

export default CategoryBreadcrumb;