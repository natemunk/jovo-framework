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

- [ ] **Fix server-lambda AWS SDK** - Update to match db-dynamodb's @aws-sdk/* ^3.433.0
- [ ] **Test CLI installation** - Run `npm install -g @jovotech/cli && jovo --version`
- [ ] **Test with real Alexa project** - Link framework to existing project and verify it works
- [ ] **Commit and tag v5.0.0** - Mark the fork starting point

---

## Short-term Tasks

- [ ] **Skip or fix failing tests** - 5 test suites fail (DependencyInjection, Routing, ComponentAvailability, Jovo, e2e)
- [ ] **Create maintenance script** - `scripts/maintenance.sh` for routine checks
- [ ] **Run npm audit** - Address any high-severity vulnerabilities
- [ ] **Document integration method** - Choose and document how to link to other projects

---

## Integration Options

### Option 1: Git Submodules (Recommended)

```bash
# In your Alexa project repo
git submodule add git@github.com:yourusername/jovo-framework.git lib/jovo-framework

# package.json
{
  "dependencies": {
    "@jovotech/framework": "file:./lib/jovo-framework/framework",
    "@jovotech/platform-alexa": "file:./lib/jovo-framework/platforms/platform-alexa",
    "@jovotech/server-lambda": "file:./lib/jovo-framework/integrations/server-lambda",
    "@jovotech/db-dynamodb": "file:./lib/jovo-framework/integrations/db-dynamodb"
  }
}
```

**Pros:** Version controlled, reproducible, works with CI/CD
**Cons:** Submodule workflow can be confusing

### Option 2: Parent Workspace

```
my-projects/
├── package.json          # Root workspace
├── jovo-framework/       # This repo
└── alexa-skill/          # Your project
```

```json
// my-projects/package.json
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

**Pros:** Simplest for local development, automatic linking
**Cons:** Requires specific directory structure

### Option 3: npm link

```bash
# In jovo-framework
cd framework && npm link
cd ../platforms/platform-alexa && npm link
cd ../integrations/server-lambda && npm link
cd ../integrations/db-dynamodb && npm link

# In your project
npm link @jovotech/framework @jovotech/platform-alexa @jovotech/server-lambda @jovotech/db-dynamodb
```

**Pros:** Quick for testing
**Cons:** Links break on npm install, not persistent

---

## Versioning Strategy

Use semantic versioning with your fork:

```bash
# Major changes (breaking)
npx lerna version major --yes --no-push

# Minor changes (new features)
npx lerna version minor --yes --no-push

# Patch changes (bug fixes)
npx lerna version patch --yes --no-push

# After version bump, tag and push
git add -A
git commit -m "chore: bump version to X.Y.Z"
git tag vX.Y.Z
git push && git push --tags
```

---

## Maintenance Routine

Run periodically (monthly or before major changes):

```bash
# 1. Update dependencies
npm outdated                    # Check what's outdated
npm update                      # Update within semver ranges

# 2. Security check
npm audit                       # Check for vulnerabilities
npm audit fix                   # Auto-fix if safe

# 3. Build and test
npm run build                   # Verify build works
npm test                        # Run tests (some may fail)

# 4. Lint
npm run eslint                  # Fix linting issues
npm run prettier                # Format code
```

---

## Long-term Considerations

- [ ] **Evaluate web platform need** - Remove clients/platform-web if not using web features
- [ ] **Set up CI/CD** - GitHub Actions for automated builds/tests
- [ ] **Consider TypeScript 5.4+** - Stay current with TS releases
- [ ] **Monitor Alexa SDK changes** - ASK SDK updates may require platform-alexa changes

---

## Known Issues

### Failing Tests (Pre-existing)

These tests fail due to decorator metadata issues, not runtime bugs:

| Test File | Failures | Root Cause |
|-----------|----------|------------|
| DependencyInjection.test.ts | 4 | Metadata reflection in test environment |
| Routing.test.ts | 2 | Handler decorator inheritance |
| ComponentAvailability.test.ts | 4 | isAvailable checks |
| Jovo.test.ts | 1 | Validation error in $send |
| e2e.test.ts | Multiple | Integration test dependencies |

**Resolution options:**
1. Skip tests with `describe.skip()` or `it.skip()`
2. Fix ts-jest configuration for decorator metadata
3. Accept as known issues (80/100 tests pass)

### Security Vulnerabilities

Lerna 8.x has moderate vulnerabilities in @octokit dependencies. These are:
- Dev-only (not in production builds)
- ReDoS vulnerabilities (low practical risk)
- Will be fixed in future Lerna releases

---

## Quick Reference

```bash
# Build everything
npm run build

# Run tests
npm test

# Bump version (all packages)
npx lerna version patch --yes --no-push

# Check package versions
npx lerna list --json

# Clean rebuild
npm run clean && npm install && npm run build
```
