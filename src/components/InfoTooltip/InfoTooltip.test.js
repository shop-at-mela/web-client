import React from 'react';
import '@testing-library/jest-dom';
import fs from 'fs';
import path from 'path';
import { render, screen, fireEvent } from '@testing-library/react';
import InfoTooltip, { getPopoverPosition } from './InfoTooltip';

const TEXT = 'Nicobar includes US import duties in its prices.';

const renderTooltip = () =>
  render(
    <div>
      <p>outside</p>
      <InfoTooltip label="About duties">{TEXT}</InfoTooltip>
    </div>
  );

const popover = () => document.body.querySelector('[data-placement], [aria-hidden="true"][style]');

describe('InfoTooltip', () => {
  const originalMatches = Element.prototype.matches;
  afterEach(() => {
    Element.prototype.matches = originalMatches;
  });

  it('is a button with an accessible name and the text as its description', () => {
    renderTooltip();
    const button = screen.getByRole('button', { name: 'About duties' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAccessibleDescription(TEXT);
  });

  it('keeps the text reachable for screen readers without opening it', () => {
    renderTooltip();
    expect(screen.getAllByText(TEXT)).toHaveLength(1);
    expect(popover()).toBeNull();
  });

  it('opens on tap into a portal under the body, and closes on a second tap', () => {
    const { container } = renderTooltip();
    const button = screen.getByRole('button', { name: 'About duties' });
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByText(TEXT)).toHaveLength(2);
    // The visible popover is not inside the component's own (possibly scrolling) container.
    const visible = screen.getAllByText(TEXT).find(el => el.getAttribute('aria-hidden') === 'true');
    expect(container.contains(visible)).toBe(false);
    expect(visible.parentElement).toBe(document.body);
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getAllByText(TEXT)).toHaveLength(1);
  });

  it('opens on keyboard focus (:focus-visible)', () => {
    Element.prototype.matches = function matches(selector) {
      return selector === ':focus-visible' ? true : originalMatches.call(this, selector);
    };
    renderTooltip();
    const button = screen.getByRole('button', { name: 'About duties' });
    fireEvent.focus(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('does not open on a plain focus, so a tap does not open and then close', () => {
    Element.prototype.matches = function matches(selector) {
      return selector === ':focus-visible' ? false : originalMatches.call(this, selector);
    };
    renderTooltip();
    const button = screen.getByRole('button', { name: 'About duties' });
    // A tap focuses the button and then clicks it.
    fireEvent.focus(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('survives a browser that throws on :focus-visible', () => {
    Element.prototype.matches = function matches(selector) {
      if (selector === ':focus-visible') throw new Error('unsupported');
      return originalMatches.call(this, selector);
    };
    renderTooltip();
    const button = screen.getByRole('button', { name: 'About duties' });
    fireEvent.focus(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes on Escape and returns focus to the button', () => {
    renderTooltip();
    const button = screen.getByRole('button', { name: 'About duties' });
    fireEvent.click(button);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
  });

  it('does not reopen when Escape hands focus back, even though the focus is keyboard visible', () => {
    Element.prototype.matches = function matches(selector) {
      return selector === ':focus-visible' ? true : originalMatches.call(this, selector);
    };
    renderTooltip();
    const button = screen.getByRole('button', { name: 'About duties' });
    fireEvent.click(button);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
  });

  it('ignores other keys', () => {
    renderTooltip();
    const button = screen.getByRole('button', { name: 'About duties' });
    fireEvent.click(button);
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes on an outside tap but not on a tap inside the popover', () => {
    renderTooltip();
    const button = screen.getByRole('button', { name: 'About duties' });
    fireEvent.click(button);
    const visible = screen.getAllByText(TEXT).find(el => el.getAttribute('aria-hidden') === 'true');
    fireEvent.mouseDown(visible);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    fireEvent.touchStart(screen.getByText('outside'));
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on an outside mouse press', () => {
    renderTooltip();
    const button = screen.getByRole('button', { name: 'About duties' });
    fireEvent.click(button);
    fireEvent.mouseDown(screen.getByText('outside'));
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('removes its document listeners when it unmounts open', () => {
    const remove = jest.spyOn(document, 'removeEventListener');
    const { unmount } = renderTooltip();
    fireEvent.click(screen.getByRole('button', { name: 'About duties' }));
    unmount();
    expect(remove.mock.calls.map(call => call[0])).toEqual(
      expect.arrayContaining(['keydown', 'mousedown', 'touchstart'])
    );
    remove.mockRestore();
  });

  it('gives the button a 24px hit area in its stylesheet', () => {
    const css = fs.readFileSync(path.join(__dirname, 'InfoTooltip.module.css'), 'utf8');
    const trigger = css.match(/\.trigger \{[^}]*\}/)[0];
    expect(trigger).toMatch(/width: 24px/);
    expect(trigger).toMatch(/height: 24px/);
  });

  it('positions the popover with fixed positioning, which a scrolling chip row cannot clip', () => {
    const css = fs.readFileSync(path.join(__dirname, 'InfoTooltip.module.css'), 'utf8');
    expect(css.match(/\.popover \{[^}]*\}/)[0]).toMatch(/position: fixed/);
  });
});

describe('getPopoverPosition', () => {
  const phone = { width: 375, height: 667 };

  it('opens below the trigger when there is room above the sticky bar', () => {
    const rect = { left: 100, right: 124, top: 200, bottom: 224, width: 24, height: 24 };
    const result = getPopoverPosition(rect, 80, phone);
    expect(result.placement).toBe('below');
    expect(result.top).toBe(232);
  });

  it('opens upward when below would run under the sticky bottom bar', () => {
    // The shipping line at 375 x 667 sits at about 560px, where the sticky bar starts at 595px.
    const rect = { left: 300, right: 324, top: 556, bottom: 580, width: 24, height: 24 };
    const result = getPopoverPosition(rect, 90, phone);
    expect(result.placement).toBe('above');
    expect(result.top + 90).toBeLessThanOrEqual(rect.top);
  });

  it('is full width minus 16px gutters on a phone and stays inside them', () => {
    const rect = { left: 340, right: 364, top: 200, bottom: 224, width: 24, height: 24 };
    const result = getPopoverPosition(rect, 80, phone);
    expect(result.width).toBe(343);
    expect(result.left).toBe(16);
    expect(result.left + result.width).toBe(375 - 16);
  });

  it('narrows with a smaller phone', () => {
    const rect = { left: 10, right: 34, top: 200, bottom: 224, width: 24, height: 24 };
    expect(getPopoverPosition(rect, 80, { width: 320, height: 600 }).width).toBe(288);
    expect(getPopoverPosition(rect, 80, { width: 300, height: 600 }).width).toBe(268);
  });

  it('is a compact 288px popover from tablet width up', () => {
    const rect = { left: 1100, right: 1124, top: 300, bottom: 324, width: 24, height: 24 };
    const result = getPopoverPosition(rect, 80, { width: 1440, height: 900 });
    expect(result.width).toBe(288);
    expect(result.left + result.width).toBeLessThanOrEqual(1440 - 16);
  });

  it('reports when neither side has room so the trigger can be scrolled into view', () => {
    const rect = { left: 100, right: 124, top: 90, bottom: 114, width: 24, height: 24 };
    const result = getPopoverPosition(rect, 400, { width: 375, height: 500 });
    expect(result.fitsEitherSide).toBe(false);
  });
});
