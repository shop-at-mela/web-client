import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// CustomExtendedDataSection pulls in SectionDetails, which imports Heading from the
// components barrel (circular-dep chain via sdkLoader in test env, see learnings.md).
// Stand in with a lightweight mock that surfaces exactly what CustomListingFields
// computed, so this test only exercises CustomListingFields' own filtering logic.
jest.mock('../../components/CustomExtendedDataSection/CustomExtendedDataSection.js', () => props => {
  const { propsForCustomFields, sectionDetailsProps } = props;
  return (
    <div>
      {propsForCustomFields.map(field => (
        <div key={field.key} data-testid="custom-field-text">
          {field.text}
        </div>
      ))}
      {sectionDetailsProps.fieldConfigs.map(config => (
        <div key={config.key} data-testid="detail-field-key">
          {config.key}
        </div>
      ))}
    </div>
  );
});

import CustomListingFields from './CustomListingFields';

describe('CustomListingFields', () => {
  const categoryConfiguration = { key: 'categoryLevel', categories: [] };
  const intl = { formatMessage: ({ id }) => id };

  const textFieldConfig = key => ({
    key,
    scope: 'public',
    schemaType: 'text',
    showConfig: {},
  });

  it('excludes SEO-only fields (searchKeywords, metaDescription) from the visible render', () => {
    const listingFieldConfigs = [
      textFieldConfig('searchKeywords'),
      textFieldConfig('metaDescription'),
      textFieldConfig('careInstructions'),
    ];
    const publicData = {
      searchKeywords: 'oat milk, saffron, clay mask',
      metaDescription: 'Brightening mask with oat milk and saffron.',
      careInstructions: 'Store in a cool, dry place.',
    };

    render(
      <CustomListingFields
        publicData={publicData}
        metadata={{}}
        listingFieldConfigs={listingFieldConfigs}
        categoryConfiguration={categoryConfiguration}
        intl={intl}
      />
    );

    expect(screen.queryByText(publicData.searchKeywords)).not.toBeInTheDocument();
    expect(screen.queryByText(publicData.metaDescription)).not.toBeInTheDocument();
    expect(screen.getByText(publicData.careInstructions)).toBeInTheDocument();
  });

  it('still excludes SEO-only fields even when showConfig.displayOnListingPage is true', () => {
    const listingFieldConfigs = [
      { ...textFieldConfig('searchKeywords'), showConfig: { displayOnListingPage: true } },
    ];
    const publicData = { searchKeywords: 'oat milk, saffron, clay mask' };

    render(
      <CustomListingFields
        publicData={publicData}
        metadata={{}}
        listingFieldConfigs={listingFieldConfigs}
        categoryConfiguration={categoryConfiguration}
        intl={intl}
      />
    );

    expect(screen.queryByText(publicData.searchKeywords)).not.toBeInTheDocument();
  });

  it('still hides a normal field when showConfig.displayOnListingPage is false', () => {
    const listingFieldConfigs = [
      { ...textFieldConfig('careInstructions'), showConfig: { displayOnListingPage: false } },
    ];
    const publicData = { careInstructions: 'Store in a cool, dry place.' };

    render(
      <CustomListingFields
        publicData={publicData}
        metadata={{}}
        listingFieldConfigs={listingFieldConfigs}
        categoryConfiguration={categoryConfiguration}
        intl={intl}
      />
    );

    expect(screen.queryByText(publicData.careInstructions)).not.toBeInTheDocument();
  });
});
