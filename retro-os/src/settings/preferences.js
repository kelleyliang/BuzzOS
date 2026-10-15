export const DEFAULT_PREFERENCES = {
  displayName: 'Guest', wallpaper: 'hills', showIcons: true,
  clock24: false, startupSound: true,
};
const STORAGE_KEY = 'buzzos-preferences';

export function readPreferences(storage) {
  try {
    const saved = JSON.parse((storage ?? globalThis.localStorage).getItem(STORAGE_KEY));
    if (!saved || typeof saved !== 'object') return { ...DEFAULT_PREFERENCES };
    return {
      displayName: typeof saved.displayName === 'string' ? saved.displayName.trim().slice(0, 28) || 'Guest' : 'Guest',
      wallpaper: ['hills', 'teal', 'navy'].includes(saved.wallpaper) ? saved.wallpaper : 'hills',
      ...Object.fromEntries(['showIcons', 'clock24', 'startupSound'].map(key => [
        key, typeof saved[key] === 'boolean' ? saved[key] : DEFAULT_PREFERENCES[key],
      ])),
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(preferences, storage) {
  try {
    (storage ?? globalThis.localStorage).setItem(STORAGE_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}
