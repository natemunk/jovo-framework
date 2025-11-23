# CLAUDE.md - Jovo Framework Maintenance Guide

## Project Status

This is a **privately maintained fork** of the Jovo Framework v4, originally an open-source project that was discontinued after 8 years of development. All original packages remain available on npm under `@jovotech/*`.

**Maintenance Goals:**
- Keep the framework running for existing Alexa projects
- Security updates and dependency maintenance
- Simplification by removing unused platforms/integrations
- Potential improvements over time
- Local development integration (not npm packages)

---

## Quick Start

```bash
# Install dependencies (npm workspaces handles linking)
npm install
npm run build        # Build all packages

# Development
npm run test         # Run tests across all packages
npm run eslint       # Lint and fix code
npm run prettier     # Format code
```

---

## Project Structure

```
jovo-framework/
├── framework/           # Core framework (@jovotech/framework)
├── common/              # Shared utilities (@jovotech/common)
├── output/              # Output template system (@jovotech/output)
├── platforms/           # Platform implementations (simplified)
│   ├── platform-alexa/      # Alexa platform
│   ├── platform-core/       # Base platform
│   └── platform-web/        # Web platform
├── integrations/        # Third-party integrations (simplified)
│   ├── db-dynamodb/         # AWS DynamoDB (essential for Alexa)
│   ├── db-filedb/           # Local file DB (dev only)
│   ├── server-lambda/       # AWS Lambda (essential for Alexa)
│   ├── server-express/      # Express server (dev)
│   ├── plugin-debugger/     # Development debugger
│   ├── plugin-keywordnlu/   # Keyword-based NLU
│   ├── nlu-nlpjs/           # Local NLU (optional)
│   ├── slu-lex/             # Amazon Lex (optional)
│   └── ttscache-s3/         # S3 TTS caching
├── clients/             # Web clients
│   ├── client-web/
│   └── client-web-vue3/
├── docs/                # Documentation (40+ markdown files)
├── examples/            # Example projects
├── e2e/                 # End-to-end tests
├── scripts/             # Build utilities
├── lerna.json           # Monorepo config (Lerna 8)
└── package.json         # Root package (npm workspaces)
```

**Removed packages (no longer needed):**
- Platforms: googleassistant, dialogflow, facebookmessenger, googlebusiness, instagram
- Integrations: All CMS (airtable, googlesheets, sanity), analytics, db-mongodb, db-redis, nlu-dialogflow, nlu-rasa, nlu-snips, nlu-microsoftclu, plugin-slack, plugin-inbox
- Clients: client-web-vue2 (EOL)

---

## Architecture Overview

### RIDR Lifecycle (Request Pipeline)

The framework processes requests through 4 stages with middleware hooks:

```
Request → Interpretation → Dialogue → Response

Middleware points:
├── request.start → request → request.end
├── interpretation.start → interpretation.asr → interpretation.nlu → interpretation.end
├── dialogue.start → dialogue.router → dialogue.logic → dialogue.end
└── response.start → response.output → response.tts → response.end
```

### Key Classes

| Class | Location | Purpose |
|-------|----------|---------|
| `App` | framework/src/App.ts | Main application entry, plugin management |
| `Jovo` | framework/src/Jovo.ts | Request-scoped context ($request, $response, $session, etc.) |
| `Platform` | framework/src/Platform.ts | Abstract base for all platforms |
| `BaseComponent` | framework/src/BaseComponent.ts | Component base class |
| `Plugin` | framework/src/Plugin.ts | Plugin lifecycle hooks |

### Component System

Components are the building blocks of conversation logic:

```typescript
@Component()
class MyComponent extends BaseComponent {
  @Intents(['HelloIntent'])
  sayHello() {
    return this.$send('Hello!');
  }

  UNHANDLED() {
    return this.$send("I didn't understand that.");
  }
}
```

### Decorator Reference

- `@Component()` - Mark class as component
- `@Global()` - Make component globally accessible
- `@Handle()` - Mark method as handler
- `@Intents(...intents)` - Bind to specific intents
- `@Platforms(...platforms)` - Platform-specific handler
- `@Injectable()` / `@Inject()` - Dependency injection

---

## Current Package Set (17 packages)

### Core:
1. **common/** - Shared utilities
2. **output/** - Output templates
3. **framework/** - Core framework

### Platforms:
4. **platforms/platform-core/** - Base platform
5. **platforms/platform-alexa/** - Alexa platform (full CLI)
6. **platforms/platform-web/** - Web platform

### Integrations:
7. **integrations/server-lambda/** - AWS Lambda hosting
8. **integrations/server-express/** - Local dev server
9. **integrations/db-dynamodb/** - DynamoDB storage
10. **integrations/db-filedb/** - Local development DB
11. **integrations/plugin-debugger/** - Development tools
12. **integrations/plugin-keywordnlu/** - Keyword-based NLU
13. **integrations/nlu-nlpjs/** - Local NLU
14. **integrations/slu-lex/** - Amazon Lex
15. **integrations/ttscache-s3/** - S3 TTS caching

### Clients:
16. **clients/client-web/** - Web client
17. **clients/client-web-vue3/** - Vue 3 client

---

## Build System

### Monorepo: Lerna 8.1.2 + npm Workspaces

The project uses **npm workspaces** for dependency management and **Lerna 8** for task running:

```json
// package.json (workspaces)
{
  "workspaces": ["common", "output", "framework", "e2e", "clients/*", "platforms/*", "integrations/*", "examples/*"]
}

// lerna.json
{
  "version": "independent"
}
```

### TypeScript 5.3

All packages use TypeScript 5.3 with multi-target builds:
- `dist/cjs/` - CommonJS (Node.js)
- `dist/esm5/` - ES5 modules
- `dist/esm2015/` - ES2015 modules
- `dist/types/` - Type declarations

### Package Scripts

```bash
# Per-package pattern:
npm run prebuild   # rimraf dist
npm run build      # tsc -b tsconfig.build.*.json
npm run watch      # tsc --watch
npm run test       # jest --runInBand
npm run eslint     # eslint src test --fix
npm run prettier   # prettier -w -l src test
```

---

## CLI Architecture

The CLI is modular with platform-specific plugins:

**Location:** Each platform has CLI in `platforms/platform-*/src/cli/`

**Alexa CLI Commands:**
- `jovo build:platform alexa` - Build Alexa skill files
- `jovo deploy:platform alexa` - Deploy to Alexa
- `jovo get:platform alexa` - Sync from Alexa
- `jovo validate:alexa` - Validate skill
- `jovo certify:alexa` - Submit for certification

**Project Config:** `jovo.project.js`
```javascript
const { ProjectConfig } = require('@jovotech/cli-core');
const { AlexaCli } = require('@jovotech/platform-alexa');

module.exports = new ProjectConfig({
  plugins: [
    new AlexaCli({
      skillId: 'amzn1.ask.skill.xxx',
      askProfile: 'default',
      locales: { en: ['en-US'] }
    })
  ]
});
```

---

## Dependencies (Updated)

### Core Dependencies (Current):
| Package | Version | Notes |
|---------|---------|-------|
| typescript | ~5.3.0 | ✅ Updated |
| @types/node | ^20.10.0 | ✅ Updated |
| eslint | ^8.50.0 | ✅ Updated |
| @typescript-eslint/* | ^6.0.0 | ✅ Updated |
| jest | ^29.7.0 | ✅ Updated |
| ts-jest | ^29.1.0 | ✅ Updated |
| prettier | ^3.1.0 | ✅ Updated |
| lerna | 8.1.2 | ✅ Updated |

### AWS SDK:
- db-dynamodb uses @aws-sdk/* ^3.433.0
- server-lambda should be updated to match

---

## Testing

```bash
# Run all tests
npm run test

# Run specific package tests
cd framework && npm test
cd platforms/platform-alexa && npm test

# Test configuration
# - Jest 29.x with ts-jest
# - Node test environment
# - Tests in test/ directories
```

### Test Status
- Build: ✅ All 17 packages build successfully
- Tests: ⚠️ Some framework tests fail (pre-existing issues related to dependency injection tests)
- Core functionality tests pass (common, output utilities, basic framework tests)

---

## Local Development Integration

Since this is a local fork (not npm packages), integrate into projects by:

### Option 1: npm link
```bash
# In jovo-framework packages
cd framework && npm link
cd ../platforms/platform-alexa && npm link

# In your project
npm link @jovotech/framework @jovotech/platform-alexa
```

### Option 2: File references
```json
// package.json in your project
{
  "dependencies": {
    "@jovotech/framework": "file:../jovo-framework/framework",
    "@jovotech/platform-alexa": "file:../jovo-framework/platforms/platform-alexa"
  }
}
```

### Option 3: Workspaces (Recommended)
Create a parent workspace containing both jovo-framework and your projects.

---

## Common Tasks

### Adding a new handler
```typescript
// In your component
@Intents(['MyIntent'])
async handleMyIntent() {
  const value = this.$entities.mySlot?.resolved;
  return this.$send({ message: `You said ${value}` });
}
```

### Using session data
```typescript
this.$session.data.myKey = 'value';  // Set
const val = this.$session.data.myKey; // Get
```

### Redirecting between components
```typescript
return this.$redirect(OtherComponent);
return this.$redirect(OtherComponent, 'specificHandler');
```

### Sending Alexa-specific output
```typescript
return this.$send({
  message: 'Hello!',
  platforms: {
    alexa: {
      nativeResponse: {
        // Raw Alexa response directives
      }
    }
  }
});
```

---

## Files to Know

| File | Purpose |
|------|---------|
| `framework/src/App.ts` | Main app class, middleware pipeline |
| `framework/src/Jovo.ts` | Request context (18KB, core class) |
| `platforms/platform-alexa/src/AlexaPlatform.ts` | Alexa platform entry |
| `platforms/platform-alexa/src/cli/` | Alexa CLI tools |
| `integrations/server-lambda/src/Lambda.ts` | Lambda handler |
| `docs/ridr-lifecycle.md` | Architecture documentation |
| `docs/components.md` | Component system docs |

---

## Troubleshooting

### Bootstrap fails
```bash
# Clear and retry
npm run clean
rm -rf node_modules
npm install
npm run bootstrap
```

### TypeScript errors after changes
```bash
npm run build  # Rebuild all packages
```

### Lerna hoisting issues
Check `.npmrc` has `legacy-peer-deps=true`

### Tests failing
```bash
# Run in band (sequential) to avoid conflicts
jest --runInBand
```

---

## External Resources

- Original Jovo Docs: https://www.jovo.tech/docs (may be archived)
- Alexa Skills Kit: https://developer.amazon.com/alexa/alexa-skills-kit
- ASK CLI: https://developer.amazon.com/docs/smapi/ask-cli-intro.html

---

## Notes for Claude

When working on this codebase:
1. The framework uses decorators heavily - check `framework/src/decorators/`
2. Platform-specific code is isolated in `platforms/platform-*/`
3. All integrations follow the Plugin pattern
4. The RIDR lifecycle is central to understanding request flow
5. Multi-format builds mean changes need `npm run build` to propagate
6. Alexa platform is the priority - other platforms may be removed
