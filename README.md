# Regression Report Viewer (Next.js)

## Setup

See [SETUP.md](SETUP.md) for full project setup and CI details.

## Quick Start

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verify

```bash
npm run lint
npm run test
npm run test:coverage
npm run build
```

## Project Structure

- Application code: `src/`
- Unit test setup: `vitest.config.ts`, `src/test/setup.ts`
- CI workflow: `.github/workflows/ci.yml`
