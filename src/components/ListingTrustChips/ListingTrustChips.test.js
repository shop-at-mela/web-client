import React from 'react';
import { render, screen } from '@testing-library/react';
import ListingTrustChips from './ListingTrustChips';

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
});
