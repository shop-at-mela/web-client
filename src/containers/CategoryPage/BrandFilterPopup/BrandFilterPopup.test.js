import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';

import BrandFilterPopup from './BrandFilterPopup';

const messages = {
  'CategoryPage.brandFilterLabel': 'Brand',
  'CategoryPage.brandFilterClear': 'Clear',
  'SearchPage.screenreader.openFilterButton':
    '{label} filter. {status, select, active {Current selection: {values}.} other {Not in use.}} {mode, select, live {Changing filter values will update the search page immediately.} other {}}',
};

const renderPopup = props => {
  const defaultProps = {
    id: 'test.brandFilter',
    brands: [
      { id: 'brandA', name: 'Masilo', craft: 'Organic muslin, handwoven in Gujarat' },
      { id: 'brandB', name: 'ChooseKind', craft: null },
      { id: 'brandC', name: 'aagghhoo', craft: 'Hand block-printed cotton, Jaipur' },
    ],
    selectedBrandId: null,
    selectedBrandName: null,
    onSelect: jest.fn(),
  };
  const merged = { ...defaultProps, ...props };
  const utils = render(
    <IntlProvider locale="en" messages={messages}>
      <BrandFilterPopup {...merged} />
    </IntlProvider>
  );
  return { ...utils, props: merged };
};

describe('BrandFilterPopup', () => {
  it('renders the toggle button with the generic label when nothing is selected', () => {
    renderPopup();
    expect(screen.getByRole('button', { name: /Brand filter/i })).toHaveTextContent('Brand');
  });

  it('renders the selected brand name as the toggle label when a brand is selected', () => {
    renderPopup({ selectedBrandId: 'brandA', selectedBrandName: 'Masilo' });
    expect(screen.getByRole('button', { name: /filter\./i })).toHaveTextContent('Masilo');
  });

  it('opens the option list on click, showing each brand name and craft line', () => {
    renderPopup();
    fireEvent.click(screen.getByRole('button', { name: /Brand filter/i }));

    expect(screen.getByText('Masilo')).toBeInTheDocument();
    expect(screen.getByText('Organic muslin, handwoven in Gujarat')).toBeInTheDocument();
    expect(screen.getByText('aagghhoo')).toBeInTheDocument();
    expect(screen.getByText('Hand block-printed cotton, Jaipur')).toBeInTheDocument();
  });

  it('renders no second line for a brand with no craft data', () => {
    renderPopup();
    fireEvent.click(screen.getByRole('button', { name: /Brand filter/i }));

    const chooseKindRow = screen.getByText('ChooseKind').closest('button');
    // Only the name span — no sibling craft line for this brand.
    expect(chooseKindRow.children).toHaveLength(1);
  });

  it('applies selection immediately on click (no separate Apply step) and closes the popup', () => {
    const onSelect = jest.fn();
    renderPopup({ onSelect });
    fireEvent.click(screen.getByRole('button', { name: /Brand filter/i }));
    fireEvent.click(screen.getByText('Masilo'));

    expect(onSelect).toHaveBeenCalledWith('brandA');
    expect(screen.queryByText('aagghhoo')).not.toBeInTheDocument(); // popup closed
  });

  it('renders no Clear button when nothing is selected', () => {
    renderPopup();
    fireEvent.click(screen.getByRole('button', { name: /Brand filter/i }));
    expect(screen.queryByText('Clear')).not.toBeInTheDocument();
  });

  it('shows a Clear button when a brand is selected, and clearing calls onSelect(null)', () => {
    const onSelect = jest.fn();
    renderPopup({ selectedBrandId: 'brandA', selectedBrandName: 'Masilo', onSelect });
    fireEvent.click(screen.getByRole('button', { name: /filter\./i }));
    fireEvent.click(screen.getByText('Clear'));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('closes the popup on Escape', () => {
    renderPopup();
    // Fire on the toggle button (inside KeyboardListener's container) — firing on
    // `document` itself never matches, since a DOM node can't "contain" `document`.
    const toggle = screen.getByRole('button', { name: /Brand filter/i });
    fireEvent.click(toggle);
    expect(screen.getByText('Masilo')).toBeInTheDocument();

    fireEvent.keyDown(toggle, { key: 'Escape' });
    expect(screen.queryByText('Masilo')).not.toBeInTheDocument();
  });

  it('closes the popup on an outside click', () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <div>
          <div data-testid="outside">outside</div>
          <BrandFilterPopup
            id="test.brandFilter"
            brands={[{ id: 'brandA', name: 'Masilo', craft: null }]}
            selectedBrandId={null}
            selectedBrandName={null}
            onSelect={jest.fn()}
          />
        </div>
      </IntlProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /Brand filter/i }));
    expect(screen.getByText('Masilo')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('Masilo')).not.toBeInTheDocument();
  });

  it('marks the currently selected brand row so it can be visually distinguished', () => {
    renderPopup({ selectedBrandId: 'brandC', selectedBrandName: 'aagghhoo' });
    fireEvent.click(screen.getByRole('button', { name: /filter\./i }));

    // Scope to the option list — the toggle button's own label also reads "aagghhoo"
    // once it's the active selection.
    const list = within(screen.getByRole('list'));
    const selectedRow = list.getByText('aagghhoo').closest('button');
    const unselectedRow = list.getByText('Masilo').closest('button');
    expect(selectedRow.className).toContain('selectedOption');
    expect(unselectedRow.className).not.toContain('selectedOption');
  });
});
