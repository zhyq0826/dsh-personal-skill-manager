import { execFileSync } from 'node:child_process';
import manifest from '../package.json' with { type: 'json' };

const [version, ...extraArguments] = process.argv.slice(2);
if (!/^\d+\.\d+\.\d+(?:[-+].+)?$/.test(version ?? '') || extraArguments.length) {
  console.error('Usage: npm run release -- <version> (for example, 0.6.1)');
  process.exit(1);
}

function npm(args, stdio = 'inherit') {
  return execFileSync(process.execPath, [process.env.npm_execpath, ...args], {
    encoding: 'utf8',
    stdio,
  });
}

try {
  const registry = manifest.publishConfig.registry;
  const account = npm(['whoami', '--registry', registry], ['inherit', 'pipe', 'inherit']).trim();
  if (account !== 'zhyq0826') {
    throw new Error(`Expected npm account zhyq0826, got ${account}.`);
  }

  npm(['version', '--no-git-tag-version', '--allow-same-version', version]);
  npm(['run', 'pack:check']);
  npm(['publish']);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
