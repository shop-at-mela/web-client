import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

// NamedLink pulls in routes.js -> sdkLoader; stub it to a plain anchor that exposes the
// route name and hash it was given.
jest.mock('../../../../components/NamedLink/NamedLink', () => ({ name, to, className, children }) => (
  <a data-testid={`link-${name}`} href={`/${name}${(to && to.hash) || ''}`} className={className}>
    {children}
  </a>
));

import HowWeVet from './HowWeVet';
import enMessages from '../../../../translations/en.json';

const renderBand = props =>
  render(
    <IntlProvider locale="en" messages={enMessages}>
      <HowWeVet {...props} />
    </IntlProvider>
  );

describe('HowWeVet', () => {
  it('keeps the how-we-vet id that VettingStrip scrolls to', () => {
    const { container } = renderBand();
    expect(container.querySelector('section#how-we-vet')).toBeInTheDocument();
  });

  it('renders the heading and three numbered points in order', () => {
    renderBand();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('How we vet every brand');
    const region = screen.getByRole('region', { name: 'How we vet every brand' });
    const points = region.querySelectorAll('ol > li');
    expect(Array.from(points).map(p => p.textContent)).toEqual([
      'Independent Indian brands with a proven track record',
      'Each one has real experience shipping outside India',
      "You check out on the brand's own store",
    ]);
  });

  it('links "More on how we vet" to the About page\'s What we check section', () => {
    renderBand();
    const link = screen.getByTestId('link-AboutPage');
    expect(link).toHaveTextContent('More on how we vet');
    expect(link).toHaveAttribute('href', '/AboutPage#about-check');
  });

  it('makes no card acceptance claim (card acceptance is not checked per brand)', () => {
    const { container } = renderBand();
    expect(container.textContent).not.toMatch(/card/i);
  });

  it('does not render the removed certification cards or Need help block', () => {
    const { container } = renderBand();
    expect(container.textContent).not.toMatch(/certif|need help/i);
  });
});
