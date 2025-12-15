/**
 * Central certification definitions
 *
 * This config ensures all brands display consistent, accurate certification
 * information. Brands only provide their certificate URLs and dates.
 *
 * Benefits:
 * - Consistent messaging across all brands
 * - Easy to update if certification standards change
 * - No duplicate content creation by brands
 * - Accurate, verified explanations
 */

export const CERTIFICATION_DEFINITIONS = {
  gots_certified: {
    id: 'gots_certified',
    name: 'GOTS Certified',
    shortName: 'GOTS',
    icon: '🏆',
    category: 'organic',

    // Quick trust signal for product cards/headers
    tagline: '100% organic cotton, non-toxic dyes',

    // Detailed explanation for About tab
    consumerBenefit: 'What this means for your baby',
    description: [
      '100% certified organic fibers from non-GMO seeds',
      'No toxic dyes, formaldehyde, or heavy metals',
      'Strict limits on chemical residues',
      'Safe working conditions and fair wages verified',
    ],

    // Educational context
    issuedBy: 'Global Organic Textile Standard',
    verifiedBy: 'Independent third-party auditors',
    learnMoreUrl: 'https://global-standard.org/the-standard/gots-key-features',

    // SEO/Schema.org
    schemaType: 'Certification',
  },

  non_toxic_dyes: {
    id: 'non_toxic_dyes',
    name: 'Non-Toxic Dyes',
    shortName: 'Non-Toxic',
    icon: '🌿',
    category: 'safety',

    tagline: 'Plant-based, azo-free dyes safe for sensitive skin',

    consumerBenefit: 'Gentle on baby\'s skin',
    description: [
      'Azo-free dyes (no carcinogenic compounds)',
      'Plant-based or low-impact synthetic dyes',
      'Free from heavy metals (lead, chromium)',
      'Tested for skin sensitivity',
    ],

    issuedBy: 'Oeko-Tex Standard 100',
    verifiedBy: 'Independent testing labs',
    learnMoreUrl: 'https://www.oeko-tex.com/en/our-standards/standard-100-by-oeko-tex',

    schemaType: 'Certification',
  },

  handmade: {
    id: 'handmade',
    name: 'Handmade',
    shortName: 'Handmade',
    icon: '✋',
    category: 'craftsmanship',

    tagline: 'Crafted by artisans, not machines',

    consumerBenefit: 'Supporting artisan communities',
    description: [
      'Hand-woven or hand-stitched by skilled artisans',
      'Traditional techniques preserved',
      'Fair wages for artisan families',
      'Each piece is unique',
    ],

    issuedBy: 'Self-certified by brand',
    verifiedBy: 'Mela verification process',
    learnMoreUrl: null, // No external standard body

    schemaType: 'ProductFeature',
  },

  bis_certified: {
    id: 'bis_certified',
    name: 'BIS Certified',
    shortName: 'BIS',
    icon: '✓',
    category: 'safety',

    tagline: 'Meets Indian safety standards',

    consumerBenefit: 'Tested for safety',
    description: [
      'Meets Bureau of Indian Standards requirements',
      'Tested for physical and chemical safety',
      'Compliance with IS 11871 (baby product safety)',
      'Regular quality audits',
    ],

    issuedBy: 'Bureau of Indian Standards',
    verifiedBy: 'BIS-approved testing laboratories',
    learnMoreUrl: 'https://www.bis.gov.in/',

    schemaType: 'Certification',
  },

  fair_trade: {
    id: 'fair_trade',
    name: 'Fair Trade Certified',
    shortName: 'Fair Trade',
    icon: '🤝',
    category: 'ethical',

    tagline: 'Fair wages, safe conditions, sustainable practices',

    consumerBenefit: 'Ethical production',
    description: [
      'Fair prices paid to producers and workers',
      'Safe and healthy working conditions',
      'No child or forced labor',
      'Environmental sustainability practices',
    ],

    issuedBy: 'Fair Trade International',
    verifiedBy: 'Independent auditors (FLOCERT)',
    learnMoreUrl: 'https://www.fairtrade.net/standard',

    schemaType: 'Certification',
  },

  carbon_neutral: {
    id: 'carbon_neutral',
    name: 'Carbon Neutral',
    shortName: 'Carbon Neutral',
    icon: '🌍',
    category: 'environmental',

    tagline: 'Zero net carbon emissions',

    consumerBenefit: 'Protecting the planet for your child',
    description: [
      'Carbon emissions measured and offset',
      'Renewable energy used in production',
      'Sustainable transportation methods',
      'Annual carbon audits',
    ],

    issuedBy: 'Climate Neutral Certified',
    verifiedBy: 'Third-party carbon accounting firms',
    learnMoreUrl: 'https://www.climateneutral.org/',

    schemaType: 'Certification',
  },

  plastic_free: {
    id: 'plastic_free',
    name: 'Plastic-Free Packaging',
    shortName: 'Plastic-Free',
    icon: '♻️',
    category: 'environmental',

    tagline: 'Zero single-use plastic',

    consumerBenefit: 'Less waste, healthier planet',
    description: [
      'No plastic in packaging materials',
      'Recyclable or compostable materials only',
      'Natural fibers (cotton, jute) for bags',
      'Biodegradable protective materials',
    ],

    issuedBy: 'Self-certified by brand',
    verifiedBy: 'Mela verification process',
    learnMoreUrl: null,

    schemaType: 'ProductFeature',
  },
};

/**
 * Get certification definition by ID
 */
export const getCertification = certId => {
  return CERTIFICATION_DEFINITIONS[certId] || null;
};

/**
 * Get all certifications in a category
 */
export const getCertificationsByCategory = category => {
  return Object.values(CERTIFICATION_DEFINITIONS).filter(cert => cert.category === category);
};

/**
 * Categories for filtering/grouping
 */
export const CERTIFICATION_CATEGORIES = {
  organic: { label: 'Organic & Natural', icon: '🌿' },
  safety: { label: 'Safety Tested', icon: '✓' },
  ethical: { label: 'Ethical Production', icon: '🤝' },
  environmental: { label: 'Environmental', icon: '🌍' },
  craftsmanship: { label: 'Craftsmanship', icon: '✋' },
};
