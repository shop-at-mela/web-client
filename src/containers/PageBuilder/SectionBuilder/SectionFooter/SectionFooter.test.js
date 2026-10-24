import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render } from '../../../../util/testHelpers';
import { createCurrentUser } from '../../../../util/testData';

import SectionFooter from './SectionFooter';

// The Console footer asset's link block, as fetched from the live asset (2026-10-24)
const blocks = [
  {
    blockType: 'footerBlock',
    blockId: 'general',
    text: {
      fieldType: 'markdown',
      content: '- [About us](/p/about)\n- [Search listings](/s)\n- [Post a new listing](/l/new)',
    },
  },
];

const currentUserOfType = userType =>
  createCurrentUser('user-1', {
    profile: { displayName: 'User', abbreviatedName: 'U', publicData: { userType } },
  });

const renderFooter = currentUser =>
  render(
    <SectionFooter sectionId="footer" sectionType="footer" numberOfColumns={2} blocks={blocks} />,
    { initialState: { user: { currentUser } } }
  );

describe('SectionFooter "Post a new listing" link', () => {
  it('shows the link to a signed-in provider (brand) account', () => {
    const { getByText } = renderFooter(currentUserOfType('provider'));
    expect(getByText('Post a new listing')).toBeInTheDocument();
    expect(getByText('About us')).toBeInTheDocument();
  });

  it('hides the link from a signed-in customer', () => {
    const { queryByText, getByText } = renderFooter(currentUserOfType('customer'));
    expect(queryByText('Post a new listing')).not.toBeInTheDocument();
    expect(getByText('About us')).toBeInTheDocument();
    expect(getByText('Search listings')).toBeInTheDocument();
  });

  it('hides the link from signed-out visitors', () => {
    const { queryByText, getByText } = renderFooter(null);
    expect(queryByText('Post a new listing')).not.toBeInTheDocument();
    expect(getByText('About us')).toBeInTheDocument();
  });
});
