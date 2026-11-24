import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import manifest from '../package.json' with { type: 'json' };

test('shipped client registers and releases its native slots and matching dictionaries', () => {
  const require = createRequire(import.meta.url);
  const source = readFileSync(new URL(import.meta.resolve(`${manifest.name}/client`)), 'utf8');
  const slots = new Map();
  const disposers = [];
  let dictionaries;
  let registered;
  vm.runInNewContext(source, {
    window: {
      __ModuleLoader__: {
        load(entry) {
          registered = entry;
        },
      },
    },
  });
  assert.equal(registered.id, manifest.name);
  const plugin = registered.factory((id) => {
    if (id === '@deepseek-ai/dsh-client-ui-primitives') return {};
    assert.ok(['react', 'react/jsx-runtime'].includes(id), id);
    return require(id);
  });
  plugin.apply({
    effect(setup) {
      disposers.push(setup());
    },
    slots: {
      inject(slot, register) {
        return register();
      },
      register(slot, component) {
        slots.set(slot.name, { slot, component });
        return () => slots.delete(slot.name);
      },
    },
    locale: {
      register(namespace, messages) {
        dictionaries = messages;
        return () => {
          dictionaries = undefined;
        };
      },
      bind() {
        return (key) => dictionaries.en[key];
      },
    },
  });
  assert.deepEqual(Object.keys(dictionaries.en).sort(), Object.keys(dictionaries.zh).sort());
  assert.equal(typeof slots.get('main').component, 'function');
  const sidebar = slots.get('sidebar.panellist');
  assert.equal(sidebar.slot.label(), 'My skills');
  assert.equal(sidebar.component({ size: 24 }).props.width, 24);
  for (const dispose of disposers.reverse()) dispose();
  assert.equal(dictionaries, undefined);
  assert.equal(slots.size, 0);
});
