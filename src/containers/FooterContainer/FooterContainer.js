import React from 'react';
import { useConfiguration } from '../../context/configurationContext';
import loadable from '@loadable/component';
import SentimentSheet from '../../components/SentimentSheet/SentimentSheet';

// Mela: code-owned copyright line, replacing the Console template's "© 2024 Your marketplace".
// Wording from mela-docs footer-legalese-prd.md.
export const FOOTER_COPYRIGHT = {
  fieldType: 'text',
  content:
    "© 2026 Mela. A curated directory of Indian brands. Mela is not a retailer — clicking through takes you to each brand's own store.",
};

const SectionBuilder = loadable(
  () => import(/* webpackChunkName: "SectionBuilder" */ '../PageBuilder/PageBuilder'),
  {
    resolveComponent: components => components.SectionBuilder,
  }
);

const FooterComponent = () => {
  const { footer = {}, topbar } = useConfiguration();

  // If footer asset is not set, let's not render Footer at all.
  if (Object.keys(footer).length === 0) {
    return null;
  }

  // The footer asset does not specify sectionId or sectionType. However, the SectionBuilder
  // expects sectionId and sectionType in order to identify the section. We add those
  // attributes here before passing the asset to SectionBuilder.
  const footerSection = {
    ...footer,
    sectionId: 'footer',
    sectionType: 'footer',
    linkLogoToExternalSite: topbar?.logoLink,
    copyright: FOOTER_COPYRIGHT,
  };

  return (
    <>
      <SectionBuilder sections={[footerSection]} />
      <SentimentSheet />
    </>
  );
};

export default FooterComponent;
