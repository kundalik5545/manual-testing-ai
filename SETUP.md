# Application Setup

## Prerequisites

- Node.js 22 LTS (recommended)
- npm 10+
- Git

## Install

```bash
npm ci
```

## Run Locally

```bash
npm run dev
```

Open http://localhost:3000

## Quality Checks

```bash
npm run lint
npm run test
npm run test:coverage
npm run build
```

## What Was Configured

- **Unit test framework**: Vitest + Testing Library + jsdom
- **Test setup file**: `src/test/setup.ts`
- **Example test**: `src/lib/utils.test.ts`
- **CI pipeline**: `.github/workflows/ci.yml`

## CI Behavior

On push to `main`/`master` and on pull requests, CI runs:

1. Install dependencies (`npm ci`)
2. Lint (`npm run lint`)
3. Test (`npm run test`)
4. Build (`npm run build`)
