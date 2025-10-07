import React, { useState } from 'react';
import { arrayOf, bool, number, object, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';
import { Modal } from '../../components';
import { CategoryBreadcrumb } from '../../components';

import css from './ItemSpecifics.module.css';

const ItemSpecificsModal = ({ isOpen, onClose, attributes, categoryBreadcrumb }) => {
  if (!isOpen) return null;

  return (
    <Modal
      id="ItemSpecificsModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={() => {}}
      containerClassName={css.modalContainer}
      className={css.modal}
    >
      <div className={css.modalContent}>
        <div className={css.modalHeader}>
          <h3 className={css.modalTitle}>
            <FormattedMessage id="ItemSpecifics.modalTitle" />
          </h3>
          <button
            className={css.modalCloseButton}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className={css.modalBody}>
          <table className={css.modalAttributesTable}>
            <tbody>
              {categoryBreadcrumb && (
                <tr className={css.attributeRow}>
                  <th className={css.attributeKey}>
                    <FormattedMessage id="ItemSpecifics.category" />
                  </th>
                  <td className={css.attributeValue}>
                    {categoryBreadcrumb}
                  </td>
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
    </Modal>
  );
};

const ItemSpecifics = ({
  rootClassName,
  className,
  attributes = [],
  categoryBreadcrumb = null,
  maxMobileAttributes = 4,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!attributes.length && !categoryBreadcrumb) {
    return null;
  }

  // Prepare all attributes with category at the top
  const allAttributes = [];
  if (categoryBreadcrumb) {
    allAttributes.push({
      key: <FormattedMessage id="ItemSpecifics.category" />,
      value: categoryBreadcrumb,
    });
  }
  allAttributes.push(...attributes);

  // For mobile: show only first maxMobileAttributes
  const mobileAttributes = allAttributes.slice(0, maxMobileAttributes);
  const hasMoreAttributes = allAttributes.length > maxMobileAttributes;

  const classes = classNames(rootClassName || css.root, className);

  return (
    <section className={classes}>
      <h2 className={css.title}>
        <FormattedMessage id="ItemSpecifics.title" />
      </h2>

      {/* Desktop Layout - eBay-style table */}
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

      {/* Mobile Layout - eBay-style table with show more */}
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
            onClick={() => setIsModalOpen(true)}
          >
            <FormattedMessage
              id="ItemSpecifics.showMore"
              values={{ count: allAttributes.length - maxMobileAttributes }}
            />
          </button>
        )}
      </div>

      <ItemSpecificsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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