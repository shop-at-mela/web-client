# BrandStorefront Debug Guide

## Quick Check: Is BrandStorefront rendering?

Add this temporary logging to ProfilePage.js (around line 372):

```javascript
const userTypeRoles = getCurrentUserTypeRoles(config, profileUser);

// Check if this is a brand provider profile
// Show BrandStorefront for all provider users to enable onboarding with placeholders
const isBrandProvider = userTypeRoles?.provider === true;

// DEBUG: Add this temporarily
console.log('🔍 ProfilePage Debug:', {
  displayName,
  userTypeRoles,
  isBrandProvider,
  hasPublicData: !!publicData,
  publicDataKeys: publicData ? Object.keys(publicData) : [],
});
```

## Expected Console Output

You should see something like:
```
🔍 ProfilePage Debug: {
  displayName: "Your Brand Name",
  userTypeRoles: { customer: true, provider: true },
  isBrandProvider: true,
  hasPublicData: true,
  publicDataKeys: ["certifications", "brandLogoUrl", ...]
}
```

## Common Issues

### Issue 1: isBrandProvider is false
**Symptom:** `isBrandProvider: false` in console logs
**Cause:** User doesn't have provider role
**Fix:** Check user type configuration in Sharetribe Console

### Issue 2: Component not rendering at all
**Symptom:** No console logs, blank page
**Cause:** JavaScript error preventing render
**Fix:** Check browser console for errors (F12)

### Issue 3: Old ProfilePage showing instead
**Symptom:** `isBrandProvider: false` even though user is provider
**Cause:** ProfilePage.js changes not compiled
**Fix:** Restart dev server

### Issue 4: BrandStorefront returns null
**Symptom:** `isBrandProvider: true` but nothing renders
**Cause:** Early return in BrandStorefront.js (line 122)
**Fix:** Add debug log before early return:

```javascript
// In BrandStorefront.js, line 121
console.log('🏪 BrandStorefront Props:', {
  hasUser: !!user,
  hasAttributes: !!user?.attributes,
  hasProfile: !!user?.attributes?.profile,
  displayName: user?.attributes?.profile?.displayName,
});

// Early return if user data is not available
if (!user || !user.attributes || !user.attributes.profile) {
  console.log('❌ BrandStorefront: Early return - missing user data');
  return null;
}
```

## Quick Fix: Force BrandStorefront

To test if BrandStorefront renders at all, temporarily change ProfilePage.js:

```javascript
// Around line 491, change:
{isBrandProvider ? (

// To:
{true ? (  // Force BrandStorefront
```

This will show BrandStorefront for ALL users (remove after testing).

## What Should You See?

When BrandStorefront is working:
1. **If you have brand data:** See enhanced header with logo, certifications, tabs
2. **If viewing own profile with missing data:** See placeholder prompts ("Add Your Brand Logo", etc.)
3. **If viewing someone else's incomplete profile:** See minimal UI (brand initial, generic empty states)

## File Locations

- ProfilePage: `/Users/parinjogani/Documents/Mela/web-client/src/containers/ProfilePage/ProfilePage.js`
- BrandStorefront: `/Users/parinjogani/Documents/Mela/web-client/src/containers/ProfilePage/BrandStorefront.js`
- Styles: `/Users/parinjogani/Documents/Mela/web-client/src/containers/ProfilePage/BrandStorefront.module.css`
