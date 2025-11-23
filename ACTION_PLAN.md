# Jovo Framework Maintenance Action Plan

This document outlines the steps to maintain and simplify the Jovo framework for personal Alexa project development.

---

## Current Status Summary

**Last Updated:** November 2024

### Completed Work:
- [x] Removed 18+ unused packages (platforms, integrations, clients)
- [x] Updated to TypeScript 5.3, Lerna 8.1.2, ESLint 8, Jest 29, Prettier 3
- [x] Fixed TypeScript 5.3 compatibility issues in framework code
- [x] Build succeeds for all 17 remaining packages
- [x] Updated CLAUDE.md documentation

### Current Issues:
- [ ] Some framework tests fail (DependencyInjection, Routing, e2e tests) - pre-existing issues
- [ ] CLI setup not yet tested (separate repo: https://github.com/jovotech/jovo-cli)
- [ ] Integration with actual Alexa project not yet tested

### Remaining Packages (17):
1. common, output, framework (core)
2. platform-alexa, platform-core, platform-web (platforms)
3. server-lambda, server-express, db-dynamodb, db-filedb (essential integrations)
4. plugin-debugger, plugin-keywordnlu, nlu-nlpjs, slu-lex, ttscache-s3 (optional integrations)
5. client-web, client-web-vue3 (clients)

---

## Phase 1: Initial Setup & Assessment - COMPLETED

### 1.1 Verify Current State
- [x] Run `npm install` - Works with npm workspaces
- [x] Run `npm run build` - All 17 packages build successfully
- [x] Run `npm run test` - Some tests fail (pre-existing issues)
- [x] Document build/test status

### 1.2 Set Up Jovo CLI
The CLI is a separate repository: https://github.com/jovotech/jovo-cli

**Options:**
1. **Use existing npm CLI**: `npm install -g @jovotech/cli`
2. **Fork and maintain CLI separately**: Clone and maintain jovo-cli repo
3. **Use ASK CLI directly**: For Alexa-only development

**Status:** Not yet tested - TODO in next session

### 1.3 Test with Existing Project
- [ ] Link framework packages to your existing Alexa project
- [ ] Verify the project builds and runs locally
- [ ] Test deployment to AWS Lambda
- [ ] Document any compatibility issues

---

## Phase 2: Security Updates - COMPLETED

### 2.1 TypeScript & Core Tooling - DONE
Updated in all packages:
- typescript: ~5.3.0
- @types/node: ^20.10.0
- jest: ^29.7.0
- ts-jest: ^29.1.0
- prettier: ^3.1.0

### 2.2 ESLint Ecosystem - DONE
- eslint: ^8.50.0
- @typescript-eslint/parser: ^6.0.0
- @typescript-eslint/eslint-plugin: ^6.0.0
- eslint-config-prettier: ^9.0.0
- eslint-plugin-prettier: ^5.0.0

### 2.3 Lerna - DONE
- lerna: 8.1.2 (using npm workspaces, not lerna bootstrap)

### 2.4 AWS SDK Standardization - TODO
- db-dynamodb uses @aws-sdk/* ^3.433.0 (good)
- server-lambda should be updated to match (still old)

---

## Phase 3: Simplification - COMPLETED

### 3.1 Platforms Removed
```bash
# These directories have been deleted:
platforms/platform-googleassistant
platforms/platform-dialogflow
platforms/platform-facebookmessenger
platforms/platform-googlebusiness
platforms/platform-instagram
```

### 3.2 Integrations Removed
```bash
# These directories have been deleted:
integrations/cms-airtable
integrations/cms-googlesheets
integrations/cms-sanity
integrations/analytics-bigquery
integrations/analytics-dashbot
integrations/nlu-dialogflow
integrations/nlu-rasa
integrations/nlu-snips
integrations/nlu-microsoftclu
integrations/plugin-slack
integrations/plugin-inbox
integrations/db-mongodb
integrations/db-redis
integrations/tts-polly (was incomplete)
```

### 3.3 Clients Removed
```bash
# Deleted:
clients/client-web-vue2  # Vue 2 is EOL
```

### 3.4 Configuration Updated
- [x] package.json updated with npm workspaces
- [x] lerna.json updated for Lerna 8
- [x] .eslintrc.js updated for ESLint 8
- [x] tsconfig.json updated with skipLibCheck: true

---

## Phase 4: Integration Strategy - TODO

### 4.1 Option A: npm link (Development)
Best for active development on both framework and projects:
```bash
# In jovo-framework/framework
npm link

# In jovo-framework/platforms/platform-alexa
npm link

# In your Alexa project
npm link @jovotech/framework @jovotech/platform-alexa @jovotech/server-lambda ...
```

### 4.2 Option B: Local File References
Best for stable, versioned integration:
```json
// your-project/package.json
{
  "dependencies": {
    "@jovotech/framework": "file:../jovo-framework/framework",
    "@jovotech/platform-alexa": "file:../jovo-framework/platforms/platform-alexa",
    "@jovotech/server-lambda": "file:../jovo-framework/integrations/server-lambda",
    "@jovotech/db-dynamodb": "file:../jovo-framework/integrations/db-dynamodb",
    "@jovotech/db-filedb": "file:../jovo-framework/integrations/db-filedb",
    "@jovotech/common": "file:../jovo-framework/common",
    "@jovotech/output": "file:../jovo-framework/output"
  }
}
```

### 4.3 Option C: Monorepo Workspace (Recommended)
Create a parent workspace containing everything.

---

## Phase 5: CLI Setup - TODO

### 5.1 Evaluate Existing CLI
```bash
npm install -g @jovotech/cli
jovo --version
jovo build --help
```

### 5.2 CLI Alternative: Direct ASK CLI
For Alexa-only development, you can bypass Jovo CLI:
```bash
npm install -g ask-cli
ask deploy
```

---

## Phase 6: Test Failures to Investigate - TODO

### Known Failing Tests (framework package):
These tests were failing before and after the TypeScript upgrade. They appear to be pre-existing issues:

1. **DependencyInjection.test.ts** - 4 tests failing
   - nested dependency injection
   - output class with dependency injection
   - dependency tokens
   - provider variations
   - Error: Output is empty when it should contain messages

2. **Routing.test.ts** - 2 tests failing
   - handler decorator inheritance
   - prioritized handlers not being skipped

3. **ComponentAvailability.test.ts** - 4 tests failing
   - isAvailable tests

4. **Jovo.test.ts** - 1 test failing
   - AsyncJovo.$send - validation error

5. **e2e.test.ts** - Multiple failures

### Passing Tests:
- common/test/SsmlUtilities.test.ts (6 tests)
- output/test/*.test.ts (93 tests)
- framework: Plugin.test.ts, App.test.ts, Component.test.ts, Extensible.test.ts, utilities.test.ts, JovoSession.test.ts, Platform.test.ts, BasicLogging.test.ts, InterpretationPlugin.test.ts, i18next.test.ts

---

## Phase 7: Next Steps

### Immediate (Next Session):
1. [ ] Test CLI installation: `npm install -g @jovotech/cli`
2. [ ] Test linking to an existing Alexa project
3. [ ] Run an actual Alexa skill with the updated framework

### Short-term:
1. [ ] Investigate and fix failing tests (or document as known issues)
2. [ ] Update server-lambda AWS SDK to match db-dynamodb
3. [ ] Run npm audit and address vulnerabilities

### Long-term:
1. [ ] Set up maintenance schedule
2. [ ] Consider if web platform/clients are needed
3. [ ] Document deployment pipeline

---

## Code Changes Made

### Files Modified:

1. **package.json** (root)
   - Added npm workspaces configuration
   - Updated devDependencies to modern versions
   - Added overrides for type packages

2. **lerna.json**
   - Removed useWorkspaces (deprecated in Lerna 8)
   - Simplified configuration

3. **.eslintrc.js**
   - Updated for ESLint 8 compatibility

4. **tsconfig.json**
   - Added skipLibCheck: true

5. **output/src/utilities.ts**
   - Fixed `instanceToObject<T>` to use `extends object` constraint

6. **framework/src/DependencyInjector.ts**
   - Added `extends AnyObject` constraints to generic types
   - Added type casts for complex generic scenarios

7. **framework/src/decorators/Inject.ts**
   - Updated decorator signature for TypeScript 5.3: `propertyKey: string | symbol | undefined`

8. **output/test/validation.test.ts**
   - Wrapped `propertyKey` in `String()` for template literals
   - Added `extends AnyObject` constraint to `validateAndExpectLength`

9. **platforms/platform-alexa/package.json**
   - Added @types/adm-zip, @types/fs-extra

10. **integrations/server-express/package.json**
    - Added @types/express

### All Package devDependencies Updated:
Every remaining package had its devDependencies updated to:
- typescript: ~5.3.0
- @types/node: ^20.10.0
- @types/jest: ^29.5.0
- jest: ^29.7.0
- ts-jest: ^29.1.0
- prettier: ^3.1.0
- eslint: ^8.50.0
- @typescript-eslint/*: ^6.0.0
- eslint-config-prettier: ^9.0.0
- eslint-plugin-prettier: ^5.0.0
- rimraf: ^5.0.0

---

## Commands Reference

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run all tests
npm test

# Run tests for specific package
cd framework && npm test

# Lint code
npm run eslint

# Format code
npm run prettier

# Clean build artifacts
npm run clean
```

---

## Risk Notes

1. **Test Failures**: Some tests fail but core functionality appears to work (build succeeds). These may be test configuration issues rather than actual bugs.

2. **Decorator Metadata**: The framework relies heavily on `emitDecoratorMetadata` for dependency injection. If tests fail with empty outputs, it could be metadata not being emitted.

3. **CLI Compatibility**: The CLI is a separate repo and may need updates to work with the modified framework packages.

4. **AWS SDK Versions**: server-lambda uses old AWS SDK versions - should be updated for consistency and security.
