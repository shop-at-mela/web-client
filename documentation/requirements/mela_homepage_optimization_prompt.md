# Mela Homepage Optimization Prompt

## Task Overview

Optimize the Mela homepage to focus primarily on western buyers/customers while integrating brand partnership opportunities in the header and footer sections. Create a product-focused, sustainability-driven experience that showcases the breadth of categories, brands, and key attributes through visual product discovery.

## Requirements & Constraints

### Target Audience
- **Primary**: Western families seeking sustainable, authentic baby clothing and accessories
- **Geographic Scope**: Location-agnostic for global western market
- **Values**: Sustainability, design diversity, quality, cultural authenticity

### Brand Partnership Integration
- **Header**: Add "Partner with Mela" as **secondary link** in TopbarDesktop CustomLinksMenu (not primary/highlighted)
- **Footer**: Create dedicated brand partnership section using SectionBuilder
- **Messaging**: Focus on sustainability and design innovation for brand partners

### Positioning Strategy
- **India Focus**: Emphasize **sustainability** and **diversity of ideas/designs** rather than cultural heritage
- **Product Emphasis**: **Baby clothes and accessories** prominently featured throughout
- **Homepage Strategy**: Product-focused rather than educational content heavy - showcase breadth through visual sections

## Technical Architecture

### Current System
- **Homepage**: LandingPage.js uses PageBuilder with loadable components
- **Sections**: SectionBuilder supports hero, features, columns, carousel, article, footer
- **Header**: TopbarDesktop with CustomLinksMenu for responsive navigation
- **Footer**: FooterContainer using SectionBuilder with configurable sections

### Implementation Points
1. **CustomLinksMenu**: Add brand partnership link as secondary navigation
2. **SectionHero**: Product showcase with sustainability messaging
3. **SectionCarousel**: Brand spotlights and featured products
4. **SectionColumns**: Category grids and product displays
5. **SectionFeatures**: Key attributes and benefits
6. **SectionFooter**: Brand partnership call-to-action section

## Product-Focused Homepage Strategy

### Hero Section - Product Showcase
- **Primary Message**: "Sustainable Baby Fashion with Global Design Diversity"
- **Visual Focus**: Hero product carousel showcasing baby clothes and accessories
- **Key Elements**:
  - Prominent product images with sustainability badges
  - Design diversity through varied product styles
  - Baby clothing emphasis (0-5 years focus)
  - Quick access to main categories

### Section 1: Category Showcase (SectionColumns)
**"Shop by Category"**
- **Baby Clothing**: Rompers, bodysuits, ethnic wear, sleepwear
- **Toddler Fashion**: Everyday wear, festive outfits, traditional attire
- **Accessories**: Bibs, caps, mittens, booties, swaddles, blankets
- **Organic Essentials**: GOTS certified products, organic cotton items
- **Seasonal Collections**: Current season highlights

### Section 2: Featured Brands Carousel (SectionCarousel)
**"Discover Our Partner Brands"**
- Rotating showcase of partner brands with their signature products
- Brand logos and featured product images
- Sustainability credentials for each brand
- "Shop Brand" call-to-action buttons
- Visual storytelling through product photography

### Section 3: Product Attributes Grid (SectionFeatures)
**"Why Choose Mela"**
- **Sustainability**: GOTS certified, organic cotton, eco-friendly materials
- **Design Diversity**: Unique patterns, traditional techniques, modern interpretations
- **Quality Assurance**: Baby-safe dyes, premium materials, comfort focus
- **Global Sourcing**: Artisan craftsmanship, ethical production
- **Trust & Safety**: Certifications, return policies, quality guarantees

### Section 4: New Arrivals (SectionColumns)
**"Latest Additions"**
- Grid display of newest products across categories
- Mix of different brands and product types
- Quick view and shop functionality
- "See All New Arrivals" link

### Section 5: Seasonal Highlights (SectionCarousel)
**"Current Season Favorites"**
- Seasonal product collections
- Festival and occasion-specific clothing
- Weather-appropriate selections
- Limited-time offers and collections

### Section 6: Customer Favorites (SectionColumns)
**"Bestsellers & Customer Picks"**
- Top-rated products across categories
- Customer review highlights
- Social proof and testimonials
- Best-selling items from different brands

## Brand Partnership Integration

### Header Integration
- **Location**: CustomLinksMenu secondary position
- **Text**: "Partner with Mela"
- **Positioning**: Not highlighted, maintains customer-first experience

### Footer Integration
- **Section Title**: "Join Our Brand Network"
- **Messaging**: "Bring your sustainable baby fashion to global families"
- **Visual Elements**: Partner brand logos, success stories
- **CTA**: "Become a Partner" linking to /partners/brands/
- **Benefits Highlight**: Global reach, sustainability focus, design innovation platform

## User Experience Goals

### Product Discovery Journey
1. **Visual Discovery**: Product-first homepage with clear category navigation
2. **Brand Exploration**: Easy access to different partner brands and their stories
3. **Attribute-Based Shopping**: Sustainability, design style, product type filters
4. **Trust Building**: Certifications, testimonials, clear policies integrated with products
5. **Conversion**: Streamlined path from product discovery to purchase

### Performance Metrics
- **Primary**: Product page views, category engagement, conversion rates
- **Secondary**: Brand partnership inquiries, time spent on product sections
- **Discovery**: Category click-through rates, brand carousel engagement

## Implementation Approach

### Phase 1: Product Infrastructure
- Set up product showcase sections using SectionCarousel and SectionColumns
- Create category navigation and brand spotlight components
- Implement product image optimization and loading

### Phase 2: Homepage Sections
- Update SectionHero with product carousel and sustainability messaging
- Build category showcase grid with visual product representations
- Create brand carousel highlighting partner brands and their products
- Implement product attributes section showcasing key benefits

### Phase 3: Brand Partnership Integration
- Add "Partner with Mela" to TopbarDesktop CustomLinksMenu as secondary link
- Create footer brand partnership section with visual partner showcases
- Develop brand partnership messaging focused on sustainability and innovation

### Phase 4: Product Discovery Optimization
- Implement new arrivals and seasonal highlights sections
- Create customer favorites and bestsellers showcases
- Add quick view and shop functionality across product sections
- Optimize for product discovery and category navigation

## Section Layout Structure

```
Homepage Layout:
├── Hero Section (Product Showcase + Sustainability Messaging)
├── Category Showcase (SectionColumns - Baby Clothes, Accessories, etc.)
├── Featured Brands Carousel (SectionCarousel - Partner Brand Spotlights)
├── Product Attributes (SectionFeatures - Sustainability, Quality, Design)
├── New Arrivals Grid (SectionColumns - Latest Products)
├── Seasonal Highlights (SectionCarousel - Current Season Collections)
├── Customer Favorites (SectionColumns - Bestsellers & Reviews)
└── Footer with Brand Partnership Section
```

## Success Criteria

**Short-term (1-3 months):**
- Product-focused homepage launched with multiple showcase sections
- Category engagement metrics showing improved product discovery
- Brand partnership integration in header/footer completed
- Increased time spent on product sections

**Long-term (6-12 months):**
- Higher conversion rates from product showcase sections
- Strong brand partnership pipeline from footer integration
- Established product discovery patterns showing category breadth
- Market position as premier visual destination for sustainable baby fashion

## Technical Notes

- Leverage SectionCarousel for dynamic brand and product showcases
- Use SectionColumns for category grids and product displays
- Implement SectionFeatures for highlighting key product attributes
- Maintain performance optimization with lazy loading for product images
- Follow existing CSS module patterns for consistent product styling
- Ensure mobile responsiveness for all product showcase sections

This prompt transforms the homepage into a product discovery platform that showcases the breadth of categories, brands, and important attributes while maintaining sustainability positioning and brand partnership opportunities through visual, engaging sections rather than content-heavy approaches.