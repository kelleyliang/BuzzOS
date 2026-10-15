import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PREFERENCES, readPreferences, savePreferences } from './preferences.js';

function memoryStorage(value = null) {
  return { getItem: () => value, setItem: (_, next) => { value = next; } };
}

test('new visitors get the existing desktop appearance and startup sound', () => {
  assert.deepEqual(readPreferences(memoryStorage()), DEFAULT_PREFERENCES);
});

test('profile and desktop choices survive saving and reloading', () => {
  const storage = memoryStorage();
  const preferences = { displayName: 'Kelley', wallpaper: 'teal', showIcons: false, clock24: true, startupSound: false };
  assert.equal(savePreferences(preferences, storage), true);
  assert.deepEqual(readPreferences(storage), preferences);
});

test('invalid saved settings cannot break the desktop', () => {
  for (const raw of ['broken json', 'null', '42', JSON.stringify({ wallpaper: 'missing', showIcons: 'false', displayName: 42 })]) {
    assert.deepEqual(readPreferences(memoryStorage(raw)), DEFAULT_PREFERENCES);
  }
  const restored = readPreferences(memoryStorage(JSON.stringify({ displayName: '  ' + 'a'.repeat(60), clock24: true })));
  assert.equal(restored.displayName.length, 28);
  assert.equal(restored.clock24, true);
  const blocked = { getItem() { throw new Error('Unavailable'); }, setItem() { throw new Error('Unavailable'); } };
  assert.deepEqual(readPreferences(blocked), DEFAULT_PREFERENCES);
  assert.equal(savePreferences(DEFAULT_PREFERENCES, blocked), false);
});
