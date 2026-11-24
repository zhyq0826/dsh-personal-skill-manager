import { build } from 'esbuild';
import manifest from '../package.json' with { type: 'json' };

await build({
  entryPoints: ['src/client/index.ts'],
  outfile: manifest.exports['./client'],
  platform: 'browser',
  bundle: true,
  format: 'cjs',
  target: 'es2022',
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', '@deepseek-ai/dsh-client-ui-primitives'],
  loader: { '.css': 'text' },
  banner: { js: `window.__ModuleLoader__.load({ id: ${JSON.stringify(manifest.name)}, factory(require) { const module = { exports: {} };` },
  footer: { js: 'return module.exports; } });' },
});
