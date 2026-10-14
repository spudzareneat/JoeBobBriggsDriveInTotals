(() => {
  'use strict';

  const SHOWS = [
    'The Last Drive-In',
    'MonsterVision',
    "Joe Bob's Drive-In Theater",
    'Joe Bob Goes to the Drive-In (book)',
    'Unknown',
  ];

  const PATREON = 'https://www.patreon.com/c/TheLostDriveIn';

  const $ = sel => document.querySelector(sel);
  const search = $('#search');
  const results = $('#results');
  const showSelect = $('#show');
  const feature = $('#feature');

  let movies = [];
  let imdb = {};
  let matches = [];
  let active = -1;

  // ---- Data ----

  // Minimal RFC 4180 parser: quoted fields, doubled quotes, newlines inside quotes.
  function parseCsv(text) {
    const rows = [];
    let row = [], field = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') quoted = false;
        else field += c;
      } else if (c === '"') quoted = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); rows.push(row); row = []; field = '';
      } else field += c;
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    const [head, ...body] = rows;
    return body.filter(r => r.length > 1).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
  }

  // Which show the totals came from: the source column when it names one,
  // otherwise the show that was on the air on that date.
  function showFor(m) {
    const s = m.source;
    if (/Last Drive-In|Shudder/i.test(s)) return SHOWS[0];
    if (/Monstervision/i.test(s)) return SHOWS[1];
    if (/Drive-In Theater/i.test(s)) return SHOWS[2];
    if (/^book/i.test(s)) return SHOWS[3];
    const d = m.first_air_date;
    if (!d) return SHOWS[4];
    if (d >= '2018') return SHOWS[0];
    if (d >= '1996-05') return SHOWS[1];
    return SHOWS[2];
  }

  const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ');

  async function load() {
    try {
      const [csvText, imdbJson] = await Promise.all([
        fetch('drivein_totals.csv').then(r => { if (!r.ok) throw new Error(r.status); return r.text(); }),
        fetch('site/imdb.json').then(r => (r.ok ? r.json() : {})).catch(() => ({})),
      ]);
      imdb = imdbJson;
      movies = parseCsv(csvText).map(m => ({
        ...m,
        show: showFor(m),
        key: fold(`${m.title} ${m.year}`),
      })).sort((a, b) => a.title.localeCompare(b.title));
    } catch (e) {
      feature.innerHTML = '<p class="error">The movie list didn\'t load. Refresh the page to try again.</p>';
      return;
    }
    for (const s of SHOWS) {
      const n = movies.filter(m => m.show === s).length;
      if (n) showSelect.add(new Option(`${s} (${n})`, s));
    }
    const fromHash = byId(location.hash.slice(1));
    select(fromHash || pickRandom(), !fromHash);
  }

  const byId = id => movies.find(m => m.imdb_id === id);

  function pool() {
    return showSelect.value ? movies.filter(m => m.show === showSelect.value) : movies;
  }

  function pickRandom() {
    const p = pool();
    return p[Math.floor(Math.random() * p.length)];
  }

  // ---- Rendering helpers ----

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Totals are a run of short sentences; give each one its own line.
  // Rejoin pieces split after an initial or title ("Mr. Ed", "F. William Parker").
  function splitTotals(t) {
    const out = [];
    for (const s of t.split(/(?<=[.!?])\s+(?=["'(A-Z0-9])/)) {
      if (out.length && /(^|[\s.])([A-Z]|Mr|Mrs|Ms|Dr|St|Jr)\.$/.test(out[out.length - 1])) out[out.length - 1] += ' ' + s;
      else out.push(s);
    }
    return out.map(s => s.trim()).filter(Boolean);
  }

  function starsHtml(n) {
    const count = Math.max(4, Math.ceil(n));
    let html = '';
    for (let i = 0; i < count; i++) {
      const fill = Math.round(Math.min(1, Math.max(0, n - i)) * 100);
      html += `<span class="star" style="--fill:${fill}%"></span>`;
    }
    return `<span class="stars" data-lit="${n > 0}" role="img" aria-label="${n} out of 4 stars">${html}</span>`;
  }

  const smallStars = n => (n === '' ? '' : '★'.repeat(Math.floor(n)) + (n % 1 ? '½' : '') || '0★');

  function formatDate(d) {
    if (!d) return '';
    const [y, mo, day] = d.split('-').map(Number);
    return new Date(y, mo - 1, day).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function imdbHtml(m, info) {
    const url = `https://www.imdb.com/title/${encodeURIComponent(m.imdb_id)}/`;
    const poster = info?.poster
      ? `<img src="${esc(info.poster)}" alt="Poster for ${esc(m.title)}" loading="lazy">`
      : `<div class="no-poster">No poster on IMDb</div>`;
    const facts = [
      info?.year || m.year,
      info?.runtime && `${info.runtime} min`,
      info?.certificate,
      info?.genres?.join(', '),
    ].filter(Boolean).join(' / ');
    return `
      <div class="poster-col">
        <figure class="poster">${poster}</figure>
        <div class="imdb">
          ${facts ? `<p class="facts">${esc(facts)}</p>` : ''}
          ${info?.directors?.length ? `<p>Directed by ${esc(info.directors.join(', '))}</p>` : ''}
          ${info?.cast?.length ? `<p>Starring ${esc(info.cast.join(', '))}</p>` : ''}
          ${info?.plot ? `<p class="plot">${esc(info.plot)}</p>` : ''}
          ${info?.rating ? `<p class="score">IMDb ${info.rating.toFixed(1)} <span>from ${info.votes.toLocaleString()} votes</span></p>` : ''}
          ${m.imdb_id ? `<a class="imdb-link" href="${url}" target="_blank" rel="noopener">View on IMDb</a>` : ''}
        </div>
      </div>`;
  }

  // ---- Feature ----

  function select(m, replace) {
    if (!m) return;
    const info = imdb[m.imdb_id];
    const totals = splitTotals(m.totals);
    const stars = m.stars === '' ? null : Number(m.stars);
    const noms = m.academy_award_nominations;
    const hallOfFame = /Hall of Fame/i.test(noms);
    const nomsText = noms.replace(/\s*(In|Inducted into) the Drive-In Hall of Fame\.?/i, '').trim();

    feature.innerHTML = `
      <section class="marquee" aria-label="Now showing">
        <div class="board">
          <h2>${esc(m.title)}</h2>
          <p class="tagline">${esc(m.year)}${m.show !== 'Unknown' ? ` on ${esc(m.show)}` : ''}</p>
        </div>
      </section>

      <div class="feature-body">
        ${imdbHtml(m, info)}

        <div>
          <section class="totals">
            <h3>Drive-In<br>Totals:</h3>
            <ul>${totals.map(t => `<li>${esc(t.replace(/(?<!\b[A-Z]|Mr|Mrs|Ms|Dr|St|Jr)\.$/, ''))}</li>`).join('')}</ul>
          </section>

          <div class="rating">
            ${stars === null
              ? '<span class="unrated">Joe Bob didn\'t give this one a star rating.</span>'
              : `${starsHtml(stars)}<span class="said">${esc(m.star_rating || `${stars} stars.`)}</span>`}
          </div>

          ${nomsText || hallOfFame ? `
          <section class="noms">
            <h3>Drive-In Academy Awards</h3>
            ${nomsText ? `<p>${esc(nomsText)}</p>` : ''}
            ${hallOfFame ? '<span class="hall">In the Drive-In Hall of Fame</span>' : ''}
          </section>` : ''}

          <div class="aired">
            ${m.first_air_date ? `<p>First aired ${esc(formatDate(m.first_air_date))}</p>` : ''}
            <p>Source: ${esc(m.source || 'unknown')}</p>
            ${/patreon/i.test(m.source) ? `<p>Listen on <a href="${PATREON}" target="_blank" rel="noopener">The Lost Drive-In Patreon</a></p>` : ''}
          </div>
        </div>
      </div>`;

    document.title = `Drive-In Totals: ${m.title}`;
    const hash = `#${m.imdb_id}`;
    if (location.hash !== hash) history[replace ? 'replaceState' : 'pushState'](null, '', hash);
  }

  // ---- Search combobox ----

  function renderResults() {
    const q = fold(search.value).trim();
    const words = q.split(/\s+/).filter(Boolean);
    matches = pool().filter(m => words.every(w => m.key.includes(w))).slice(0, 60);
    active = matches.length ? 0 : -1;
    results.innerHTML = matches.length
      ? matches.map((m, i) => `
          <li role="option" id="opt-${i}" data-i="${i}" aria-selected="${i === active}">
            <span class="r-title">${esc(m.title)}</span>
            <span class="r-year">${esc(m.year)}</span>
            <span class="r-stars">${smallStars(m.stars)}</span>
          </li>`).join('')
      : '<li class="r-empty">No movies match. Try fewer words, or pick "Every show".</li>';
    open(true);
    updateActive();
  }

  function open(on) {
    results.hidden = !on;
    search.setAttribute('aria-expanded', String(on));
  }

  function updateActive() {
    results.querySelectorAll('[role=option]').forEach(li => {
      const on = Number(li.dataset.i) === active;
      li.setAttribute('aria-selected', String(on));
      if (on) li.scrollIntoView({ block: 'nearest' });
    });
    search.setAttribute('aria-activedescendant', active >= 0 ? `opt-${active}` : '');
  }

  function choose(i) {
    const m = matches[i];
    if (!m) return;
    open(false);
    search.value = '';
    select(m);
    feature.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  search.addEventListener('input', renderResults);
  search.addEventListener('focus', renderResults);
  search.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (results.hidden) renderResults(); else { active = Math.min(active + 1, matches.length - 1); updateActive(); } }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); updateActive(); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
    else if (e.key === 'Escape') open(false);
  });
  results.addEventListener('mousedown', e => {
    const li = e.target.closest('[role=option]');
    if (li) { e.preventDefault(); choose(Number(li.dataset.i)); }
  });
  document.addEventListener('click', e => { if (!e.target.closest('.combo')) open(false); });

  showSelect.addEventListener('change', () => {
    if (document.activeElement === search) renderResults();
  });
  $('#random').addEventListener('click', () => select(pickRandom()));
  window.addEventListener('popstate', () => { const m = byId(location.hash.slice(1)); if (m) select(m, true); });

  load();
})();
