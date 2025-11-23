const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Updates peer dependencies to match the current version of referenced packages.
 * Works with Lerna 8+ which removed @lerna/project.
 */

function getPackages() {
  // Use lerna list to get all packages
  const output = execSync('npx lerna list --json --all', { encoding: 'utf8' });
  return JSON.parse(output);
}

function updatePeerDependency(packages, peerDepName) {
  const sourcePackage = packages.find(pkg => pkg.name === peerDepName);

  if (!sourcePackage) {
    console.log(`Skipping ${peerDepName} - not found in workspace`);
    return;
  }

  const sourceVersion = sourcePackage.version;
  console.log(`Updating ${peerDepName} peer-dependency to ${sourceVersion}`);

  let updated = 0;

  for (const pkg of packages) {
    const packageJsonPath = path.join(pkg.location, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    if (packageJson.peerDependencies && packageJson.peerDependencies[peerDepName]) {
      const oldVersion = packageJson.peerDependencies[peerDepName];
      if (oldVersion !== sourceVersion) {
        packageJson.peerDependencies[peerDepName] = sourceVersion;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        console.log(`  Updated ${pkg.name}: ${oldVersion} -> ${sourceVersion}`);
        updated++;
      }
    }
  }

  if (updated === 0) {
    console.log(`  No packages needed updating`);
  }
}

async function main() {
  try {
    const packages = getPackages();
    console.log(`Found ${packages.length} packages\n`);

    // Update peer dependencies for core packages
    updatePeerDependency(packages, '@jovotech/framework');
    updatePeerDependency(packages, '@jovotech/output');
    updatePeerDependency(packages, '@jovotech/common');

    console.log('\nSuccess');
  } catch (error) {
    console.error('Failure:', error.message);
    process.exit(1);
  }
}

main();
