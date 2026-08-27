const ensureOpenGraphLocale = locale => {
  switch (locale) {
    case 'en':
      return 'en_US';
    default:
      return locale;
  }
};

/**
 * These will be used with Helmet <meta {...openGraphMetaProps} />
 */
export const openGraphMetaProps = data => {
  const {
    openGraphType,
    socialSharingTitle,
    socialSharingDescription,
    published,
    updated,
    url,
    locale,
    facebookImages,
    facebookAppId,
    marketplaceName,
    productPriceAmount,
    productPriceCurrency,
    productAvailability,
  } = data;

  if (!(socialSharingTitle && socialSharingDescription && openGraphType && url && facebookImages)) {
    if (console && console.warn) {
      console.warn(
        `Can't create Open Graph meta tags:
        socialSharingTitle, socialSharingDescription, openGraphType, url, and facebookImages are needed.`
      );
    }
    return [];
  }

  const openGraphMeta = [
    { property: 'og:description', content: socialSharingDescription },
    { property: 'og:title', content: socialSharingTitle },
    { property: 'og:type', content: openGraphType },
    { property: 'og:url', content: url },
    { property: 'og:locale', content: ensureOpenGraphLocale(locale) },
  ];

  if (facebookImages && facebookImages.length > 0) {
    facebookImages.forEach(i => {
      openGraphMeta.push({
        property: 'og:image',
        content: i.url,
      });

      if (i.width && i.height) {
        openGraphMeta.push({ property: 'og:image:width', content: i.width });
        openGraphMeta.push({ property: 'og:image:height', content: i.height });
      }
    });
  }

  if (marketplaceName) {
    openGraphMeta.push({ property: 'og:site_name', content: marketplaceName });
  }

  if (facebookAppId) {
    openGraphMeta.push({ property: 'fb:app_id', content: facebookAppId });
  }

  if (published) {
    openGraphMeta.push({ property: 'article:published_time', content: published });
  }

  if (updated) {
    openGraphMeta.push({ property: 'article:modified_time', content: updated });
  }

  // Pinterest Product Rich Pins read these OG tags (not JSON-LD) to show a
  // price/stock badge on pins. See developers.pinterest.com/docs/web-features/product-rich-pins/
  if (openGraphType === 'product' && productPriceAmount && productPriceCurrency) {
    openGraphMeta.push({ property: 'product:price:amount', content: productPriceAmount });
    openGraphMeta.push({ property: 'product:price:currency', content: productPriceCurrency });

    if (productAvailability) {
      openGraphMeta.push({ property: 'og:availability', content: productAvailability });
    }
  }

  return openGraphMeta;
};

/**
 * These will be used with Helmet <meta {...twitterMetaProps} />
 */
export const twitterMetaProps = data => {
  const {
    socialSharingTitle,
    socialSharingDescription,
    twitterHandle,
    twitterImages,
    url,
    marketplaceRootURL,
    siteTwitterHandle,
  } = data;

  if (!(socialSharingTitle && socialSharingDescription && url)) {
    if (console && console.warn) {
      console.warn(
        `Can't create twitter card meta tags:
        socialSharingTitle, socialSharingDescription, and url are needed.`
      );
    }
    return [];
  }

  const twitterMeta = [
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: socialSharingTitle },
    { name: 'twitter:description', content: socialSharingDescription },
    { name: 'twitter:url', content: url },
  ];

  if (siteTwitterHandle) {
    twitterMeta.push({ name: 'twitter:site', content: siteTwitterHandle });
  }

  if (twitterImages && twitterImages.length > 0) {
    twitterImages.forEach(i => {
      twitterMeta.push({
        name: 'twitter:image',
        content: i.url,
      });
    });
  }

  if (twitterHandle) {
    // TODO: If we want to connect providers twitter account on ListingPage
    // we needs to get this info among listing data (API support needed)
    twitterMeta.push({ name: 'twitter:creator', content: twitterHandle });
  }

  if (marketplaceRootURL) {
    twitterMeta.push({ name: 'twitter:domain', content: marketplaceRootURL });
  }

  return twitterMeta;
};

/**
 * These will be used with Helmet <meta {...metaTagProps} />
 * Creates data for Open Graph and Twitter meta tags.
 */
export const metaTagProps = (tagData, config) => {
  const {
    marketplaceRootURL,
    facebookAppId,
    marketplaceName,
    siteTwitterHandle,
    googleSearchConsole,
  } = config;

  const author = tagData.author || marketplaceName;
  const googleSiteVerification = googleSearchConsole?.googleSiteVerification;
  const googleSiteVerificationMaybe = googleSiteVerification
    ? [{ name: 'google-site-verification', content: googleSiteVerification }]
    : [];
  const keywordsMaybe = tagData.keywords
    ? [{ name: 'keywords', content: tagData.keywords }]
    : [];
  // A single robots tag: noIndex takes priority over an explicit tagData.robots
  // value, which takes priority over the default. Previously noIndex was
  // appended as a second <meta name="robots"> tag alongside the default
  // 'index, follow' one; that only rendered correctly by relying on
  // react-helmet-async's last-tag-wins de-dupe for same-name meta tags.
  const robotsMaybe = tagData.noIndex
    ? [{ name: 'robots', content: 'noindex' }]
    : tagData.robots
    ? [{ name: 'robots', content: tagData.robots }]
    : [{ name: 'robots', content: 'index, follow' }];

  const defaultMeta = [
    { name: 'description', content: tagData.description },
    { name: 'author', content: author },
    ...keywordsMaybe,
    ...robotsMaybe,
    ...googleSiteVerificationMaybe,
  ];

  const openGraphMeta = openGraphMetaProps({
    ...tagData,
    facebookAppId,
    marketplaceName,
  });

  const twitterMeta = twitterMetaProps({
    ...tagData,
    marketplaceRootURL,
    siteTwitterHandle,
  });

  return [...defaultMeta, ...openGraphMeta, ...twitterMeta];
};
