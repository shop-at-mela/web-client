import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import enMessages from '../../../../translations/en.json';

jest.mock('../../../../components', () => ({
  NamedLink: ({ children, className }) => <a className={className}>{children}</a>,
  CertificationBadge: () => <span />,
}));

import TrustAssurance from './TrustAssurance';

// Card acceptance has never been checked per brand, and brands (not Mela) ship, so the homepage
// trust copy may not claim either for every brand.
const BANNED = /verified|cards accepted|accepts all major|visa|mastercard|ships? directly to|indian/i;

const renderSection = () =>
  render(
    <IntlProvider locale="en" messages={enMessages}>
      <TrustAssurance />
    </IntlProvider>
  );

describe('TrustAssurance', () => {
  it('renders the approved card and shipping copy', () => {
    const { getByText } = renderSection();
    expect(getByText("Pay on the Brand's Own Store")).toBeInTheDocument();
    expect(
      getByText("Each brand's checkout shows the cards and payment methods it takes.")
    ).toBeInTheDocument();
    expect(getByText('US Shipping Set by Each Brand')).toBeInTheDocument();
    expect(
      getByText("Each brand page shows that brand's US shipping cost and duty terms.")
    ).toBeInTheDocument();
    expect(getByText('Hand Vetted Brands')).toBeInTheDocument();
  });

  it('makes no blanket card, shipping or verification claim', () => {
    const { container } = renderSection();
    expect(container.textContent).not.toMatch(BANNED);
  });

  it('keeps every card string free of claims and dash characters', () => {
    const cardKeys = [
      'VettingStrip.cards',
      'TrustAssurance.cardsTitle',
      'TrustAssurance.cardsDescription',
      'MelaHomePage.faqCardsAnswer',
    ];
    cardKeys.forEach(key => {
      expect(enMessages[key]).toBeTruthy();
      expect(enMessages[key]).not.toMatch(BANNED);
      expect(enMessages[key]).not.toMatch(/[-–—]/);
    });
  });
});
