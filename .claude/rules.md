# Development Rules

## Core Rules
1. **Always write unit tests after code changes** - Use Jest + React Testing Library
2. **Follow existing component patterns** - Look at similar components for imports, PropTypes, CSS structure
3. **Use category resolution helpers** - Use `findCategoryById` and `resolveCategoryNames` like CategoryBreadcrumb for consistent category display
4. **Verify variable names** - Check actual variable names (e.g., `currentListing` not `listing`) before referencing
5. **Update learnings.md after each session** - Document patterns, issues, and solutions discovered
   - Keep learnings.md focused on reusable patterns and solutions rather than feature-specific documentation
   - Use context.md for project workflows and conventions
6. **Create reusable components first** - When building new UI elements that will be used in multiple places (e.g., ProductTile, CategoryCard), create them as standalone reusable components before integrating into specific pages

## Testing
- Run tests: `yarn test`
- Write tests for new components and modified behavior
- Mock NamedLink and use MemoryRouter for routing components

## Category Implementation
- Use `config.categoryConfiguration?.categories` for category data
- Follow CategoryBreadcrumb pattern for ID-to-name resolution
- Never hardcode category transformations

## Component Development
- Build reusable components in `/src/components/` for UI elements used across multiple pages
- Page-specific components go in `/src/containers/[PageName]/`
- Follow existing component structure: Component.js, Component.module.css, Component.test.js
- **Extend existing components** instead of duplicating (e.g., extend ListingCard rather than create ProductTile)
- **Name components by outcome** not implementation (e.g., TrustBadges/ConversionBadges vs CertificationBadges)
- **Use flexible props** for context-aware rendering (e.g., showAuthorInfo, showTrustBadges)