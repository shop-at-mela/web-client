/////////////////////////////////////////////////////////
// Configurations related to user.                     //
/////////////////////////////////////////////////////////

// Note: The userFields come from userFields asset nowadays by default.
//       To use this built-in configuration, you need to change the overwrite from configHelper.js
//       (E.g. use mergeDefaultTypesAndFieldsForDebugging func)

/**
 * Configuration options for user fields (custom extended data fields):
 * - key:                           Unique key for the extended data field.
 * - scope (optional):              Scope of the extended data can be either 'public', 'protected', or 'private'.
 *                                  Default value: 'public'.
 * - schemaType (optional):         Schema for this extended data field.
 *                                  This is relevant when rendering components.
 *                                  Possible values: 'enum', 'multi-enum', 'text', 'long', 'boolean'.
 * - enumOptions (optional):        Options shown for 'enum' and 'multi-enum' extended data.
 *                                  These are used to render options for inputs on
 *                                  ProfileSettingsPage and AuthenticationPage.
 * - showConfig:                    Configuration for rendering user information. (How the field should be shown.)
 *   - label:                         Label for the saved data.
 *   - displayInProfile (optional):   Can be used to hide field content from profile page.
 *                                    Default value: true.
 * - saveConfig:                    Configuration for adding and modifying extended data fields.
 *   - label:                         Label for the input field.
 *   - placeholderMessage (optional): Default message for user input.
 *   - isRequired (optional):         Is the field required for users to fill
 *   - requiredMessage (optional):    Message for mandatory fields.
 *   - displayInSignUp (optional):    Can be used to show field input on sign up page.
 *                                    Default value: true.
 * - userTypeConfig:                Configuration for limiting user field to specific user types.
 *   - limitToUserTypeIds:            Can be used to determine whether to limit the field to certain user types. The
 *                                    Console based asset configurations do not yet support user types, so in hosted configurations
 *                                    the default value for this is 'false'.
 *   - userTypeIds:                   An array of user types for which the extended
 *   (optional)                       data is relevant and should be added.
 */
export const userFields = [
  // Featured Brand Flag - Set by admin for premium brand placement
  {
    key: 'isFeaturedBrand',
    scope: 'public',
    schemaType: 'boolean',
    showConfig: {
      label: 'Featured Brand',
      displayInProfile: false,
    },
    saveConfig: {
      label: 'Apply for Featured Brand status',
      displayInSignUp: false,
      isRequired: false,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['provider'],
    },
  },

  // Brand Certifications - GOTS, BIS, Organic, etc.
  {
    key: 'certifications',
    scope: 'public',
    schemaType: 'multi-enum',
    enumOptions: [
      { option: 'gots_certified', label: 'GOTS Certified' },
      { option: 'organic_cotton', label: '100% Organic Cotton' },
      { option: 'bis_approved', label: 'BIS Approved' },
      { option: 'non_toxic_dyes', label: 'Non-toxic Dyes' },
      { option: 'handcrafted', label: 'Handcrafted' },
      { option: 'fair_trade', label: 'Fair Trade' },
      { option: 'women_owned', label: 'Women-Owned Business' },
    ],
    showConfig: {
      label: 'Certifications',
      displayInProfile: true,
    },
    saveConfig: {
      label: 'Brand Certifications',
      placeholderMessage: 'Select all that apply',
      displayInSignUp: false,
      isRequired: false,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['provider'],
    },
  },

  // Brand Logo URL - Temporary field until file upload is implemented
  {
    key: 'brandLogoUrl',
    scope: 'public',
    schemaType: 'text',
    showConfig: {
      label: 'Brand Logo URL',
      displayInProfile: false,
    },
    saveConfig: {
      label: 'Brand Logo URL',
      placeholderMessage: 'https://example.com/logo.png',
      displayInSignUp: false,
      isRequired: false,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['provider'],
    },
  },

  // Founded Year
  {
    key: 'foundedYear',
    scope: 'public',
    schemaType: 'long',
    showConfig: {
      label: 'Founded Year',
      displayInProfile: true,
    },
    saveConfig: {
      label: 'Year Founded',
      placeholderMessage: '2015',
      displayInSignUp: false,
      isRequired: false,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['provider'],
    },
  },

  // Origin - City/State where brand is based
  {
    key: 'origin',
    scope: 'public',
    schemaType: 'text',
    showConfig: {
      label: 'Origin',
      displayInProfile: true,
    },
    saveConfig: {
      label: 'Brand Origin (City, State)',
      placeholderMessage: 'Mumbai, India',
      displayInSignUp: false,
      isRequired: false,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['provider'],
    },
  },

  // Specialty - What the brand specializes in
  {
    key: 'specialty',
    scope: 'public',
    schemaType: 'text',
    showConfig: {
      label: 'Specialty',
      displayInProfile: true,
    },
    saveConfig: {
      label: 'Brand Specialty',
      placeholderMessage: 'Organic baby clothing',
      displayInSignUp: false,
      isRequired: false,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['provider'],
    },
  },

  // Website URL
  {
    key: 'websiteUrl',
    scope: 'public',
    schemaType: 'text',
    showConfig: {
      label: 'Website',
      displayInProfile: true,
    },
    saveConfig: {
      label: 'Brand Website',
      placeholderMessage: 'https://example.com',
      displayInSignUp: false,
      isRequired: false,
    },
    userTypeConfig: {
      limitToUserTypeIds: true,
      userTypeIds: ['provider'],
    },
  },
];

/////////////////////////////////////
// User Type Configuration          //
/////////////////////////////////////
/**
 * Mela uses Sharetribe's built-in Customer and Provider user types.
 * All Providers are brands/sellers on the Mela marketplace.
 *
 * User types are configured in Sharetribe Console:
 * - Provider: Brand/Seller accounts
 * - Customer: Buyer accounts
 */
