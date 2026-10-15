import { useEffect, useRef, useState } from 'react';
import buzz from '../assets/buzz-character.png';
import './StartMenu.css';

export default function StartMenu({ apps, preferences, onPreferencesChange, onLaunch, onShowDesktop }) {
  const [view, setView] = useState('apps');
  const [search, setSearch] = useState('');
  const headingRef = useRef(null);
  const searchRef = useRef(null);
  const visibleApps = apps.filter(app => `${app.label} ${app.description}`.toLowerCase().includes(search.trim().toLowerCase()));

  useEffect(() => {
    if (view === 'apps') searchRef.current?.focus();
    else headingRef.current?.focus();
  }, [view]);

  function update(key, value) {
    onPreferencesChange(current => ({ ...current, [key]: value }));
  }

  function navigateList(event) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const items = [...event.currentTarget.querySelectorAll('[data-app-launch]')];
    if (!items.length) return;
    event.preventDefault();
    const index = items.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
      : event.key === 'ArrowDown' ? (index + 1) % items.length : (index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length);
    items[next].focus();
  }

  return (
    <section className="start-menu" id="buzzos-start-menu" role="dialog" aria-labelledby="start-menu-title">
      <header className="start-header">
        <button type="button" className="start-profile-button" onClick={() => setView('profile')} aria-label="Edit your local profile">
          <span className="start-avatar"><img src={buzz} alt="" /></span>
          <span><strong>{preferences.displayName || 'Guest'}</strong><small>Your little corner of BuzzOS</small></span>
        </button>
        <span className="start-wordmark" id="start-menu-title">BuzzOS</span>
      </header>
      <div className="start-body">
        <div className="start-main">
          {view === 'apps' ? (
            <>
              <label className="start-search">Find an application
                <input ref={searchRef} type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search apps…" onKeyDown={event => {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    const items = event.currentTarget.closest('.start-main').querySelectorAll('[data-app-launch]');
                    (event.key === 'ArrowDown' ? items[0] : items[items.length - 1])?.focus();
                  }
                }} />
              </label>
              <h2 className="start-section-label">ALL APPLICATIONS <span>{visibleApps.length}</span></h2>
              <div className="start-apps" onKeyDown={navigateList}>
                {visibleApps.map(app => (
                  <button type="button" className="start-app" data-app-launch key={app.id} onClick={() => onLaunch(app.id)}>
                    <img src={app.icon} alt="" /><span><strong>{app.label}</strong><small>{app.description}</small></span><span className="start-launch-arrow" aria-hidden="true">›</span>
                  </button>
                ))}
                {!visibleApps.length && <p className="start-empty" role="status">No apps found. Try another name.</p>}
              </div>
            </>
          ) : (
            <div className="start-panel">
              <h2 tabIndex={-1} ref={headingRef}>{view === 'profile' ? 'Your profile' : 'Settings'}</h2>
              <p className="start-panel-intro">{view === 'profile' ? 'Make this little desktop your own.' : 'A few things to make yourself at home.'}</p>
              {view === 'profile' ? (
                <>
                  <div className="start-profile-preview"><img src={buzz} alt="Buzz" /><strong>{preferences.displayName || 'Guest'}</strong><span>Local profile</span></div>
                  <label className="start-field">Display name<input type="text" maxLength={28} value={preferences.displayName} onChange={event => update('displayName', event.target.value)} /></label>
                  <p className="start-note">Your profile stays in this browser. No account needed.</p>
                </>
              ) : (
                <>
                  <fieldset className="start-wallpapers"><legend>Desktop background</legend>
                    {[['hills', 'Green hills'], ['teal', 'Classic teal'], ['navy', 'Midnight']].map(([value, label]) => (
                      <label key={value}><input type="radio" name="wallpaper" value={value} checked={preferences.wallpaper === value} onChange={() => update('wallpaper', value)} /><span className={`start-swatch start-swatch-${value}`} /><span>{label}</span></label>
                    ))}
                  </fieldset>
                  <label className="start-toggle"><input type="checkbox" checked={preferences.showIcons} onChange={event => update('showIcons', event.target.checked)} /><span>Show desktop icons</span></label>
                  <label className="start-toggle"><input type="checkbox" checked={preferences.clock24} onChange={event => update('clock24', event.target.checked)} /><span>Use a 24-hour clock</span></label>
                  <label className="start-toggle"><input type="checkbox" checked={preferences.startupSound} onChange={event => update('startupSound', event.target.checked)} /><span>Play startup sound</span></label>
                  <p className="start-note">Startup sound changes apply the next time you load BuzzOS.</p>
                </>
              )}
              <p className="start-save-note">Changes save automatically in this browser.</p>
            </div>
          )}
        </div>
        <nav className="start-sidebar" aria-label="Start menu sections">
          <button type="button" className={view === 'apps' ? 'selected' : ''} aria-current={view === 'apps' ? 'page' : undefined} onClick={() => setView('apps')}><span aria-hidden="true">▦</span> Applications</button>
          <button type="button" className={view === 'profile' ? 'selected' : ''} aria-current={view === 'profile' ? 'page' : undefined} onClick={() => setView('profile')}><span aria-hidden="true">♙</span> Your profile</button>
          <button type="button" className={view === 'settings' ? 'selected' : ''} aria-current={view === 'settings' ? 'page' : undefined} onClick={() => setView('settings')}><span aria-hidden="true">⚙</span> Settings</button>
          <div className="start-sidebar-divider" />
          <button type="button" onClick={() => onLaunch('about')}><span aria-hidden="true">ⓘ</span> Meet Buzz</button>
          <button type="button" onClick={onShowDesktop}><span aria-hidden="true">▱</span> Show desktop</button>
          <p>A little rough around the edges.<br />Still growing.</p>
        </nav>
      </div>
      <footer className="start-footer"><span>Welcome home, {preferences.displayName || 'Guest'}.</span><span>BuzzOS</span></footer>
    </section>
  );
}
