import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { ConfigurationProvider } from '../../../../context/configurationContext';
import { RouteConfigurationProvider } from '../../../../context/routeConfigurationContext';

jest.mock('../../../../routing/routeConfiguration', () => []);

jest.mock('../../../../config/configBrands', () => ({
  getAllBrandIds: jest.fn(),
  getBrandSlugById: jest.fn(),
}));

jest.mock('../../../../util/homepageSdk', () => ({
  users: { show: jest.fn() },
}));

jest.mock('../../../../util/analytics/homepageEditorial', () => ({
  pushCraftTileClick: jest.fn(),
}));

import CraftStories from './CraftStories';
import { getAllBrandIds, getBrandSlugById } from '../../../../config/configBrands';
import sdk from '../../../../util/homepageSdk';
import { pushCraftTileClick } from '../../../../util/analytics/homepageEditorial';

const mockMessages = {
  'CraftStories.title': 'The Crafts Behind the Brands',
  'CraftStories.subtitle': 'Techniques with centuries of practice, still made by hand',
  'CraftStories.rotationNote': 'Three of nineteen crafts, rotating daily',
};

const mockRoutes = [{ path: '/brands/:brandSlug', name: 'BrandPage' }];

const TestWrapper = ({ children }) => (
  <MemoryRouter>
    <IntlProvider locale="en" messages={mockMessages}>
      <ConfigurationProvider value={{}}>
        <RouteConfigurationProvider value={mockRoutes}>{children}</RouteConfigurationProvider>
      </ConfigurationProvider>
    </IntlProvider>
  </MemoryRouter>
);

const brand = (id, { brandCraft, brandHeroImages, displayName } = {}) => ({
  id: { uuid: id },
  type: 'user',
  attributes: {
    profile: {
      displayName: displayName || id,
      publicData: { brandCraft, brandHeroImages },
    },
  },
});

describe('CraftStories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getBrandSlugById.mockImplementation(id => `${id}-slug`);
  });

  it('renders nothing when no brand is eligible', async () => {
    getAllBrandIds.mockReturnValue(['b1', 'b2']);
    sdk.users.show.mockResolvedValue({ data: { data: brand('b1', {}) } });

    const { container } = render(
      <TestWrapper>
        <CraftStories />
      </TestWrapper>
    );

    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it('shows only brands with both brandCraft and a hero image', async () => {
    getAllBrandIds.mockReturnValue(['eligible', 'no-craft', 'no-image']);
    sdk.users.show.mockImplementation(({ id }) => {
      const map = {
        eligible: brand('eligible', {
          brandCraft: 'juttis stitched by hand in Mumbai',
          brandHeroImages: ['https://example.com/hero.jpg'],
          displayName: 'Fizzy Goblet',
        }),
        'no-craft': brand('no-craft', { brandHeroImages: ['https://example.com/hero2.jpg'] }),
        'no-image': brand('no-image', { brandCraft: 'some craft' }),
      };
      return Promise.resolve({ data: { data: map[id] } });
    });

    render(
      <TestWrapper>
        <CraftStories />
      </TestWrapper>
    );

    await waitFor(() => expect(screen.getByText('Fizzy Goblet')).toBeInTheDocument());
    expect(screen.getByText('juttis stitched by hand in Mumbai')).toBeInTheDocument();
    expect(screen.queryAllByRole('link')).toHaveLength(1);
  });

  it('shows at most 3 tiles even when more brands are eligible', async () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    getAllBrandIds.mockReturnValue(ids);
    sdk.users.show.mockImplementation(({ id }) =>
      Promise.resolve({
        data: {
          data: brand(id, {
            brandCraft: `craft-${id}`,
            brandHeroImages: [`https://example.com/${id}.jpg`],
          }),
        },
      })
    );

    render(
      <TestWrapper>
        <CraftStories />
      </TestWrapper>
    );

    await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(3));
  });

  it('fires craft_tile_click with the brand id on tile click', async () => {
    getAllBrandIds.mockReturnValue(['eligible']);
    sdk.users.show.mockResolvedValue({
      data: {
        data: brand('eligible', {
          brandCraft: 'ceramics painted by hand in Delhi',
          brandHeroImages: ['https://example.com/hero.jpg'],
          displayName: 'Kaunteya',
        }),
      },
    });

    render(
      <TestWrapper>
        <CraftStories />
      </TestWrapper>
    );

    await waitFor(() => expect(screen.getByText('Kaunteya')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('link'));
    expect(pushCraftTileClick).toHaveBeenCalledWith('eligible');
  });

  it('renders nothing when brand fetches fail', async () => {
    getAllBrandIds.mockReturnValue(['b1']);
    sdk.users.show.mockRejectedValue(new Error('not found'));

    const { container } = render(
      <TestWrapper>
        <CraftStories />
      </TestWrapper>
    );

    await waitFor(() => expect(container.firstChild).toBeNull());
  });
});
