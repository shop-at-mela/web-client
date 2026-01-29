#!/bin/bash

# Script to apply search schemas to Sharetribe marketplace
# Usage: ./apply-search-schemas.sh
#
# IMPORTANT: This script only sets up the search schema structure (key, type, scope).
# Enum values are defined separately in web-client/src/config/configListing.js
# and do NOT need to be passed to the CLI.

echo "🔍 Applying search schemas to Sharetribe marketplace..."
echo ""

# Age Group (enum)
echo "Setting age_group schema..."
flex-cli search set --key age_group --type enum --scope public

# Material (multi-enum)
echo "Setting material schema..."
flex-cli search set --key material --type multi-enum --scope public

# Certification (multi-enum)
echo "Setting certification schema..."
flex-cli search set --key certification --type multi-enum --scope public

# Color (multi-enum)
echo "Setting color schema..."
flex-cli search set --key color --type multi-enum --scope public

# Key Features (multi-enum)
echo "Setting key_features schema..."
flex-cli search set --key key_features --type multi-enum --scope public

echo ""
echo "✅ All search schemas have been applied!"
echo ""
echo "To verify, run: flex-cli search show"
echo ""
echo "Note: Enum values are managed in web-client/src/config/configListing.js"
