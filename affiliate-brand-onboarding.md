# Affiliate Brand Onboarding Guide

## Overview

This guide outlines the complete process for onboarding a new brand to the Laem affiliate marketplace. This process is for brands whose products will be scraped and listed as affiliate links, not for brands creating their own seller accounts.

---

## Phase 1: Brand Research & Analysis

### 1.1 Brand Evaluation
- [ ] **Market Research**: Verify brand fits Indian baby/children product focus
- [ ] **Target Audience**: Confirm brand appeals to US Indian diaspora
- [ ] **Product Range**: Assess product categories and variety
- [ ] **Quality Assessment**: Review brand reputation and product quality
- [ ] **Affiliate Potential**: Evaluate conversion and commission opportunities

### 1.2 Technical Feasibility
- [ ] **Website Analysis**: Check if brand website is scrapable
- [ ] **Anti-Bot Measures**: Identify any scraping restrictions
- [ ] **Data Structure**: Analyze product page structure and data availability
- [ ] **Image Quality**: Verify product images are suitable for marketplace
- [ ] **Affiliate Program**: Confirm brand has affiliate/partner program

---

## Phase 2: Scraper Development

### 2.1 Scraper Creation
- [ ] **New Scraper Script**: Create `[brandname]_scraper.py` in `/scrapper and classifiers/product scrappers/`
- [ ] **Data Extraction**: Configure scraper to extract:
  - Product Name
  - SKU/Product ID
  - Price (current and original if applicable)
  - Product Image URLs
  - Product URLs
  - Category
  - Description
  - Brand Name
  - Stock Status

### 2.2 Scraper Testing
- [ ] **Test Run**: Execute scraper on sample pages
- [ ] **Data Validation**: Verify all required fields are captured
- [ ] **Error Handling**: Test edge cases and error scenarios
- [ ] **Rate Limiting**: Ensure respectful scraping practices
- [ ] **Output Verification**: Confirm CSV format matches integration requirements

### 2.3 CSV Generation
- [ ] **Run Full Scrape**: Generate complete product CSV
- [ ] **Data Quality Check**: Review output for missing or malformed data
- [ ] **Save Raw Data**: Store as `[brandname]_products.csv` in `/scrapper_csvs/`

---

## Phase 3: Category Classification

### 3.1 LLM Classification
- [ ] **Run Classifier**: Execute classification on raw product CSV
  ```bash
  cd "scrapper and classifiers/category mapping"
  python run_classifier.py [brandname]_products.csv
  ```
- [ ] **Review Classifications**: Manually verify category mappings
- [ ] **Adjust Categories**: Update any misclassified products
- [ ] **Generate Classified CSV**: Save as `[brandname]_products_classified.csv`

### 3.2 Category Mapping Verification
- [ ] **Map to Existing Categories**: Ensure classifications align with site categories:
  - Baby Clothing
  - Baby Care & Wellness
  - Feeding & Nursing
  - Toys & Books
  - Traditional Indian Products
- [ ] **Update Category Hierarchy**: Add new sub-categories if needed

---

## Phase 4: Brand Configuration Updates

### 4.1 Frontend Configuration
- [ ] **Brand Slug Generation**: Determine URL-safe brand slug
- [ ] **Popular Brand Assessment**: Evaluate if brand should be in "top 5" for any category
- [ ] **Update Brand Lists**: Add to popular brands if applicable in `configListing.js`

### 4.2 Route Configuration
- [ ] **Brand Page URL**: Ensure `/brands/[brand-slug]` route works
- [ ] **SEO Optimization**: Plan brand page content and meta data
- [ ] **Brand Page Content**: Prepare brand story, heritage, and product highlights

---

## Phase 5: Data Integration

### 5.1 Listing Creation
- [ ] **Environment Setup**: Verify Sharetribe integration credentials
- [ ] **Test Integration**: Run create-listings script in test mode
  ```bash
  cd integration
  node scripts/create-listings.js --test-csv [brandname]_products_classified.csv
  ```
- [ ] **Review Test Results**: Verify listings are created correctly
- [ ] **Full Integration**: Import all brand products
  ```bash
  node scripts/create-listings.js "" ../scrapper_csvs/[brandname]_products_classified.csv
  ```

### 5.2 Data Verification
- [ ] **Listing Review**: Check random listings in Sharetribe Console
- [ ] **Brand Field**: Verify brand field is populated correctly
- [ ] **Category Assignment**: Confirm proper category mappings
- [ ] **Affiliate Links**: Test product URLs link to brand website
- [ ] **Image Display**: Verify product images load correctly

---

## Phase 6: Quality Assurance

### 6.1 Frontend Testing
- [ ] **Brand Page Access**: Test `/brands/[brand-slug]` displays products
- [ ] **Search Filtering**: Verify brand filter works in search results
- [ ] **Category Filtering**: Test products appear in correct categories
- [ ] **Product Display**: Check listing cards show correct information
- [ ] **Affiliate Links**: Confirm "Shop at [Brand]" buttons work

### 6.2 SEO Optimization
- [ ] **Brand Page SEO**: Optimize brand page titles and descriptions
- [ ] **Product SEO**: Review individual product page optimization
- [ ] **Internal Linking**: Add brand links to relevant content
- [ ] **Sitemap Update**: Ensure brand page is included in sitemap

---

## Phase 7: Content & Marketing Preparation

### 7.1 Brand Content Creation
- [ ] **Brand Story**: Write compelling brand heritage content
- [ ] **Product Highlights**: Identify hero products for brand page
- [ ] **Cultural Relevance**: Emphasize connection to Indian heritage
- [ ] **USP Documentation**: Highlight unique selling propositions

### 7.2 Marketing Assets
- [ ] **Brand Images**: Collect brand logos and marketing imagery
- [ ] **Social Media Content**: Prepare brand spotlight posts
- [ ] **Blog Content**: Plan brand feature articles
- [ ] **Email Campaigns**: Add brand to newsletter content calendar

---

## Phase 8: Launch & Monitoring

### 8.1 Soft Launch
- [ ] **Internal Review**: Team review of brand integration
- [ ] **Stakeholder Approval**: Get approval from brand (if applicable)
- [ ] **Soft Launch**: Release to limited audience for testing
- [ ] **Feedback Collection**: Gather initial user feedback

### 8.2 Full Launch
- [ ] **Public Announcement**: Announce new brand addition
- [ ] **Social Media Promotion**: Promote across social channels
- [ ] **Email Announcement**: Include in newsletter
- [ ] **SEO Monitoring**: Track brand page performance

### 8.3 Post-Launch Monitoring
- [ ] **Analytics Setup**: Monitor brand page traffic and engagement
- [ ] **Affiliate Tracking**: Track click-through rates to brand website
- [ ] **Conversion Monitoring**: Measure affiliate conversion performance
- [ ] **User Feedback**: Monitor customer reviews and feedback

---

## Phase 9: Maintenance & Updates

### 9.1 Regular Updates
- [ ] **Scheduled Scraping**: Set up automated product updates
- [ ] **Inventory Sync**: Monitor product availability changes
- [ ] **Price Updates**: Keep pricing information current
- [ ] **New Product Integration**: Add new products as they launch

### 9.2 Performance Optimization
- [ ] **Conversion Analysis**: Identify best-performing products
- [ ] **SEO Refinement**: Continuously improve search rankings
- [ ] **Content Updates**: Refresh brand content periodically
- [ ] **User Experience**: Optimize based on user behavior data

---

## Success Metrics

### Key Performance Indicators
- **Brand Page Traffic**: Monthly visitors to `/brands/[brand-slug]`
- **Affiliate Click-Through Rate**: Percentage of visitors who click to brand site
- **Product Discovery**: How often brand products appear in search results
- **Category Performance**: Brand's share within relevant categories
- **User Engagement**: Time spent on brand pages and product listings

### Monthly Review Checklist
- [ ] Review brand performance analytics
- [ ] Check affiliate link functionality
- [ ] Monitor product inventory accuracy
- [ ] Assess brand page SEO performance
- [ ] Evaluate user feedback and reviews

---

## Tools & Resources

### Required Tools
- **Scraper Scripts**: Python scrapers in `/scrapper and classifiers/product scrappers/`
- **Classification System**: LLM classifier in `/category mapping/`
- **Integration Scripts**: Sharetribe integration in `/integration/scripts/`
- **Analytics**: Google Analytics and Search Console
- **Sharetribe Console**: For listing and brand management

### Documentation References
- [Customer Acquisition PRD](./Customer-Acquisition-PRD.md)
- Sharetribe Integration API Documentation
- Brand scraper development guidelines
- SEO optimization best practices

---

## Notes

- **Timeline**: Complete onboarding typically takes 2-3 weeks
- **Dependencies**: Requires brand cooperation for affiliate program setup
- **Scalability**: Process designed to handle multiple brands simultaneously
- **Quality Control**: Each step includes verification to ensure data quality
- **SEO Focus**: Every phase considers search engine optimization impact