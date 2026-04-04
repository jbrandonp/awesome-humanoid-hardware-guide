# Resilient Health System V3.0 - Agent Guidelines

## Workspace Overview
- **Monorepo structure**: Nx workspace with apps/ and libs/ directories using npm workspaces
- **Key apps**:
  - `apps/api` (NestJS + Fastify backend) - serves on port 3000 via docker-compose
  - `apps/desktop` (React + Tauri desktop client for Windows 7) - requires Rust toolchain
  - `apps/mobile` (React Native + Expo mobile client) - requires Expo/Android SDK/iOS setup
- **Key libs**:
  - `libs/models` (Shared Zod/TypeScript schemas) - accessed via @systeme-sante/models alias
  - `libs/cornerstone-integration` (Medical imaging using Cornerstone.js)
  - `libs/insurance-engine` (Billing/claims processing)

## Essential Commands (Non-obvious gotchas)
- **Start all services**: `npm run start:all` (starts API, backend, web client, Expo bundler)
  - NOTE: Does NOT start desktop Tauri app - that requires separate build step
- **Start individual services**:
  - API: `npm run start:api` (NestJS server)
  - Desktop: `npm run start:desktop` (Vite dev server for React/Tauri)
  - Mobile: `npm run start:mobile` (Expo bundler)
- **Infrastructure**:
  - Start DBs: `npm run docker:up` (PostgreSQL:5432, MongoDB:27017, MinIO:9000/9001, Redis:6379)
  - Stop DBs: `npm run docker:down`
  - Health checks: Docker compose includes healthchecks for PostgreSQL
- **Database**: `npm run db:push` (Runs `npx prisma generate && npx prisma db push` - MUST run generate first)
- **Desktop build** (Windows production):
  ```bash
  cd apps/desktop/src-tauri
  cargo build --release
  ```
  - NOTE: Must be run from src-tauri directory, not project root

## Development Workflow (Critical Nx conventions)
- **Always use Nx** for running tasks (don't bypass nx) - bypassing breaks task dependencies
- **Prefix Nx commands with npm** (not pnpm/yarn): `npm exec nx <command>` or use npm scripts
- **Test execution**: Use `npm exec nx test <project>` or `npm exec nx run-many --target=test --all`
  - IMPORTANT: Test target depends on build target (`^build`) - tests will fail if build is stale
- **Typechecking**: Use `npm exec nx typecheck <project>`
- **Linting**: Configured per-project via .eslintrc.js overrides - check individual project configs

## Important Conventions (Easy to miss)
- **Environment**: Designed for offline-first, low-resource environments (Windows 7, 4GB RAM)
- **Security**: Zero Trust, Zero Cloud Logs - all data stays on LAN (no external API calls in prod)
- **Database**: Dual-write to PostgreSQL (relational) and MongoDB (documents) via Prisma
  - Prisma schema in prisma/ directory generates @prisma/client
  - MongoDB connection string includes authSource=admin
- **File storage**: MinIO S3-compatible for medical images/documents (ports 9000 API, 9001 Console)
- **Real-time**: Socket.IO for live updates (configured in NestJS gateway), Yjs for CRDT conflict resolution
- **Medical imaging**: Cornerstone.js for DICOM viewing (libs/cornerstone-integration)
- **Offline sync**: LocalFirst principles with automatic conflict resolution via Yjs

## Testing Notes (Quirks & Requirements)
- **Test ordering**: Test target depends on build target (`^build`) in nx.json - run build first if tests fail
- **E2E tests**: Playwright configured for web (apps/api-e2e, apps/desktop-e2e) and mobile
  - Requires browsers installed: `npx playwright install`
- **Mobile testing**: Requires Expo/Android SDK/iOS setup and emulators/simulators
- **API testing**: Uses Supertest with Jest/Vitest (see apps/api/**/*.spec.[jt]s)
- **Test environment**: Jest config uses SWC transformer with legacy decorator metadata enabled
- **Snapshot tests**: Check for .snap files in test directories - update with `-u` flag

## Additional Important Details (Verify these work)
- **Package manager**: Uses npm workspaces (packages/*, apps/*, libs/ in package.json workspaces)
- **TypeScript configuration**: Uses project references with composite: true (see tsconfig.base.json)
- **Module paths**: Configured via tsconfig.base.json paths (@systeme-sante/* -> libs/*/src/index.ts)
- **Environment variables**: Docker compose sets up services - check docker-compose.yml for exact values
- **API service**: When started via docker-compose, runs on port 3000 (proxied by nginx on port 80)
- **Web client**: Served by API service in development (Vite proxy to NestJS)
- **Expo bundler**: Started with start:all command - watch for Metro bundler errors
- **Tauri desktop**: Requires Rust toolchain (cargo) and system dependencies for Windows build
- **Code generation**: Uses Nx generators (`npm exec nx g @nx/react:app my-app` etc.)
- **Prisma usage**:
  - Schema: prisma/schema.prisma
  - Client: @prisma/client (generated)
  - Migrations: Use `prisma migrate dev` for dev, `prisma migrate deploy` for prod
- **Linting**: Uses @typescript-eslint with project-specific overrides in .eslintrc.js
- **Formatting**: Uses Prettier (.prettierrc) - run via lint-staged or manually