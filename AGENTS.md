## Commands

- `npm ci` - install dependencies
- `npm run dev` - start the development server
- `npm test` - run the whole test suite without watch mode
- `npm test -- src/app/App.test.tsx` - run one test file
- `npm run typecheck` - check TypeScript
- `npm run build` - check TypeScript and build for production

## Rules

- Dependencies are added in `package.json`, with `package-lock.json` updated
  alongside it. Do not add one without asking the user.
