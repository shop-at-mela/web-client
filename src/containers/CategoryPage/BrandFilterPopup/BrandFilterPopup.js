import React, { useState } from 'react';
import { arrayOf, func, shape, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
// Direct leaf imports, not the barrel — the barrel pulls in SavedPageRecommendations →
// homepageSdk → createInstance() at module load time, which throws without an SDK
// client id in the test env (see CategoryPage.test.js's sdkLoader mock for the same issue).
import KeyboardListener from '../../../components/KeyboardListener/KeyboardListener';
import OutsideClickHandler from '../../../components/OutsideClickHandler/OutsideClickHandler';
import PopupOpenerButton from '../../SearchPage/PopupOpenerButton/PopupOpenerButton';

import css from './BrandFilterPopup.module.css';

/**
 * BrandFilterPopup — CategoryPage's brand filter: a single-select popup where each
 * option shows the brand's name plus its craft line (see util/brandCraft.js).
 *
 * Deliberately NOT built on the shared SelectSingleFilter/FilterPopup/FieldSelectTree
 * stack those components hard-drop any option field beyond `option`/`label`, so
 * showing a second line per option isn't expressible through them without changing
 * a component every other SearchPage filter also depends on. This is a smaller,
 * page-scoped popup reusing the same primitives FilterPopup itself is built from
 * (PopupOpenerButton, OutsideClickHandler, KeyboardListener) instead.
 *
 * Two intentional simplifications vs. FilterPopup, appropriate for this page-scoped
 * control: selection applies immediately on click (no separate Apply/Cancel step —
 * the two-step flow was the actual friction FilterPopup has for a single-select list,
 * per review), and the popup always opens right-aligned under the toggle rather than
 * FilterPopup's dynamic left/right placement (this control only ever renders in one
 * layout position — the CategoryPage grid header — so the dynamic placement FilterPopup
 * needs as a generic, reusable component isn't needed here).
 *
 * @component
 * @param {Object} props
 * @param {string} props.id - Base id; toggle button and list use `${id}.toggle`/`${id}.list`
 * @param {Array<{id: string, name: string, craft: ?string}>} props.brands
 * @param {?string} props.selectedBrandId
 * @param {?string} props.selectedBrandName
 * @param {Function} props.onSelect - Called with a brand id, or null to clear
 */
const BrandFilterPopup = props => {
  const { id, brands, selectedBrandId, selectedBrandName, onSelect } = props;

  const [isOpen, setIsOpen] = useState(false);
  const intl = useIntl();

  const label = selectedBrandName || intl.formatMessage({ id: 'CategoryPage.brandFilterLabel' });
  const ariaLabel = intl.formatMessage(
    { id: 'SearchPage.screenreader.openFilterButton' },
    {
      label,
      status: selectedBrandId ? 'active' : 'inactive',
      values: selectedBrandName,
      mode: 'normal',
    }
  );

  const focusToggle = () => {
    document.getElementById(`${id}.toggle`)?.focus();
  };

  const close = () => setIsOpen(false);

  const handleSelect = brandId => {
    setIsOpen(false);
    onSelect(brandId);
    focusToggle();
  };

  const handleOutsideClick = () => {
    if (isOpen) {
      close();
    }
  };

  return (
    <OutsideClickHandler onOutsideClick={handleOutsideClick}>
      <KeyboardListener
        keyMap={{
          Escape: {
            action: 'close',
            callback: () => {
              if (isOpen) {
                close();
                focusToggle();
              }
            },
          },
        }}
      >
        <div className={css.root}>
          <PopupOpenerButton
            id={`${id}.toggle`}
            isSelected={!!selectedBrandId}
            toggleOpen={() => setIsOpen(open => !open)}
            aria-label={ariaLabel}
            aria-expanded={isOpen}
            aria-controls={isOpen ? `${id}.list` : ''}
          >
            {label}
          </PopupOpenerButton>

          {isOpen ? (
            <div className={css.popup} id={`${id}.list`}>
              <p className={css.popupLabel}>
                <FormattedMessage id="CategoryPage.brandFilterLabel" />
              </p>
              <div className={css.optionListScroll}>
                <ul className={css.optionList}>
                  {brands.map(brand => (
                    <li key={brand.id} className={css.optionRow}>
                      <button
                        type="button"
                        className={classNames(css.optionBtn, {
                          [css.selectedOption]: brand.id === selectedBrandId,
                        })}
                        onClick={() => handleSelect(brand.id)}
                      >
                        <span className={css.optionName}>{brand.name}</span>
                        {brand.craft ? (
                          <span className={css.optionCraft}>{brand.craft}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              {selectedBrandId ? (
                <button type="button" className={css.clearBtn} onClick={() => handleSelect(null)}>
                  <FormattedMessage id="CategoryPage.brandFilterClear" defaultMessage="Clear" />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </KeyboardListener>
    </OutsideClickHandler>
  );
};

BrandFilterPopup.propTypes = {
  id: string.isRequired,
  brands: arrayOf(
    shape({
      id: string.isRequired,
      name: string.isRequired,
      craft: string,
    })
  ).isRequired,
  selectedBrandId: string,
  selectedBrandName: string,
  onSelect: func.isRequired,
};

export default BrandFilterPopup;
