import React from 'react';
import '@testing-library/jest-dom';
import { render as rtlRender, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import enMessages from '../../translations/en.json';
import { types as sdkTypes } from '../../util/sdkLoader';
import { BRANDS } from '../../util/brandShipping.fixtures';
import ListingShippingTerms, { ListingPriceAndShippingTerms } from './ListingShippingTerms';

const { Money } = sdkTypes;

jest.mock('../../util/liveInrRate', () => ({
  useDisplayPrice: (price, publicData) => ({
    displayPrice: price,
    formattedINRPrice: publicData?.priceInINR
      ? `₹${publicData.priceInINR.toLocaleString('en-IN')}`
      : null,
  }),
}));

const FRESH = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const render = ui =>
  rtlRender(
    <IntlProvider locale="en" messages={enMessages}>
      {ui}
    </IntlProvider>
  );

// Visible text of each line, without the tooltip button and its screen reader description.
const lineText = p => {
  const clone = p.cloneNode(true);
  clone.querySelectorAll('button').forEach(button => button.parentElement.remove());
  return clone.textContent.trim();
};
const lines = container => Array.from(container.querySelectorAll('p')).map(lineText);
const shippingLine = (props, variant = 'mobile') => {
  const { container } = render(
    <ListingShippingTerms loaded variant={variant} brand="Nicobar" {...props} />
  );
  return lines(container)[0];
};

describe('ListingShippingTerms', () => {
  it('renders nothing while the author profile has no publicData (loading)', () => {
    const { container } = render(
      <ListingShippingTerms loaded={false} usShipping={null} brand="Nicobar" inrPrice="₹3,600" />
    );
    expect(container.firstChild).toBeNull();
  });

  describe('exact shipping line per method x duties (mobile)', () => {
    it.each([
      // free
      [
        { method: 'free', duties: 'ddu' },
        'Nicobar ships free to the US. Import duties are extra, paid on delivery',
      ],
      [{ method: 'free', duties: 'ddp' }, 'Nicobar ships free to the US.'],
      [
        { method: 'free', duties: 'ddp', dutiesCollected: 'at_checkout' },
        'Nicobar ships free to the US. It adds US duties at checkout, so nothing is due on delivery.',
      ],
      [
        { method: 'free' },
        "Nicobar ships free to the US. It doesn't say if US duties are included.",
      ],
      // flat rate
      [
        { method: 'flat_rate', feeUsd: 34, feeApprox: true, duties: 'ddu' },
        'Nicobar ships to the US for about $34. Import duties are extra, paid on delivery',
      ],
      [{ method: 'flat_rate', feeUsd: 30, duties: 'ddp' }, 'Nicobar ships to the US for $30.'],
      [
        { method: 'flat_rate', feeUsd: 28, feeApprox: true },
        "Nicobar ships to the US for about $28. It doesn't say if US duties are included.",
      ],
      // flat rate with threshold
      [
        { method: 'flat_rate_free_over_threshold', feeUsd: 30, freeOverUsd: 150, duties: 'ddp' },
        'Nicobar ships to the US for $30, free on orders over $150.',
      ],
      [
        { method: 'flat_rate_free_over_threshold', feeUsd: 15, freeOverUsd: 100, duties: 'ddu' },
        'Nicobar ships to the US for $15, free on orders over $100. Import duties are extra, paid on delivery',
      ],
      [
        { method: 'flat_rate_free_over_threshold', feeUsd: 51, feeApprox: true, duties: 'ddu' },
        'Nicobar ships to the US for about $51. Import duties are extra, paid on delivery',
      ],
      // over the 100 character budget the threshold clause is dropped (it stays on the brand page)
      [
        {
          method: 'flat_rate_free_over_threshold',
          freeOverUsd: 69,
          duties: 'ddp',
          dutiesCollected: 'at_checkout',
        },
        'Nicobar ships to the US. It adds US duties at checkout, so nothing is due on delivery.',
      ],
      // calculated
      [
        { method: 'calculated_at_checkout', duties: 'ddu' },
        'Nicobar ships to the US. Its checkout shows the cost. Import duties are extra, paid on delivery',
      ],
      [
        { method: 'calculated_at_checkout', duties: 'ddp' },
        'Nicobar ships to the US. Its checkout shows the shipping cost.',
      ],
      [
        { method: 'calculated_at_checkout' },
        "Nicobar ships to the US. It doesn't list its shipping cost or say if duties are included.",
      ],
      [
        { method: 'calculated_free_over_threshold', freeOverUsd: 199, duties: 'ddp' },
        'Nicobar ships free to the US on orders over $199. Below that, its checkout shows the cost.',
      ],
      // none and no usable data
      [{ method: 'none', duties: 'ddu' }, "Nicobar doesn't ship to the US yet."],
    ])('%j', (data, expected) => {
      expect(shippingLine({ usShipping: { checkedAt: FRESH, ...data } })).toBe(expected);
    });
  });

  describe('no usable data shows the neutral sentence, never a blanket claim', () => {
    it.each([
      ['null (Isharya)', null],
      ['no checkedAt (Nicobar today)', { method: 'flat_rate', duties: 'ddp', feeUsd: 30 }],
      ['stale', { method: 'flat_rate', duties: 'ddp', feeUsd: 30, checkedAt: '2025-01-01' }],
      ['malformed method', { method: 'teleport', checkedAt: FRESH }],
    ])('%s', (name, usShipping) => {
      expect(shippingLine({ usShipping })).toBe(
        'Nicobar sets shipping and duties at its checkout.'
      );
    });
  });

  it('uses the same text on desktop and mobile except for the desktop "Duties included."', () => {
    BRANDS.forEach(([brand, data]) => {
      const usShipping = { checkedAt: FRESH, ...data };
      const mobile = shippingLine({ usShipping, brand }, 'mobile');
      const desktop = shippingLine({ usShipping, brand }, 'desktop');
      const inPrice =
        data.duties === 'ddp' && data.dutiesCollected !== 'at_checkout' && data.method !== 'none';
      expect(desktop.replace(/ Duties included\.$/, '')).toBe(mobile);
      expect(desktop.endsWith(' Duties included.')).toBe(inPrice);
    });
  });

  it('desktop line 2 also ends "Duties included." for a DDP brand with duties in its prices', () => {
    expect(
      shippingLine(
        {
          usShipping: {
            checkedAt: FRESH,
            method: 'flat_rate_free_over_threshold',
            feeUsd: 30,
            freeOverUsd: 150,
            duties: 'ddp',
          },
        },
        'desktop'
      )
    ).toBe('Nicobar ships to the US for $30, free on orders over $150. Duties included.');
  });

  it('never shows "Duties included." for DDU, unknown or duties added at checkout on desktop', () => {
    [{ duties: 'ddu' }, {}, { duties: 'ddp', dutiesCollected: 'at_checkout' }].forEach(duties => {
      expect(
        shippingLine(
          { usShipping: { checkedAt: FRESH, method: 'flat_rate', feeUsd: 30, ...duties } },
          'desktop'
        )
      ).not.toMatch(/Duties included/);
    });
  });

  describe('estimate line', () => {
    it('is the second line and only when the price was converted from INR', () => {
      const { container } = render(
        <ListingShippingTerms
          loaded
          brand="House of Chikankari"
          inrPrice="₹3,600"
          usShipping={{
            checkedAt: FRESH,
            duties: 'ddu',
            method: 'flat_rate',
            feeUsd: 34,
            feeApprox: true,
          }}
        />
      );
      const all = lines(container);
      expect(all).toHaveLength(2);
      expect(all[0]).toMatch(/^House of Chikankari ships to the US for about \$34\./);
      expect(all[1]).toMatch(/^Estimated from the ₹3,600 India price/);
    });

    it('is absent for USD priced brands', () => {
      const { container } = render(
        <ListingShippingTerms
          loaded
          brand="Nicobar"
          usShipping={{ checkedAt: FRESH, method: 'free', duties: 'ddp' }}
        />
      );
      expect(lines(container)).toHaveLength(1);
    });

    it('explains itself with the brand-as-subject tooltip', () => {
      render(
        <ListingShippingTerms
          loaded
          brand="Nicobar"
          inrPrice="₹3,600"
          usShipping={{ checkedAt: FRESH, method: 'free' }}
        />
      );
      expect(
        screen.getByRole('button', { name: 'About this price estimate' })
      ).toHaveAccessibleDescription(
        'Nicobar sets the final US price at its own checkout, and it can differ from this estimate.'
      );
    });

    it('never says "Indian" or an INR line with a tilde', () => {
      const { container } = render(
        <ListingShippingTerms
          loaded
          brand="Nicobar"
          inrPrice="₹3,600"
          usShipping={{ checkedAt: FRESH, method: 'free' }}
        />
      );
      expect(container.textContent).not.toMatch(/Indian|~₹/);
    });
  });

  describe('duties tooltip', () => {
    it('is on the DDU sentence and explains the courier collects duties', () => {
      render(
        <ListingShippingTerms
          loaded
          brand="House of Chikankari"
          usShipping={{
            checkedAt: FRESH,
            duties: 'ddu',
            method: 'flat_rate',
            feeUsd: 34,
            feeApprox: true,
          }}
        />
      );
      expect(screen.getByRole('button', { name: 'About duties' })).toHaveAccessibleDescription(
        "House of Chikankari's prices don't include US import duties. The courier collects them before delivery. Mela can't estimate the amount."
      );
    });

    it('has none for unknown duties or duties added at checkout', () => {
      render(
        <ListingShippingTerms
          loaded
          brand="Vilvah Store"
          usShipping={{
            checkedAt: FRESH,
            duties: 'ddp',
            dutiesCollected: 'at_checkout',
            method: 'free',
          }}
        />
      );
      expect(screen.queryByRole('button', { name: 'About duties' })).not.toBeInTheDocument();
    });

    it('is on desktop "Duties included." for DDP and not on mobile (the chip carries it)', () => {
      const usShipping = { checkedAt: FRESH, duties: 'ddp', method: 'free' };
      const { unmount } = render(
        <ListingShippingTerms loaded variant="desktop" brand="Nicobar" usShipping={usShipping} />
      );
      expect(screen.getByRole('button', { name: 'About duties' })).toBeInTheDocument();
      unmount();
      render(
        <ListingShippingTerms loaded variant="mobile" brand="Nicobar" usShipping={usShipping} />
      );
      expect(screen.queryByRole('button', { name: 'About duties' })).not.toBeInTheDocument();
    });
  });

  it('falls back to "The brand" when the listing has no brand name', () => {
    expect(
      shippingLine({
        brand: undefined,
        usShipping: { checkedAt: FRESH, method: 'free', duties: 'ddp' },
      })
    ).toBe('The brand ships free to the US.');
  });

  it('uses grey tiny text with no warning treatment', () => {
    const fs = require('fs');
    const css = fs.readFileSync(
      require('path').join(__dirname, 'ListingShippingTerms.module.css'),
      'utf8'
    );
    expect(css).toMatch(/color: var\(--colorGrey500\)/);
    expect(css).not.toMatch(/colorFail|colorAttention|red|orange/i);
  });
});

describe('ListingPriceAndShippingTerms (mobile block)', () => {
  const price = new Money(4100, 'USD');
  const usShipping = {
    checkedAt: FRESH,
    duties: 'ddu',
    method: 'flat_rate',
    feeUsd: 34,
    feeApprox: true,
  };

  it('shows the price first, then the shipping line, then the estimate line', () => {
    const { container } = render(
      <ListingPriceAndShippingTerms
        price={price}
        publicData={{ priceInINR: 3600 }}
        loaded
        usShipping={usShipping}
        brand="House of Chikankari"
      />
    );
    const all = lines(container);
    expect(all).toHaveLength(3);
    expect(all[0]).toBe('$41');
    expect(all[1]).toMatch(/^House of Chikankari ships to the US for about \$34\./);
    expect(all[2]).toMatch(/^Estimated from the ₹3,600 India price/);
  });

  it('renders nothing while the author profile is loading', () => {
    const { container } = render(
      <ListingPriceAndShippingTerms price={price} publicData={{}} loaded={false} brand="Nicobar" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('is hidden from 1024px up, where OrderPanel shows the same lines', () => {
    const fs = require('fs');
    const css = fs.readFileSync(
      require('path').join(__dirname, 'ListingShippingTerms.module.css'),
      'utf8'
    );
    expect(css.match(/\.mobileBlock \{[\s\S]*?\n\}/)[0]).toMatch(
      /@media \(--viewportLarge\) \{\s*display: none;/
    );
  });
});
