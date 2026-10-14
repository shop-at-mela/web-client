/**
 * Single source of truth for the brand-partnership FAQ (/l/new).
 *
 * Rendered as visible copy by <FAQ> AND used by BrandPartnershipPage to build the
 * FAQPage JSON-LD, so the structured data can never describe questions the page
 * doesn't show. Previously the JSON-LD carried its own hardcoded list of three
 * questions that appeared nowhere in the visible HTML.
 *
 * Kept in its own module (not inside FAQ.js) so BrandPartnershipPage can import the
 * data statically while FAQ.js itself stays lazy-loaded.
 *
 * `featured` items get the "ADDRESSING CONCERNS" badge in the visible section.
 */
export const BRAND_PARTNERSHIP_FAQ_ITEMS = [
  {
    question: 'What about US tariffs on Indian products? Should we wait?',
    answer:
      "Tariffs and trade policies are temporary—brand presence is permanent. This uncertainty creates a first-mover advantage for bold brands. Our performance-based model means zero upfront risk, and we're building a global platform beyond just the US market.",
    featured: true,
  },
  {
    question: 'How does Mela help navigate regulatory uncertainty?',
    answer:
      "We stay ahead of policy changes and adapt quickly. Our performance-based model protects partners from fixed costs during uncertain times. Plus, we're expanding globally—reducing dependency on any single market's policies.",
    featured: true,
  },
  {
    question: 'What if trade policies change after we partner?',
    answer:
      'Our flexible partnership model adapts with market conditions. No long-term contracts or fixed fees. If one market faces challenges, we help you pivot to our expanding global network including Europe, Middle East, and Australia.',
    featured: true,
  },
  {
    question: 'What commission rates will you charge?',
    answer:
      "Commission rates are performance-based and will be determined during our beta phase based on product categories and sales volume. We're committed to ensuring profitable partnerships for our brands.",
  },
  {
    question: 'How do you ensure brand quality standards?',
    answer:
      'We have a thorough vetting process including product review, brand story evaluation, and customer feedback analysis. Only brands meeting our premium quality standards are accepted.',
  },
  {
    question: 'Can we control pricing on your platform?',
    answer:
      'Absolutely. You maintain full control over pricing. We drive traffic to your existing website where you manage all pricing, promotions, and sales decisions.',
  },
  {
    question: 'Why should we start now instead of waiting for better times?',
    answer:
      'While competitors hesitate due to uncertainty, this creates a unique window for forward-thinking brands. You can establish market presence, build customer relationships, and capture first-mover advantages with minimal competition. Early market entry often yields the highest returns.',
  },
];
