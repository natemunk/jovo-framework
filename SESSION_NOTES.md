# Session Notes - November 2024

Quick reference for continuing work on the Jovo Framework maintenance.

## TL;DR

- **Build:** `npm install && npm run build` - Works, all 17 packages compile
- **Tests:** `npm test` - Some fail (pre-existing issues, not blocking)
- **Packages:** Reduced from 35+ to 17 (removed Google, Facebook, CMS, analytics, etc.)
- **TypeScript:** Updated to 5.3 (from 4.4.4)
- **Monorepo:** Now using npm workspaces + Lerna 8 (was Lerna 6 bootstrap)

## Key Files

- `CLAUDE.md` - Full development guide
- `ACTION_PLAN.md` - Detailed status and next steps
- `package.json` - Root config with workspaces
- `lerna.json` - Lerna 8 config
- `tsconfig.json` - TypeScript config (has skipLibCheck: true)

## What Works

```bash
npm install      # Installs all deps via npm workspaces
npm run build    # Builds all 17 packages successfully
```

## What Needs Attention

1. **Test failures** - framework/test/ has some failing tests:
   - DependencyInjection.test.ts
   - Routing.test.ts
   - ComponentAvailability.test.ts
   - These appear to be pre-existing issues, not caused by the upgrade

2. **CLI not tested** - The Jovo CLI is a separate repo
   - Try: `npm install -g @jovotech/cli && jovo --version`

3. **Integration not tested** - Need to test with an actual Alexa project

## Remaining Packages

**Core (3):** common, output, framework
**Platforms (3):** platform-alexa, platform-core, platform-web
**Integrations (9):** server-lambda, server-express, db-dynamodb, db-filedb, plugin-debugger, plugin-keywordnlu, nlu-nlpjs, slu-lex, ttscache-s3
**Clients (2):** client-web, client-web-vue3

## Next Steps

1. Test CLI: `npm install -g @jovotech/cli`
2. Test with real Alexa project using file references or npm link
3. Investigate/fix failing tests if needed
4. Update server-lambda AWS SDK

## Deleted Packages

Platforms: googleassistant, dialogflow, facebookmessenger, googlebusiness, instagram
Integrations: cms-*, analytics-*, db-mongodb, db-redis, nlu-dialogflow, nlu-rasa, nlu-snips, nlu-microsoftclu, plugin-slack, plugin-inbox, tts-polly
Clients: client-web-vue2
