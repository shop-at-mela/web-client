# Mela Web Client - Context

## Tech Stack
- React 18 + Redux + React Router
- Sharetribe marketplace framework
- CSS Modules + classNames
- Jest + React Testing Library
- Loadable Components (code splitting)
- FormattedMessage (i18n)

## Commands
- `yarn dev` - Start development server
- `yarn test` - Run tests
- `yarn build` - Production build
- `yarn lint` - ESLint check

## Project Structure
- `/src/components/` - Reusable UI components
- `/src/containers/` - Page-level components
- `/src/ducks/` - Redux actions/reducers
- `/src/util/` - Utility functions
- `/src/translations/` - i18n files

## Critical Files
- `src/components/index.js` - Component exports
- `src/util/data.js` - Data transformation utilities
- `src/containers/PageBuilder/` - CMS page building system
- `src/containers/ListingPage/` - Product page variants

## Current Conventions
- CSS Modules with kebab-case filenames
- Redux duck pattern for state management
- FormattedMessage for all user-facing text
- PropTypes for type checking
- Loadable components for code splitting
- Helper functions for category resolution (findCategoryById, resolveCategoryNames)

## Development Workflows

### Adding New Redux Features
1. Create duck file: `src/ducks/[feature].duck.js` (actions → reducer → thunk)
2. Register in `src/ducks/index.js` (import and export)
3. Connect component with Redux using `connect(mapStateToProps, mapDispatchToProps)`
4. Write comprehensive test suites (duck + component)
5. Test with `npm test -- path/to/test.js`

### Error Resolution Priorities
1. **SDK errors**: Check import path (use `../util/sdkLoader` not `sharetribe-sdk`)
2. **Redux errors**: Verify Provider wrapping in tests
3. **State errors**: Ensure test state matches component expectations
4. **Component errors**: Check variable names in actual component code