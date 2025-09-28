import React from 'react';
import { array, bool, object, oneOfType, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';
import { createSlug } from '../../util/urlHelpers';
import { NamedLink } from '../../components';

import css from './CategoryBreadcrumb.module.css';

/**
 * Parse category hierarchy from category string or object
 * Supports formats like:
 * - "Baby Care > Feeding > Bottles" (string with separators)
 * - ["Baby Care", "Feeding", "Bottles"] (array)
 * - { main: "Baby Care", sub: "Feeding", specific: "Bottles" } (object)
 */
const parseCategoryHierarchy = (category) => {
  if (!category) return [];

  // If it's a string with separators (>, /, |, etc.)
  if (typeof category === 'string') {
    // Split by common separators and clean whitespace
    const separators = /[>\/|→\-]/;
    if (separators.test(category)) {
      return category.split(separators).map(cat => cat.trim()).filter(Boolean);
    }
    // Single category
    return [category];
  }

  // If it's an array
  if (Array.isArray(category)) {
    return category.filter(Boolean);
  }

  // If it's an object with hierarchy properties
  if (typeof category === 'object') {
    const hierarchy = [];

    // Support both legacy format (main, sub, specific, detailed) and level-based format
    if (category.main) hierarchy.push(category.main);
    if (category.sub) hierarchy.push(category.sub);
    if (category.specific) hierarchy.push(category.specific);
    if (category.detailed) hierarchy.push(category.detailed);

    // Support level-based format (level1, level2, level3, etc.)
    const levelKeys = Object.keys(category)
      .filter(key => key.startsWith('level'))
      .sort(); // Sort to ensure correct order (level1, level2, level3, etc.)

    levelKeys.forEach(key => {
      if (category[key]) hierarchy.push(category[key]);
    });

    return hierarchy;
  }

  return [];
};

/**
 * Build category path for search filtering
 * Creates cumulative category paths for each level
 */
const buildCategoryPaths = (hierarchy) => {
  const paths = [];
  let currentPath = '';

  hierarchy.forEach((category, index) => {
    if (index === 0) {
      currentPath = category;
    } else {
      currentPath += ` > ${category}`;
    }

    paths.push({
      name: category,
      fullPath: currentPath,
      slug: createSlug(category),
      level: index
    });
  });

  return paths;
};

/**
 * CategoryBreadcrumb component displays hierarchical category navigation
 * with links to filter by each category level
 */
const CategoryBreadcrumb = props => {
  const {
    rootClassName,
    className,
    category,
    showHomeLink = true,
    separator = '>',
  } = props;

  const hierarchy = parseCategoryHierarchy(category);

  if (!hierarchy || hierarchy.length === 0) {
    return null;
  }

  const categoryPaths = buildCategoryPaths(hierarchy);
  const classes = classNames(rootClassName || css.root, className);

  return (
    <nav className={classes} aria-label="Category breadcrumb">
      <ol className={css.breadcrumbList}>
        {showHomeLink && (
          <li className={css.breadcrumbItem}>
            <NamedLink
              name="SearchPage"
              className={css.homeLink}
              title="View all products"
            >
              <FormattedMessage id="CategoryBreadcrumb.home" />
            </NamedLink>
            <span className={css.separator} aria-hidden="true">
              {separator}
            </span>
          </li>
        )}

        {categoryPaths.map((categoryPath, index) => {
          const isLast = index === categoryPaths.length - 1;

          return (
            <li key={categoryPath.fullPath} className={css.breadcrumbItem}>
              {isLast ? (
                <span className={css.currentCategory} aria-current="page">
                  {categoryPath.name}
                </span>
              ) : (
                <>
                  <NamedLink
                    name="SearchPage"
                    to={{
                      search: `?pub_category=${encodeURIComponent(categoryPath.fullPath)}`
                    }}
                    className={css.categoryLink}
                    title={`View all products in ${categoryPath.name}`}
                  >
                    {categoryPath.name}
                  </NamedLink>
                  <span className={css.separator} aria-hidden="true">
                    {separator}
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

CategoryBreadcrumb.defaultProps = {
  rootClassName: null,
  className: null,
  showHomeLink: true,
  separator: '>',
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