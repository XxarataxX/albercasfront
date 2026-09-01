const rawArgs = process.argv.slice(2);
const fs = require('fs');
const path = require('path');

const flagArg = rawArgs.find((arg) => arg.startsWith('--') && arg !== '--');
const branchArg = rawArgs.find((arg) => arg.startsWith('--branch='));

let branchScope = process.env.REACT_APP_BRANCH_SCOPE || '';

if (branchArg) {
  branchScope = branchArg.split('=').slice(1).join('=');
} else if (flagArg) {
  branchScope = flagArg.replace(/^--/, '');
} else {
  const npmConfigBranch = Object.keys(process.env)
    .filter((key) => key.startsWith('npm_config_'))
    .map((key) => key.replace('npm_config_', ''))
    .find((key) => ['bugambilias', 'chapalita', 'sanjorge', 'san-jorge', 'solares'].includes(key));

  if (npmConfigBranch) {
    branchScope = npmConfigBranch;
  }
}

process.env.PORT = process.env.PORT || '3001';
process.env.HOST = process.env.HOST || '0.0.0.0';

if (branchScope) {
  process.env.REACT_APP_BRANCH_SCOPE = branchScope;
}

const hasBuild = fs.existsSync(path.resolve(__dirname, '..', 'build', 'index.html'));
const explicitPort = Boolean(process.env.PORT);
const productionStart = process.env.NODE_ENV === 'production' || (hasBuild && explicitPort && process.env.PORT !== '3001');

if (productionStart) {
  require('./serve-build');
  return;
}

require('react-scripts/scripts/start');
