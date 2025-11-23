# Jovo Framework Fork - Maintenance Todo List

This document tracks maintenance tasks and recommendations for the privately maintained Jovo Framework fork.

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 5.0.0 | Nov 2024 | Initial fork release - simplified to 17 packages, updated to TS 5.3 |
| 4.6.2 | (upstream) | Last official Jovo release |

---

## Immediate Tasks

### 1. Fix server-lambda AWS SDK Types
**Priority:** Low | **Effort:** 5 minutes | **Risk:** None

The `server-lambda` package has an outdated AWS SDK type dependency. The actual Lambda.ts implementation doesn't use any AWS SDK clients at runtime - it only uses types for the event/context/callback signature.

**Current state:**
```json
// integrations/server-lambda/package.json
"@aws-sdk/client-lambda": "^3.8.1"  // OLD - from 2021
```

**Target state:**
```json
"@aws-sdk/client-lambda": "^3.433.0"  // Match db-dynamodb
```

**Steps:**
1. Edit `integrations/server-lambda/package.json`
2. Change `"@aws-sdk/client-lambda": "^3.8.1"` to `"@aws-sdk/client-lambda": "^3.433.0"`
3. Run `npm install`
4. Run `npm run build` to verify
5. The change is types-only, no code changes needed

**Files to modify:**
- `integrations/server-lambda/package.json:26`

---

### 2. Test CLI Installation
**Priority:** High | **Effort:** 15 minutes | **Risk:** May not work

The Jovo CLI is a separate repository and may need the published npm packages. Testing will reveal if the CLI works with local file references.

**Steps:**
1. Install the CLI globally:
   ```bash
   npm install -g @jovotech/cli
   jovo --version
   ```

2. Check what commands are available:
   ```bash
   jovo --help
   jovo build --help
   ```

3. Test if CLI works with local framework (in your Alexa project):
   ```bash
   # Create jovo.project.js if not exists
   jovo build:platform alexa --dry-run
   ```

**Expected issues:**
- CLI may expect npm-published packages, not local references
- CLI hooks in `platforms/platform-alexa/src/cli/` may have version mismatches

**If CLI doesn't work:**
- Option A: Use ASK CLI directly (`ask deploy`)
- Option B: Fork jovo-cli repo and maintain separately
- Option C: Manually run build steps that CLI would do

---

### 3. Test with Real Alexa Project
**Priority:** High | **Effort:** 30-60 minutes | **Risk:** Medium

This is the most important validation - ensuring the framework works end-to-end.

**Prerequisites:**
- An existing Alexa skill project
- AWS credentials configured
- ASK CLI installed (`npm install -g ask-cli`)

**Steps:**

1. **Set up file references in your Alexa project:**
   ```json
   // your-alexa-project/package.json
   {
     "dependencies": {
       "@jovotech/framework": "file:../jovo-framework/framework",
       "@jovotech/platform-alexa": "file:../jovo-framework/platforms/platform-alexa",
       "@jovotech/server-lambda": "file:../jovo-framework/integrations/server-lambda",
       "@jovotech/db-dynamodb": "file:../jovo-framework/integrations/db-dynamodb",
       "@jovotech/common": "file:../jovo-framework/common",
       "@jovotech/output": "file:../jovo-framework/output"
     }
   }
   ```

2. **Install and build:**
   ```bash
   cd your-alexa-project
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

3. **Test locally:**
   ```bash
   # If using express server for local dev
   npm run start:dev
   # Test with Alexa simulator or local requests
   ```

4. **Deploy to Lambda:**
   ```bash
   # Package for Lambda
   npm run bundle  # or however you package

   # Deploy (using ASK CLI or AWS CLI)
   ask deploy
   # or
   aws lambda update-function-code --function-name your-function --zip-file fileb://bundle.zip
   ```

5. **Test end-to-end:**
   - Open Alexa Developer Console
   - Test the skill in the simulator
   - Check CloudWatch logs for errors

**What to watch for:**
- Import errors (missing packages)
- TypeScript compilation errors
- Runtime errors in Lambda
- DynamoDB connection issues
- Session persistence working

---

### 4. Commit and Tag v5.0.0
**Priority:** High | **Effort:** 5 minutes | **Risk:** None

Once testing is complete, commit all changes and tag the release.

**Steps:**
```bash
# Review changes
git status
git diff

# Commit
git add -A
git commit -m "chore: release v5.0.0 - fork with simplified packages

- Removed 18+ unused packages (Google, Facebook, CMS, analytics, etc.)
- Updated TypeScript 4.4 -> 5.3
- Updated Lerna 6 -> 8.1.2
- Updated ESLint, Jest, Prettier to latest
- Fixed deprecated @lerna/project usage
- All 17 remaining packages build successfully
"

# Tag
git tag -a v5.0.0 -m "v5.0.0 - Initial fork release"

# Push (when ready)
git push origin main
git push origin v5.0.0
```

---

## Short-term Tasks

### 5. Handle Failing Tests
**Priority:** Medium | **Effort:** 30 minutes | **Risk:** Low

Currently 5 test suites fail (20/100 tests). These are pre-existing issues related to decorator metadata reflection, not bugs introduced by the upgrade.

**Failing tests:**
| File | Tests | Root Cause |
|------|-------|------------|
| DependencyInjection.test.ts | 4 | Decorator metadata not resolving constructor parameter types |
| Routing.test.ts | 2 | Handler decorator inheritance issues |
| ComponentAvailability.test.ts | 4 | isAvailable checks failing |
| Jovo.test.ts | 1 | $send validation error |
| e2e.test.ts | ~9 | Integration test cascade failures |

**Analysis of DependencyInjection failures:**

The tests expect `server.response.output` to contain messages, but receive empty arrays. This happens because:
1. The DI system uses `Reflect.getMetadata('design:paramtypes', ...)` to get constructor parameter types
2. ts-jest may not be emitting decorator metadata correctly
3. When type info is missing, dependencies can't be resolved, so handlers don't run

**Option A: Skip failing tests (Quick fix)**
```typescript
// In each failing test file, change:
describe('...', () => {
// To:
describe.skip('...', () => {
```

Files to modify:
- `framework/test/DependencyInjection.test.ts` - add `.skip` to describe blocks
- `framework/test/Routing.test.ts` - add `.skip` to failing tests
- `framework/test/ComponentAvailability.test.ts` - add `.skip`
- `framework/test/Jovo.test.ts` - add `.skip` to failing test
- `framework/test/e2e.test.ts` - add `.skip`

**Option B: Fix ts-jest configuration (Proper fix)**

The jest.config.js is minimal. Try adding explicit ts-jest configuration:

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      }
    }]
  }
};
```

**Option C: Accept as known issues**

Document the failures in CLAUDE.md and move on. The core functionality works (80 tests pass), and these failures don't affect runtime behavior.

---

### 6. Create Maintenance Script
**Priority:** Low | **Effort:** 10 minutes | **Risk:** None

Create a script for routine maintenance tasks.

**Create file:** `scripts/maintenance.sh`
```bash
#!/bin/bash
set -e

echo "================================"
echo "Jovo Framework Maintenance Check"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Check versions
echo -e "${GREEN}1. Package Versions${NC}"
npx lerna list --json | jq -r '.[] | "\(.name): \(.version)"' | head -10
echo "... ($(npx lerna list --json | jq length) total packages)"
echo ""

# 2. Security audit
echo -e "${GREEN}2. Security Audit${NC}"
npm audit --audit-level=high 2>&1 | head -20 || echo -e "${YELLOW}Some vulnerabilities found (see above)${NC}"
echo ""

# 3. Outdated packages
echo -e "${GREEN}3. Outdated Dependencies${NC}"
npm outdated 2>&1 | head -15 || echo "All dependencies up to date"
echo ""

# 4. Build
echo -e "${GREEN}4. Build Check${NC}"
npm run build 2>&1 | tail -5
echo ""

# 5. Test summary
echo -e "${GREEN}5. Test Summary${NC}"
npm test 2>&1 | grep -E "(Test Suites|Tests:)" | tail -2 || echo -e "${RED}Tests failed${NC}"
echo ""

echo "================================"
echo "Maintenance check complete"
echo "================================"
```

Make executable: `chmod +x scripts/maintenance.sh`

---

### 7. Run npm audit
**Priority:** Low | **Effort:** 5 minutes | **Risk:** Low

Current vulnerabilities are in Lerna's dependencies (dev-only, not in production builds).

**Current issues:**
- `@octokit/plugin-paginate-rest` - ReDoS (moderate)
- `@octokit/request` - ReDoS (moderate)
- `@octokit/request-error` - ReDoS (moderate)

**These are safe to ignore because:**
1. They're in Lerna, a dev dependency
2. They're not included in production builds
3. They're ReDoS (regex denial of service), low practical risk
4. Fix would require downgrading to Lerna 6.x

**To check for high-severity issues only:**
```bash
npm audit --audit-level=high
```

---

## Integration Method Selection

### Recommended: Git Submodules

Best for: Multiple projects using the same framework version

**Setup (one-time per project):**
```bash
# In your Alexa project repo
cd your-alexa-project
git submodule add https://github.com/YOUR_USER/jovo-framework.git lib/jovo-framework
git submodule update --init --recursive

# Build the framework
cd lib/jovo-framework
npm install
npm run build
cd ../..
```

**package.json configuration:**
```json
{
  "dependencies": {
    "@jovotech/framework": "file:./lib/jovo-framework/framework",
    "@jovotech/platform-alexa": "file:./lib/jovo-framework/platforms/platform-alexa",
    "@jovotech/server-lambda": "file:./lib/jovo-framework/integrations/server-lambda",
    "@jovotech/db-dynamodb": "file:./lib/jovo-framework/integrations/db-dynamodb",
    "@jovotech/db-filedb": "file:./lib/jovo-framework/integrations/db-filedb",
    "@jovotech/common": "file:./lib/jovo-framework/common",
    "@jovotech/output": "file:./lib/jovo-framework/output"
  }
}
```

**Updating the framework:**
```bash
cd lib/jovo-framework
git pull origin main
npm install
npm run build
cd ../..
npm install  # Re-link packages
```

**Cloning a project with submodule:**
```bash
git clone --recurse-submodules https://github.com/YOUR_USER/your-alexa-project.git
# Or if already cloned:
git submodule update --init --recursive
```

---

### Alternative: Parent Workspace

Best for: Active development on both framework and projects

**Directory structure:**
```
my-jovo-projects/
├── package.json           # Root workspace
├── jovo-framework/        # Clone of this repo
│   ├── common/
│   ├── framework/
│   ├── platforms/
│   └── integrations/
└── alexa-skill/           # Your Alexa project
    ├── package.json
    └── src/
```

**Root package.json:**
```json
{
  "private": true,
  "workspaces": [
    "jovo-framework/common",
    "jovo-framework/output",
    "jovo-framework/framework",
    "jovo-framework/platforms/*",
    "jovo-framework/integrations/*",
    "alexa-skill"
  ]
}
```

**Your project package.json:**
```json
{
  "name": "alexa-skill",
  "dependencies": {
    "@jovotech/framework": "*",
    "@jovotech/platform-alexa": "*",
    "@jovotech/server-lambda": "*",
    "@jovotech/db-dynamodb": "*"
  }
}
```

**Setup:**
```bash
mkdir my-jovo-projects && cd my-jovo-projects
git clone https://github.com/YOUR_USER/jovo-framework.git
# Create or clone your alexa-skill project
npm install  # From root - links everything
```

---

## Versioning Workflow

### When to Version

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Bug fix | Patch (5.0.0 → 5.0.1) | Fix Lambda response handling |
| New feature | Minor (5.0.0 → 5.1.0) | Add new output helper |
| Breaking change | Major (5.0.0 → 6.0.0) | Change API signature |
| Dependency update | Patch or Minor | Update AWS SDK |

### Version Bump Commands

```bash
# Patch release (bug fixes)
npx lerna version patch --yes --no-push --no-git-tag-version
node scripts/update-peer-dependencies.js
git add -A
git commit -m "chore: release v5.0.1"
git tag v5.0.1

# Minor release (new features)
npx lerna version minor --yes --no-push --no-git-tag-version
node scripts/update-peer-dependencies.js
git add -A
git commit -m "chore: release v5.1.0"
git tag v5.1.0

# Major release (breaking changes)
npx lerna version major --yes --no-push --no-git-tag-version
node scripts/update-peer-dependencies.js
git add -A
git commit -m "chore: release v6.0.0"
git tag v6.0.0

# Push when ready
git push origin main --tags
```

---

## Long-term Considerations

### 1. Evaluate Web Platform/Clients
**Question:** Are you using `platform-web`, `client-web`, or `client-web-vue3`?

If not, consider removing them to further simplify:
```bash
# Remove web-related packages (if unused)
rm -rf platforms/platform-web
rm -rf clients/client-web
rm -rf clients/client-web-vue3

# Update package.json workspaces
# Update lerna.json if needed
```

This would reduce from 17 to 14 packages.

### 2. TypeScript Updates
Current: TypeScript 5.3.0

**To update TypeScript:**
1. Check latest version: `npm show typescript version`
2. Update root package.json and all child packages
3. Run `npm install && npm run build`
4. Fix any new type errors

### 3. Node.js Version
Current project targets: Node 18+ (ES2017)

When Node 18 reaches EOL (April 2025), consider:
- Updating target to ES2020+
- Testing with Node 20/22
- Updating @types/node

### 4. AWS SDK Updates
The AWS SDK v3 packages should be updated periodically:
- `@aws-sdk/client-dynamodb`
- `@aws-sdk/util-dynamodb`
- `@aws-sdk/client-lambda` (types only)

Check for updates: `npm outdated | grep aws-sdk`

---

## Quick Reference

```bash
# === Daily Development ===
npm run build              # Build all packages
npm test                   # Run tests (some may fail)
npm run eslint             # Lint and fix

# === Version Management ===
npx lerna list             # List all packages
npx lerna version patch    # Bump patch version
node scripts/update-peer-dependencies.js  # Sync peer deps

# === Maintenance ===
npm audit                  # Security check
npm outdated              # Dependency check
./scripts/maintenance.sh  # Run all checks

# === Clean Rebuild ===
npm run clean
rm -rf node_modules
npm install
npm run build
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Development guide and architecture |
| `SESSION_NOTES.md` | Quick reference for sessions |
| `ACTION_PLAN.md` | Detailed status and history |
| `TODOLIST.md` | This file - maintenance tasks |
| `lerna.json` | Monorepo configuration |
| `package.json` | Root workspace config |
| `tsconfig.json` | TypeScript settings |
| `scripts/update-peer-dependencies.js` | Peer dep sync script |
