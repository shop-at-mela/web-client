import React, { useState } from 'react';
import { arrayOf, number, object, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';

import css from './ItemSpecifics.module.css';

const ItemSpecificsSheet = ({ isOpen, onClose, attributes, categoryBreadcrumb }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className={css.backdrop} onClick={onClose} aria-hidden="true" />
      <div
        className={css.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="Product details"
      >
        <div className={css.sheetHandle} />
        <div className={css.sheetHeader}>
          <span className={css.sheetTitle}>
            <FormattedMessage id="ItemSpecifics.modalTitle" />
          </span>
          <button className={css.sheetClose} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className={css.sheetBody}>
          <table className={css.attributesTable}>
            <tbody>
              {categoryBreadcrumb && (
                <tr className={css.attributeRow}>
                  <th className={css.attributeKey}>
                    <FormattedMessage id="ItemSpecifics.category" />
                  </th>
                  <td className={css.attributeValue}>{categoryBreadcrumb}</td>
                </tr>
              )}
              {attributes.map(({ key, value }, index) => (
                <tr key={index} className={css.attributeRow}>
                  <th className={css.attributeKey}>{key}</th>
                  <td className={css.attributeValue}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

const ItemSpecifics = ({
  rootClassName,
  className,
  attributes = [],
  categoryBreadcrumb = null,
  maxMobileAttributes = 4,
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (!attributes.length && !categoryBreadcrumb) {
    return null;
  }

  const allAttributes = [];
  if (categoryBreadcrumb) {
    allAttributes.push({
      key: <FormattedMessage id="ItemSpecifics.category" />,
      value: categoryBreadcrumb,
    });
  }
  allAttributes.push(...attributes);

  const mobileAttributes = allAttributes.slice(0, maxMobileAttributes);
  const hasMoreAttributes = allAttributes.length > maxMobileAttributes;

  const classes = classNames(rootClassName || css.root, className);

  return (
    <section className={classes}>
      <h2 className={css.title}>
        <FormattedMessage id="ItemSpecifics.title" />
      </h2>

      {/* Desktop Layout */}
      <div className={css.desktopLayout}>
        <table className={css.attributesTable}>
          <tbody>
            {allAttributes.map(({ key, value }, index) => (
              <tr key={index} className={css.attributeRow}>
                <th className={css.attributeKey}>{key}</th>
                <td className={css.attributeValue}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Layout */}
      <div className={css.mobileLayout}>
        <table className={css.attributesTable}>
          <tbody>
            {mobileAttributes.map(({ key, value }, index) => (
              <tr key={index} className={css.attributeRow}>
                <th className={css.attributeKey}>{key}</th>
                <td className={css.attributeValue}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {hasMoreAttributes && (
          <button
            className={css.showMoreButton}
            onClick={() => setIsSheetOpen(true)}
          >
            <FormattedMessage
              id="ItemSpecifics.showAll"
              values={{ count: allAttributes.length }}
            />
          </button>
        )}
      </div>

      <ItemSpecificsSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        attributes={attributes}
        categoryBreadcrumb={categoryBreadcrumb}
      />
    </section>
  );
};

ItemSpecifics.propTypes = {
  rootClassName: string,
  className: string,
  attributes: arrayOf(object),
  categoryBreadcrumb: object,
  maxMobileAttributes: number,
};

export default ItemSpecifics;
