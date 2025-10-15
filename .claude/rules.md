# Development Rules

## Core Rules
1. **Always write unit tests after code changes** - Use Jest + React Testing Library
2. **Follow existing component patterns** - Look at similar components for imports, PropTypes, CSS structure
3. **Use category resolution helpers** - Use `findCategoryById` and `resolveCategoryNames` like CategoryBreadcrumb for consistent category display
4. **Verify variable names** - Check actual variable names (e.g., `currentListing` not `listing`) before referencing
5. **Update learnings.md after each session** - Document patterns, issues, and solutions discovered
   - Keep learnings.md focused on reusable patterns and solutions rather than feature-specific documentation
   - Use context.md for project workflows and conventions

## Testing
- Run tests: `yarn test`
- Write tests for new components and modified behavior
- Mock NamedLink and use MemoryRouter for routing components

## Category Implementation
- Use `config.categoryConfiguration?.categories` for category data
- Follow CategoryBreadcrumb pattern for ID-to-name resolution
- Never hardcode category transformations