import React from 'react';
import '@testing-library/jest-dom';
import { render as rtlRender, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import enMessages from '../../translations/en.json';
import ListingTrustChips from './ListingTrustChips';

const render = ui =>
  rtlRender(
    <IntlProvider locale="en" messages={enMessages}>
      {ui}
    </IntlProvider>
  );

const FRESH = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

// item_aspects format: "Field|field_id: Value|option_value|description; ..."
const itemAspectsWithOccasion =
  'Occasion|occasion: Baby shower|baby_shower|Perfect for gifting; Age Group|age_group: 0-6 months|0_6m|';

describe('ListingTrustChips', () => {
  it('renders cert chips for known certification keys', () => {
    render(
      <ListingTrustChips
        certifications={['gots_certified', 'non_toxic_dyes']}
        itemAspects={null}
      />
    );
    expect(screen.getByText(/GOTS Certified/i)).toBeInTheDocument();
    expect(screen.getByText(/Non-toxic/i)).toBeInTheDocument();
  });

  it('renders occasion chips with "For:" prefix', () => {
    render(
      <ListingTrustChips
        certifications={[]}
        itemAspects={itemAspectsWithOccasion}
      />
    );
    expect(screen.getByText(/For: Baby shower/i)).toBeInTheDocument();
  });

  it('returns null when no certifications and no occasion aspects', () => {
    const { container } = render(
      <ListingTrustChips certifications={[]} itemAspects={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('applies role="list" and role="listitem" for accessibility', () => {
    render(
      <ListingTrustChips
        certifications={['gots_certified']}
        itemAspects={null}
      />
    );
    expect(screen.getByRole('list')).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBeGreaterThan(0);
  });

  describe('"Duties included" chip (P1.3)', () => {
    const ddp = { duties: 'ddp', method: 'flat_rate', feeUsd: 30, checkedAt: FRESH };
    const chipTexts = () => screen.getAllByRole('listitem').map(item => item.textContent);

    it('renders for a DDP brand with duties in its prices, before the cert chips', () => {
      render(
        <ListingTrustChips
          certifications={['gots_certified']}
          itemAspects={null}
          usShipping={ddp}
          brand="Nicobar"
        />
      );
      const chips = chipTexts();
      expect(chips[0]).toMatch(/^✓ Duties included/);
      expect(chips[1]).toMatch(/GOTS Certified/);
    });

    it('renders alone when there are no cert or occasion chips', () => {
      render(<ListingTrustChips usShipping={ddp} brand="Nicobar" />);
      expect(chipTexts()).toHaveLength(1);
      expect(chipTexts()[0]).toMatch(/^✓ Duties included/);
    });

    it.each([
      ['DDU', { ...ddp, duties: 'ddu' }],
      ['unknown duties', { method: 'flat_rate', feeUsd: 30, checkedAt: FRESH }],
      ['DDP that adds duties at checkout', { ...ddp, dutiesCollected: 'at_checkout' }],
      ['stale DDP data', { ...ddp, checkedAt: '2025-01-01' }],
      ['DDP with no checkedAt (Nicobar today)', { duties: 'ddp', method: 'flat_rate', feeUsd: 30 }],
      ['no data', null],
    ])('has no chip for %s', (name, usShipping) => {
      const { container } = render(<ListingTrustChips usShipping={usShipping} brand="Nicobar" />);
      expect(container.firstChild).toBeNull();
    });

    it('has an accessible tooltip button that opens the brand explanation on tap', () => {
      render(<ListingTrustChips usShipping={ddp} brand="Nicobar" />);
      const button = screen.getByRole('button', { name: 'About duties' });
      const explanation =
        'Nicobar includes US import duties in its prices, so nothing is due when your order arrives.';
      expect(button).toHaveAccessibleDescription(explanation);
      fireEvent.click(button);
      // The visible popover is portaled to the body, next to the screen reader description.
      expect(screen.getAllByText(explanation)).toHaveLength(2);
    });
  });
});
