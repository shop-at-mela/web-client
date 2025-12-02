import React from 'react';

/**
 * SVG Icon Components for Certifications
 * Reusable across all pages (BrandCard, ProfilePage, ListingPage, etc.)
 */

export const GOTSIcon = ({ className = '', size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2L3 7V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2Z"
      fill="#4CAF50"
    />
    <path
      d="M12 8C10.34 8 9 9.34 9 11C9 12.66 10.34 14 12 14C13.66 14 15 12.66 15 11C15 9.34 13.66 8 12 8Z"
      fill="white"
    />
    <path
      d="M12 15C10.67 15 8 15.67 8 17V18H16V17C16 15.67 13.33 15 12 15Z"
      fill="white"
    />
  </svg>
);

export const OekoTexIcon = ({ className = '', size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" fill="#00A0DC" />
    <path
      d="M9 12L11 14L15 10"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const FairTradeIcon = ({ className = '', size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" fill="#000000" />
    <path
      d="M8 13C8 13 9 14 12 14C15 14 16 13 16 13"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="9" cy="9.5" r="1" fill="white" />
    <circle cx="15" cy="9.5" r="1" fill="white" />
    <path
      d="M12 7V5M12 5L10 6.5M12 5L14 6.5"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const NonToxicIcon = ({ className = '', size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" fill="#8BC34A" />
    <path
      d="M12 8V12M12 16H12.01"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 12C19 8.13 15.87 5 12 5C8.13 5 5 8.13 5 12"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray="2 2"
    />
  </svg>
);

export const OrganicIcon = ({ className = '', size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" fill="#66BB6A" />
    <path
      d="M12 6V12M12 12L9 9M12 12L15 9"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 15C8 15 9 17 12 17C15 17 16 15 16 15"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const HandmadeIcon = ({ className = '', size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" fill="#FF9800" />
    <path
      d="M8 13L10 15L16 9"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const EcoFriendlyIcon = ({ className = '', size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" fill="#43A047" />
    <path
      d="M12 6C12 6 15 8 15 12C15 14 13.5 15 12 15C10.5 15 9 14 9 12C9 8 12 6 12 6Z"
      fill="white"
    />
  </svg>
);

/**
 * Certification metadata configuration
 * Maps certification types to their display properties
 */
export const CERTIFICATION_CONFIG = {
  gots_certified: {
    icon: GOTSIcon,
    label: 'GOTS Certified',
    description: 'Global Organic Textile Standard',
    color: '#4CAF50',
  },
  oeko_tex: {
    icon: OekoTexIcon,
    label: 'OEKO-TEX',
    description: 'Tested for harmful substances',
    color: '#00A0DC',
  },
  oeko_tex_100: {
    icon: OekoTexIcon,
    label: 'OEKO-TEX 100',
    description: 'Standard 100 certification',
    color: '#00A0DC',
  },
  fair_trade: {
    icon: FairTradeIcon,
    label: 'Fair Trade',
    description: 'Fair Trade Certified',
    color: '#000000',
  },
  non_toxic_dyes: {
    icon: NonToxicIcon,
    label: 'Non-Toxic Dyes',
    description: 'Safe, chemical-free dyes',
    color: '#8BC34A',
  },
  organic: {
    icon: OrganicIcon,
    label: 'Organic',
    description: '100% organic materials',
    color: '#66BB6A',
  },
  organic_cotton: {
    icon: OrganicIcon,
    label: 'Organic Cotton',
    description: 'Certified organic cotton',
    color: '#66BB6A',
  },
  handmade: {
    icon: HandmadeIcon,
    label: 'Handmade',
    description: 'Handcrafted with care',
    color: '#FF9800',
  },
  eco_friendly: {
    icon: EcoFriendlyIcon,
    label: 'Eco-Friendly',
    description: 'Environmentally conscious',
    color: '#43A047',
  },
};

/**
 * Get certification info by type
 * @param {string} certificationType - Certification type key
 * @returns {object} Certification configuration
 */
export const getCertificationInfo = certificationType => {
  return CERTIFICATION_CONFIG[certificationType] || {
    icon: OrganicIcon, // Default fallback icon
    label: certificationType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    description: 'Certified product',
    color: '#757575',
  };
};
