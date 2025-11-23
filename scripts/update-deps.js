const fs = require('fs');
const path = require('path');

const newDevDeps = {
  "typescript": "~5.3.0",
  "@types/node": "^20.10.0",
  "@types/jest": "^29.5.0",
  "@typescript-eslint/eslint-plugin": "^6.0.0",
  "@typescript-eslint/parser": "^6.0.0",
  "eslint": "^8.50.0",
  "eslint-config-prettier": "^9.0.0",
  "eslint-plugin-prettier": "^5.0.0",
  "prettier": "^3.1.0",
  "jest": "^29.7.0",
  "ts-jest": "^29.1.0",
  "rimraf": "^5.0.0"
};

const dirs = [
  'common',
  'output',
  'framework',
  'platforms/platform-alexa',
  'platforms/platform-core',
  'platforms/platform-web',
  'integrations/db-dynamodb',
  'integrations/db-filedb',
  'integrations/nlu-nlpjs',
  'integrations/plugin-debugger',
  'integrations/plugin-keywordnlu',
  'integrations/server-express',
  'integrations/server-lambda',
  'integrations/slu-lex',
  'integrations/tts-polly',
  'integrations/ttscache-s3',
  'clients/client-web',
  'clients/client-web-vue3'
];

dirs.forEach(dir => {
  const pkgPath = path.join(__dirname, '..', dir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.log(`Skipping ${dir} - no package.json`);
    return;
  }
  
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  if (pkg.devDependencies) {
    Object.keys(newDevDeps).forEach(dep => {
      if (pkg.devDependencies[dep]) {
        pkg.devDependencies[dep] = newDevDeps[dep];
      }
    });
  }
  
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`Updated ${dir}`);
});

console.log('Done!');
