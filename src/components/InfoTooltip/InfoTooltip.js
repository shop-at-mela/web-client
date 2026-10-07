/**
 * InfoTooltip
 *
 * A small "i" button that explains a fact in a popover (PRD international-shipping-transparency
 * P1.4). Unlike CertificationBadge's CSS hover tooltip it works on touch and keyboard:
 *   - a button with a 24px hit area and an accessible name
 *   - opens on tap/click, and on keyboard focus (:focus-visible only, so a tap that also
 *     focuses the button does not open and then immediately close it)
 *   - closes on Escape, on an outside tap, and on a second tap of the button
 *   - the text is always in the DOM as the button's description (aria-describedby), so screen
 *     readers get it without opening the popover
 *   - the popover renders through a portal with fixed positioning, because the trust chip row
 *     scrolls horizontally and would clip an absolutely positioned child
 *   - it opens downward unless that would run under the sticky bottom bar, then upward
 *
 * Usage:
 *   <InfoTooltip label="About duties">Nicobar includes US import duties ...</InfoTooltip>
 */

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { node, string } from 'prop-types';

import css from './InfoTooltip.module.css';

// Space kept clear of the popover, in px. The bottom value covers the mobile sticky bar
// (Add to Cart, about 76px tall); the top value covers the sticky top bar.
const GUTTER = 16;
const GAP = 8;
const RESERVED_TOP = 72;
const RESERVED_BOTTOM = 96;
const MAX_WIDTH = 288;
// Below this viewport width the popover is full width minus the gutters (PRD P1.4 / §5).
const PHONE_MAX_WIDTH = 768;

const isFocusVisible = element => {
  try {
    return element.matches(':focus-visible');
  } catch (e) {
    // Browsers without :focus-visible support never open on focus, they still open on tap.
    return false;
  }
};

/**
 * Where to put the popover: fixed coordinates from the trigger's rectangle.
 * Prefers below the trigger; goes above when below would run under the sticky bar.
 */
export const getPopoverWidth = viewportWidth =>
  viewportWidth < PHONE_MAX_WIDTH ? viewportWidth - 2 * GUTTER : MAX_WIDTH;

export const getPopoverPosition = (triggerRect, popoverHeight, viewport) => {
  const width = getPopoverWidth(viewport.width);
  const triggerCenter = triggerRect.left + triggerRect.width / 2;
  const left = Math.max(
    GUTTER,
    Math.min(triggerCenter - width / 2, viewport.width - width - GUTTER)
  );

  const fitsBelow = triggerRect.bottom + GAP + popoverHeight <= viewport.height - RESERVED_BOTTOM;
  const fitsAbove = triggerRect.top - GAP - popoverHeight >= RESERVED_TOP;
  const placement = fitsBelow || !fitsAbove ? 'below' : 'above';
  const top =
    placement === 'below'
      ? triggerRect.bottom + GAP
      : Math.max(RESERVED_TOP, triggerRect.top - GAP - popoverHeight);
  return { left, top, width, placement, fitsEitherSide: fitsBelow || fitsAbove };
};

const InfoTooltip = ({ label, children, className }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  // Set while Escape hands focus back to the button, so that focus does not reopen the popover.
  const ignoreFocusRef = useRef(false);
  const id = `info-tooltip-${useId().replace(/:/g, '')}`;

  const close = useCallback(() => setOpen(false), []);

  const reposition = useCallback(() => {
    if (!triggerRef.current || !popoverRef.current) return;
    const next = getPopoverPosition(
      triggerRef.current.getBoundingClientRect(),
      popoverRef.current.offsetHeight,
      { width: window.innerWidth, height: window.innerHeight }
    );
    setPosition(next);
    return next;
  }, []);

  // Measure after the popover mounts. If neither side has room (a short viewport), bring the
  // trigger into view once and measure again.
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    const next = reposition();
    if (next && !next.fitsEitherSide && triggerRef.current?.scrollIntoView) {
      triggerRef.current.scrollIntoView({ block: 'center' });
      reposition();
    }
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        close();
        ignoreFocusRef.current = true;
        triggerRef.current?.focus();
        ignoreFocusRef.current = false;
      }
    };
    const onOutside = event => {
      const target = event.target;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside, { passive: true });
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, close, reposition]);

  const handleFocus = event => {
    if (ignoreFocusRef.current) return;
    if (isFocusVisible(event.currentTarget)) setOpen(true);
  };

  const popover =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={popoverRef}
            className={css.popover}
            data-placement={position?.placement}
            aria-hidden="true"
            style={
              position
                ? { left: position.left, top: position.top, width: position.width }
                : {
                    // Measured hidden at its final width, so its height is right when placed.
                    left: GUTTER,
                    top: 0,
                    width: getPopoverWidth(window.innerWidth),
                    visibility: 'hidden',
                  }
            }
          >
            {children}
          </div>,
          document.body
        )
      : null;

  return (
    <span className={[css.root, className].filter(Boolean).join(' ')}>
      <button
        ref={triggerRef}
        type="button"
        className={css.trigger}
        aria-label={label}
        aria-describedby={id}
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
        onFocus={handleFocus}
      >
        <span className={css.glyph} aria-hidden="true">
          i
        </span>
      </button>
      <span id={id} className={css.description}>
        {children}
      </span>
      {popover}
    </span>
  );
};

InfoTooltip.propTypes = {
  label: string.isRequired,
  children: node.isRequired,
  className: string,
};

export default InfoTooltip;
