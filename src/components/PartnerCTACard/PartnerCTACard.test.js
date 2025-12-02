import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import PartnerCTACard from './PartnerCTACard';

const mockMessages = {
  'PartnerCTACard.title': 'Become a Partner',
  'PartnerCTACard.description': 'Join our network of trusted brands and reach thousands of parents.',
  'PartnerCTACard.cta': 'Apply Now',
};

const TestWrapper = ({ children }) => (
  <IntlProvider locale="en" messages={mockMessages}>
    {children}
  </IntlProvider>
);

describe('PartnerCTACard', () => {
  it('renders the handshake icon', () => {
    const { container } = render(
      <TestWrapper>
        <PartnerCTACard />
      </TestWrapper>
    );

    const icon = container.querySelector('.icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveTextContent('🤝');
  });

  it('renders the title', () => {
    render(
      <TestWrapper>
        <PartnerCTACard />
      </TestWrapper>
    );

    expect(screen.getByText('Become a Partner')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(
      <TestWrapper>
        <PartnerCTACard />
      </TestWrapper>
    );

    expect(
      screen.getByText('Join our network of trusted brands and reach thousands of parents.')
    ).toBeInTheDocument();
  });

  it('renders CTA button with arrow', () => {
    render(
      <TestWrapper>
        <PartnerCTACard />
      </TestWrapper>
    );

    expect(screen.getByText('Apply Now')).toBeInTheDocument();
    const arrow = screen.getByText('→');
    expect(arrow).toBeInTheDocument();
  });

  it('uses default partner URL when not provided', () => {
    render(
      <TestWrapper>
        <PartnerCTACard />
      </TestWrapper>
    );

    const link = screen.getByText('Apply Now').closest('a');
    expect(link).toHaveAttribute('href', '/partner');
  });

  it('uses custom partner URL when provided', () => {
    render(
      <TestWrapper>
        <PartnerCTACard partnerUrl="https://mela.com/become-partner" />
      </TestWrapper>
    );

    const link = screen.getByText('Apply Now').closest('a');
    expect(link).toHaveAttribute('href', 'https://mela.com/become-partner');
  });

  it('applies custom className', () => {
    const { container } = render(
      <TestWrapper>
        <PartnerCTACard className="customClass" />
      </TestWrapper>
    );

    const root = container.querySelector('.root');
    expect(root).toHaveClass('customClass');
  });

  it('applies custom rootClassName', () => {
    const { container } = render(
      <TestWrapper>
        <PartnerCTACard rootClassName="customRootClass" />
      </TestWrapper>
    );

    const root = container.querySelector('.customRootClass');
    expect(root).toBeInTheDocument();
    expect(root).not.toHaveClass('root');
  });

  it('renders ExternalLink component for CTA', () => {
    render(
      <TestWrapper>
        <PartnerCTACard partnerUrl="https://external.com/partner" />
      </TestWrapper>
    );

    const link = screen.getByText('Apply Now').closest('a');
    expect(link).toHaveAttribute('href', 'https://external.com/partner');
    // ExternalLink should open in new tab
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('has proper structure with content wrapper', () => {
    const { container } = render(
      <TestWrapper>
        <PartnerCTACard />
      </TestWrapper>
    );

    const content = container.querySelector('.content');
    expect(content).toBeInTheDocument();
    expect(content.parentElement).toHaveClass('root');
  });
});
