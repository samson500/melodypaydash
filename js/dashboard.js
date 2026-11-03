// MelodyPay dashboard — mobile app UI. Music tasks only (localStorage per account).
(function () {
  const user = Auth.current();
  if (!user) return;

  const STATE_KEY = 'melodypay:state:' + user.email;
  const LISTEN_SECONDS = 15;
  const SONG_REWARD = 6000;
  const DAILY_SONG_COUNT = 3;
  const WITHDRAW_MIN = 100000;

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const naira = (n) => (n < 0 ? '-' : '') + '₦' + Math.abs(Math.round(n)).toLocaleString('en-NG');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

  function relTime(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }

  /* =========================================================
     Catalogue (3 rotate per day)
     ========================================================= */
  const SONGS = [
    { id: 'essence',     title: 'Essence (feat. Tems)',  artist: 'Wizkid',        term: 'wizkid essence tems',        art: 'art-sunset',  glyph: 'music',      reward: SONG_REWARD, root: 57, bpm: 100 },
    { id: 'lastlast',    title: 'Last Last',             artist: 'Burna Boy',     term: 'burna boy last last',        art: 'art-night',   glyph: 'bolt',       reward: SONG_REWARD, root: 55, bpm: 104 },
    { id: 'cityboys',    title: 'City Boys',             artist: 'Burna Boy',     term: 'burna boy city boys',        art: 'art-neon',    glyph: 'star',       reward: SONG_REWARD, root: 58, bpm: 108 },
    { id: 'unavailable', title: 'Unavailable',           artist: 'Davido',        term: 'davido unavailable',         art: 'art-rose',    glyph: 'heart',      reward: SONG_REWARD, root: 60, bpm: 106 },
    { id: 'fall',        title: 'Fall',                  artist: 'Davido',        term: 'davido fall',                art: 'art-ocean',   glyph: 'music',      reward: SONG_REWARD, root: 59, bpm: 102 },
    { id: 'lonely',      title: 'Lonely At The Top',     artist: 'Asake',         term: 'asake lonely at the top',    art: 'art-gold',    glyph: 'star',       reward: SONG_REWARD, root: 62, bpm: 100 },
    { id: 'amapiano',    title: 'Amapiano',              artist: 'Asake',         term: 'asake amapiano',             art: 'art-palms',   glyph: 'music',      reward: SONG_REWARD, root: 61, bpm: 110 },
    { id: 'sungba',      title: 'Sungba',                artist: 'Asake',         term: 'asake sungba',               art: 'art-emerald', glyph: 'bolt',       reward: SONG_REWARD, root: 60, bpm: 112 },
    { id: 'calmdown',    title: 'Calm Down',             artist: 'Rema',          term: 'rema calm down',             art: 'art-ocean',   glyph: 'heart',      reward: SONG_REWARD, root: 59, bpm: 107 },
    { id: 'dumebi',      title: 'Dumebi',                artist: 'Rema',          term: 'rema dumebi',                art: 'art-rose',    glyph: 'music',      reward: SONG_REWARD, root: 57, bpm: 105 },
    { id: 'nwantiti',    title: 'Love Nwantiti',         artist: 'CKay',          term: 'ckay love nwantiti',         art: 'art-neon',    glyph: 'heart',      reward: SONG_REWARD, root: 58, bpm: 94 },
    { id: 'peru',        title: 'Peru',                  artist: 'Fireboy DML',   term: 'fireboy dml peru',           art: 'art-gold',    glyph: 'music',      reward: SONG_REWARD, root: 61, bpm: 102 },
    { id: 'bandana',     title: 'Bandana',               artist: 'Fireboy DML',   term: 'fireboy dml bandana',        art: 'art-sunset',  glyph: 'bolt',       reward: SONG_REWARD, root: 60, bpm: 100 },
    { id: 'rush',        title: 'Rush',                  artist: 'Ayra Starr',    term: 'ayra starr rush',            art: 'art-emerald', glyph: 'bolt',       reward: SONG_REWARD, root: 63, bpm: 103 },
    { id: 'bloody',      title: 'Bloody Samaritan',      artist: 'Ayra Starr',    term: 'ayra starr bloody samaritan',art: 'art-palms',   glyph: 'star',       reward: SONG_REWARD, root: 62, bpm: 105 },
    { id: 'soso',        title: 'Soso',                  artist: 'Omah Lay',      term: 'omah lay soso',              art: 'art-night',   glyph: 'music',      reward: SONG_REWARD, root: 56, bpm: 98 },
    { id: 'godly',       title: 'Godly',                 artist: 'Omah Lay',      term: 'omah lay godly',             art: 'art-ocean',   glyph: 'heart',      reward: SONG_REWARD, root: 55, bpm: 96 },
    { id: 'freemind',    title: 'Free Mind',             artist: 'Tems',          term: 'tems free mind',             art: 'art-rose',    glyph: 'heart',      reward: SONG_REWARD, root: 60, bpm: 90 },
    { id: 'meandu',      title: 'Me & U',                artist: 'Tems',          term: 'tems me and u',              art: 'art-gold',    glyph: 'music',      reward: SONG_REWARD, root: 59, bpm: 92 },
    { id: 'buga',        title: 'Buga (Lo Lo Lo)',       artist: 'Kizz Daniel',   term: 'kizz daniel buga',           art: 'art-palms',   glyph: 'star',       reward: SONG_REWARD, root: 64, bpm: 110 },
    { id: 'cough',       title: 'Cough (Odo)',           artist: 'Kizz Daniel',   term: 'kizz daniel cough',          art: 'art-neon',    glyph: 'bolt',       reward: SONG_REWARD, root: 63, bpm: 108 },
    { id: 'dada',        title: 'Dada',                  artist: 'Young Jonn',    term: 'young jonn dada',            art: 'art-sunset',  glyph: 'music',      reward: SONG_REWARD, root: 57, bpm: 105 },
    { id: 'xtracool',    title: 'Xtra Cool',             artist: 'Young Jonn',    term: 'young jonn xtra cool',       art: 'art-ocean',   glyph: 'heart',      reward: SONG_REWARD, root: 58, bpm: 104 },
    { id: 'soweto',      title: 'Soweto',                artist: 'Victony',       term: 'victony soweto',             art: 'art-rose',    glyph: 'bolt',       reward: SONG_REWARD, root: 61, bpm: 100 },
    { id: 'bounce',      title: 'Bounce',                artist: 'Ruger',         term: 'ruger bounce',               art: 'art-gold',    glyph: 'music',      reward: SONG_REWARD, root: 58, bpm: 106 },
    { id: 'asiwaju',     title: 'Asiwaju',               artist: 'Ruger',         term: 'ruger asiwaju',              art: 'art-emerald', glyph: 'star',       reward: SONG_REWARD, root: 57, bpm: 108 },
    { id: 'obapluto',    title: 'Obapluto',              artist: 'Shallipopi',    term: 'shallipopi obapluto',        art: 'art-night',   glyph: 'bolt',       reward: SONG_REWARD, root: 56, bpm: 110 },
    { id: 'elonmusk',    title: 'Elon Musk',             artist: 'Shallipopi',    term: 'shallipopi elon musk',       art: 'art-palms',   glyph: 'music',      reward: SONG_REWARD, root: 55, bpm: 109 },
    { id: 'gwagwalada',  title: 'GWAGWALADA',            artist: 'BNXN',          term: 'bnxn gwagwalada',            art: 'art-neon',    glyph: 'star',       reward: SONG_REWARD, root: 60, bpm: 102 },
    { id: 'alcohol',     title: 'Alcohol',               artist: 'Joeboy',        term: 'joeboy alcohol',             art: 'art-rose',    glyph: 'heart',      reward: SONG_REWARD, root: 59, bpm: 99 },
    { id: 'sip',         title: 'Sip (Alcohol)',         artist: 'Joeboy',        term: 'joeboy sip',                 art: 'art-sunset',  glyph: 'music',      reward: SONG_REWARD, root: 61, bpm: 100 },
    { id: 'rocking',     title: 'Rocking',               artist: 'Zinoleesky',    term: 'zinoleesky rocking',         art: 'art-ocean',   glyph: 'bolt',       reward: SONG_REWARD, root: 58, bpm: 104 },
    { id: 'chance',      title: 'Chance (Na Ham)',       artist: 'Seyi Vibez',    term: 'seyi vibez chance',          art: 'art-emerald', glyph: 'star',       reward: SONG_REWARD, root: 57, bpm: 100 },
    { id: 'bullion',     title: 'Bullion Van',           artist: 'Seyi Vibez',    term: 'seyi vibez bullion van',     art: 'art-gold',    glyph: 'music',      reward: SONG_REWARD, root: 56, bpm: 101 },
    { id: 'zazuu',       title: 'Zazuu Zeh',             artist: 'Portable',      term: 'portable zazuu',             art: 'art-night',   glyph: 'bolt',       reward: SONG_REWARD, root: 55, bpm: 112 },
    { id: 'somebodysson',title: "Somebody's Son",        artist: 'Tiwa Savage',   term: 'tiwa savage somebodys son',  art: 'art-rose',    glyph: 'heart',      reward: SONG_REWARD, root: 60, bpm: 98 },
    { id: 'johnny',      title: 'Johnny',                artist: 'Yemi Alade',    term: 'yemi alade johnny',          art: 'art-palms',   glyph: 'music',      reward: SONG_REWARD, root: 62, bpm: 106 },
    { id: 'duduke',      title: 'Duduke',                artist: 'Simi',          term: 'simi duduke',                art: 'art-ocean',   glyph: 'heart',      reward: SONG_REWARD, root: 61, bpm: 96 },
    { id: 'high',        title: 'High',                  artist: 'Adekunle Gold', term: 'adekunle gold high',         art: 'art-gold',    glyph: 'star',       reward: SONG_REWARD, root: 59, bpm: 97 },
    { id: 'sinner',      title: 'Sinner',                artist: 'Adekunle Gold', term: 'adekunle gold sinner',       art: 'art-emerald', glyph: 'music',      reward: SONG_REWARD, root: 58, bpm: 95 },
    { id: 'nwababy',     title: 'Nwa Baby',              artist: 'Flavour',       term: 'flavour nwa baby',           art: 'art-sunset',  glyph: 'bolt',       reward: SONG_REWARD, root: 64, bpm: 114 },
    { id: 'fadafada',    title: 'Fada Fada',             artist: 'Phyno',         term: 'phyno fada fada',            art: 'art-night',   glyph: 'star',       reward: SONG_REWARD, root: 57, bpm: 104 },
    { id: 'wo',          title: 'Wo!!',                  artist: 'Olamide',       term: 'olamide wo',                 art: 'art-neon',    glyph: 'bolt',       reward: SONG_REWARD, root: 56, bpm: 108 },
    { id: 'infinity',    title: 'Infinity',              artist: 'Olamide',       term: 'olamide infinity',           art: 'art-ocean',   glyph: 'music',      reward: SONG_REWARD, root: 60, bpm: 100 },
    { id: 'personally',  title: 'Personally',            artist: 'P-Square',      term: 'p square personally',        art: 'art-rose',    glyph: 'heart',      reward: SONG_REWARD, root: 61, bpm: 101 },
    { id: 'africanqueen',title: 'African Queen',         artist: '2Baba',         term: '2baba african queen',        art: 'art-gold',    glyph: 'star',       reward: SONG_REWARD, root: 63, bpm: 92 },
    { id: 'olivertwist', title: 'Oliver Twist',          artist: "D'banj",        term: 'dbanj oliver twist',         art: 'art-palms',   glyph: 'music',      reward: SONG_REWARD, root: 62, bpm: 110 },
    { id: 'pana',        title: 'Pana',                  artist: 'Tekno',         term: 'tekno pana',                 art: 'art-emerald', glyph: 'heart',      reward: SONG_REWARD, root: 60, bpm: 103 },
    { id: 'legover',     title: 'Leg Over',              artist: 'Mr Eazi',       term: 'mr eazi leg over',           art: 'art-sunset',  glyph: 'music',      reward: SONG_REWARD, root: 58, bpm: 105 },
    { id: 'ozumba',      title: 'Ozumba Mbadiwe',        artist: 'Reekado Banks', term: 'reekado banks ozumba mbadiwe', art: 'art-night', glyph: 'bolt',       reward: SONG_REWARD, root: 57, bpm: 99 }
  ];

  /* Cover artwork (iTunes lookup, cached locally) */
  const ART_KEY = 'melodypay:music:art';
  function artCache() { try { return JSON.parse(localStorage.getItem(ART_KEY)) || {}; } catch { return {}; } }
  function saveArtCache(c) { try { localStorage.setItem(ART_KEY, JSON.stringify(c)); } catch { /* ignore */ } }
  let artMap = artCache();

  function loadArtwork(songs) {
    let changed = false;
    return Promise.all(songs.map((s) => {
      const c = artMap[s.term];
      if (c && (c.art || c.url)) return null;
      return fetch('https://itunes.apple.com/search?term=' + encodeURIComponent(s.term) + '&entity=song&limit=1')
        .then((r) => r.json())
        .then((j) => {
          const r = j.results && j.results[0];
          if (!r) return;
          artMap[s.term] = {
            art: r.artworkUrl100 ? r.artworkUrl100.replace('/100x100bb.jpg', '/300x300bb.jpg') : '',
            url: r.previewUrl || ''
          };
          changed = true;
        })
        .catch(() => {});
    })).then(() => { if (changed) { saveArtCache(artMap); render(current, true); } });
  }

  /* =========================================================
     Audio synth (gives each song a looping groove)
     ========================================================= */
  const synth = {
    ctx: null, master: null, timer: null, step: 0,
    PROG: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]],
    freq: (m) => 440 * Math.pow(2, (m - 69) / 12),
    note(midi, dur, type, vol) {
      const { ctx } = this;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = this.freq(midi);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.05);
    },
    start(song) {
      this.stop();
      try {
        this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
        this.ctx.resume();
        if (!this.master) { this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination); }
        this.master.gain.value = state.muted ? 0 : 0.12;
      } catch { return; }
      const interval = 60000 / song.bpm / 2;
      this.timer = setInterval(() => {
        const s = this.step++;
        const chord = this.PROG[Math.floor(s / 8) % 4];
        const arp = chord[s % 4] + (s % 8 >= 4 ? 12 : 0);
        this.note(song.root + arp, 0.45, 'triangle', 0.35);
        if (s % 8 === 0) this.note(song.root - 12 + chord[0], 1.4, 'sine', 0.7);
        if (s % 4 === 2) this.note(song.root + 24 + chord[2], 0.15, 'square', 0.04);
      }, interval);
    },
    stop() { clearInterval(this.timer); this.timer = null; },
    setMuted(m) { if (this.master) this.master.gain.value = m ? 0 : 0.12; }
  };

  /* =========================================================
     State
     ========================================================= */
  function freshToday() { return { key: dayKey(), earn: 0, songs: [] }; }
  function defaultState() {
    return { total: 0, balance: 0, songsPlayed: 0, today: freshToday(), activity: [], bank: null, muted: false };
  }

  let state = Object.assign({}, defaultState(), store.get(STATE_KEY));
  if (!state.today || state.today.key !== dayKey()) state.today = freshToday();
  if (!Array.isArray(state.today.songs)) state.today.songs = [];

  function save() { store.set(STATE_KEY, state); }

  // Local test seeding — open dashboard.html?test=1 while logged in (localhost only).
  (function seedTest() {
    try {
      const params = new URLSearchParams(location.search);
      const isLocal = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
      if (!isLocal || params.get('test') !== '1') return;
      state.total = Math.max(Number(state.total) || 0, 150000);
      state.balance = Math.max(Number(state.balance) || 0, 150000);
      if (!state.songsPlayed) state.songsPlayed = 9;
      if (!state.bank || !state.bank.bank) {
        state.bank = { bank: 'Opay', code: '100004', name: user.name || 'Test User', account: '0123456789', verified: true };
      }
      if (!Array.isArray(state.activity) || !state.activity.length) {
        state.activity = [
          { type: 'music', desc: 'Music task — Soso', amount: 6000, ts: Date.now() - 2 * 3600e3 },
          { type: 'music', desc: 'Music task — Free Mind', amount: 6000, ts: Date.now() - 3 * 3600e3 }
        ];
      }
      save();
      setTimeout(() => { try { feedback({ title: 'Test data loaded', message: 'Balance set to ' + naira(state.balance) + ' with a verified payout account. Play the tracks, then test withdrawal.' }); } catch (e) { /* ignore */ } }, 500);
      history.replaceState(null, '', location.pathname + (location.hash || ''));
    } catch (e) { /* ignore */ }
  })();

  // Local balance override — open dashboard.html?balance=102000 while logged in (localhost only).
  (function setTestBalance() {
    try {
      const params = new URLSearchParams(location.search);
      const isLocal = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
      const b = params.get('balance');
      if (!isLocal || b == null) return;
      const val = Math.max(0, Math.round(Number(b) || 0));
      state.balance = val;
      state.total = Math.max(Number(state.total) || 0, val);
      save();
      setTimeout(() => { try { feedback({ title: 'Balance updated', message: 'Your balance is now ' + naira(state.balance) + '.' }); } catch (e) { /* ignore */ } }, 400);
      history.replaceState(null, '', location.pathname + (location.hash || ''));
    } catch (e) { /* ignore */ }
  })();

  function dayNumber() { return Math.floor(Date.now() / 86400000); }
  function dailySongs() {
    const start = (dayNumber() * DAILY_SONG_COUNT) % SONGS.length;
    return Array.from({ length: DAILY_SONG_COUNT }, (_, i) => SONGS[(start + i) % SONGS.length]);
  }
  function doneToday(id) { return state.today.songs.indexOf(id) !== -1; }
  function doneCount() { return dailySongs().filter((s) => doneToday(s.id)).length; }

  const firstName = () => (user.name || 'Friend').trim().split(/\s+/)[0];
  function initials() {
    return (user.name || 'M').trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0)).join('').toUpperCase() || 'M';
  }

  function credit(amount, type, desc) {
    state.total += amount;
    state.balance += amount;
    state.today.earn += amount;
    state.activity.unshift({ type, desc, amount, ts: Date.now() });
    save();
  }

  function feedback(opts) {
    const o = typeof opts === 'string' ? { message: opts } : (opts || {});
    const type = o.type === 'error' ? 'error' : o.type === 'info' ? 'info' : 'success';
    const overlay = document.createElement('div');
    overlay.className = 'fb-overlay';
    overlay.innerHTML = '<div class="fb-card ' + type + '">' +
      '<div class="fb-ic">' + icon(type === 'error' ? 'x' : type === 'info' ? 'bell' : 'check') + '</div>' +
      '<h3>' + esc(o.title || (type === 'error' ? 'Something went wrong' : type === 'info' ? 'Heads up' : 'Success')) + '</h3>' +
      '<p>' + esc(o.message || '') + '</p>' +
      '<button class="btn-primary full" type="button" data-fb-close>' + esc(o.button || 'OK') + '</button></div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    function close() { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 220); }
    overlay.addEventListener('click', (e) => {
      if (e.target.closest && e.target.closest('[data-fb-close]')) { close(); if (typeof o.onOk === 'function') o.onOk(); return; }
      if (e.target === overlay) close();
    });
    return close;
  }

  /* =========================================================
     Player
     ========================================================= */
  const player = { song: null, elapsed: 0, playing: false, timer: null };
  function audioEl() { return document.getElementById('playerAudio'); }

  function openPlayer() {
    const sheet = $('#playerSheet');
    if (sheet) sheet.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closePlayer() {
    const sheet = $('#playerSheet');
    if (sheet) sheet.classList.remove('open');
    document.body.style.overflow = '';
  }

  function playSong(id) {
    const song = SONGS.find((s) => s.id === id);
    if (!song) return;
    if (!dailySongs().some((s) => s.id === id)) { feedback({ type: 'error', title: 'Not available', message: "This track isn't part of today's tasks." }); return; }
    if (doneToday(id)) { feedback({ type: 'info', title: 'Already done', message: "You've already completed this track today. Come back tomorrow." }); return; }
    if (player.song && player.song.id === id) { togglePlayer(); return; }
    stopSong();
    player.song = song; player.elapsed = 0; player.playing = true;
    const meta = artMap[song.term] || {};
    const a = audioEl();
    if (a && meta.url) { try { a.src = meta.url; a.currentTime = 0; a.play().catch(function () {}); } catch (e) { /* ignore */ } }
    else synth.start(song);
    player.timer = setInterval(tickPlayer, 250);
    openPlayer();
    updatePlayer();
  }

  function togglePlayer() {
    if (!player.song) return;
    player.playing = !player.playing;
    if (player.playing) {
      const meta = artMap[player.song.term] || {};
      const a = audioEl();
      if (a && meta.url) a.play().catch(function () {}); else synth.start(player.song);
      player.timer = setInterval(tickPlayer, 250);
    } else {
      const a = audioEl(); if (a) a.pause();
      synth.stop();
      clearInterval(player.timer);
    }
    updatePlayer();
  }

  function stopSong() {
    const a = audioEl(); if (a) { try { a.pause(); } catch (e) { /* ignore */ } }
    synth.stop();
    clearInterval(player.timer);
    player.song = null; player.elapsed = 0; player.playing = false; player.timer = null;
    closePlayer();
  }

  function tickPlayer() {
    player.elapsed += 0.25;
    if (player.elapsed >= LISTEN_SECONDS) {
      const song = player.song;
      state.songsPlayed += 1;
      if (!doneToday(song.id)) state.today.songs.push(song.id);
      stopSong();
      credit(song.reward, 'music', 'Music task — ' + song.title);
      render(current, true);
      const allDone = doneCount() >= DAILY_SONG_COUNT;
      setTimeout(() => {
        feedback(allDone
          ? { title: 'All tracks done!', message: 'You earned ' + naira(song.reward) + '. All ' + DAILY_SONG_COUNT + ' tracks completed — come back tomorrow for fresh songs.', button: 'Nice' }
          : { title: 'Track complete!', message: '+' + naira(song.reward) + ' added to your balance.', button: 'Keep going' });
      }, 120);
      return;
    }
    updatePlayer();
  }

  function updatePlayer() {
    if (!player.song) { closePlayer(); return; }
    const meta = artMap[player.song.term] || {};
    const cover = $('#psCover');
    if (cover) {
      cover.className = 'ps-cover ' + player.song.art;
      cover.innerHTML = meta.art
        ? '<img src="' + esc(meta.art) + '" alt="' + esc(player.song.title) + '" />'
        : icon(player.song.glyph);
    }
    const bg = $('#psBg');
    if (bg) {
      if (meta.art) { bg.className = 'ps-bg'; bg.style.backgroundImage = 'url("' + meta.art + '")'; }
      else { bg.className = 'ps-bg fallback'; bg.style.backgroundImage = ''; }
    }
    const t = $('#psTitle'); if (t) t.textContent = player.song.title;
    const ar = $('#psArtist'); if (ar) ar.textContent = player.song.artist;
    const rw = $('#psReward'); if (rw) rw.textContent = naira(player.song.reward);
    const bar = $('#psBar'); if (bar) bar.style.width = Math.min(100, (player.elapsed / LISTEN_SECONDS) * 100) + '%';
    const cur = $('#psCur'); if (cur) cur.textContent = '0:' + String(Math.floor(player.elapsed)).padStart(2, '0');
    const pb = $('#psPlay'); if (pb) pb.innerHTML = icon(player.playing ? 'pause' : 'play');
  }

  /* =========================================================
     Markup helpers
     ========================================================= */
  function balanceCard() {
    return '<section class="balance-card">' +
      '<div class="bal-top"><span class="bal-label">Available Balance</span><span class="bal-badge">NGN</span></div>' +
      '<div class="bal-amount">' + naira(state.balance) + '</div>' +
      '<div class="bal-foot"><div><small>Total earned</small><b>' + naira(state.total) + '</b></div>' +
      '<button class="bal-btn" data-action="withdraw">' + icon('wallet') + ' Withdraw</button></div>' +
      '</section>';
  }

  function coverHTML(s, big) {
    const meta = artMap[s.term] || {};
    const done = doneToday(s.id);
    return '<div class="cover ' + s.art + (big ? ' big' : '') + '">' +
      (meta.art ? '<img src="' + esc(meta.art) + '" alt="' + esc(s.title) + '" loading="lazy" onerror="this.remove()" />' : '') +
      '<span class="cover-shade"></span>' +
      (done
        ? '<span class="cover-done">' + icon('check') + '</span>'
        : '<button class="cover-play" data-action="play" data-id="' + s.id + '" aria-label="Play ' + esc(s.title) + '">' + icon('play') + '</button>') +
      '</div>';
  }

  function trackCard(s, big) {
    const done = doneToday(s.id);
    return '<article class="track' + (done ? ' done' : '') + (big ? ' big' : '') + '">' +
      coverHTML(s, big) +
      '<div class="t-info"><b>' + esc(s.title) + '</b><span>' + esc(s.artist) + '</span>' +
        '<span class="t-meta">' + naira(s.reward) + ' · ' + LISTEN_SECONDS + 's listen</span></div>' +
      '<div class="t-end">' + (done ? '<span class="t-done">' + icon('check') + '<small>Done</small></span>' : '<span class="t-reward">' + naira(s.reward) + '</span>') + '</div>' +
      '</article>';
  }

  function withdrawalStatus(ts) {
    return (Date.now() - ts) >= 2 * 86400000 ? 'Transferred' : 'Pending';
  }

  function activityHTML(list) {
    if (!list.length) return '<div class="empty">No activity yet. Play a track to start earning.</div>';
    return list.map((a) => {
      const earn = a.amount >= 0;
      const status = !earn ? withdrawalStatus(a.ts) : '';
      const badge = status ? ' <span class="act-status ' + (status === 'Transferred' ? 'ok' : 'pending') + '">' + status + '</span>' : '';
      return '<div class="act">' +
        '<span class="act-ic ' + (earn ? 'earn' : 'wd') + '">' + icon(earn ? 'music' : 'wallet') + '</span>' +
        '<div class="act-info"><b>' + (earn ? 'Earned ' : 'Withdrew ') + naira(Math.abs(a.amount)) + badge + '</b><span>' + esc(a.desc || '') + '</span></div>' +
        '<span class="act-time">' + relTime(a.ts) + '</span></div>';
    }).join('');
  }

  function withdrawalHTML() {
    const list = state.activity.filter((a) => a.amount < 0);
    const total = list.reduce((s, a) => s + Math.abs(a.amount), 0);
    const pending = list.filter((a) => withdrawalStatus(a.ts) === 'Pending').length;
    const done = list.length - pending;

    const summary = '<section class="card"><div class="wd-summary">' +
      '<div><span>Total withdrawn</span><b>' + naira(total) + '</b></div>' +
      '<div><span>Pending</span><b>' + pending + '</b></div>' +
      '<div><span>Transferred</span><b>' + done + '</b></div>' +
      '</div></section>';

    if (!list.length) return summary + '<div class="empty">No withdrawals yet.</div>';

    const rows = list.map((a) => {
      const status = withdrawalStatus(a.ts);
      const d = new Date(a.ts);
      const when = d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) + ' · ' +
        d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });
      const bank = String(a.desc || '').replace(/^Withdrawal to\s*/i, '');
      return '<div class="wd-item">' +
        '<span class="wd-ic">' + icon('wallet') + '</span>' +
        '<div class="wd-info"><b>' + naira(Math.abs(a.amount)) + '</b><span>' + esc(bank) + '</span></div>' +
        '<div class="wd-end"><span class="wd-date">' + esc(when) + '</span>' +
          '<span class="act-status ' + (status === 'Transferred' ? 'ok' : 'pending') + '">' + status + '</span></div>' +
        '</div>';
    }).join('');

    return summary + '<div class="wd-list">' + rows + '</div>';
  }

  function withdrawProgress() {
    const pct = Math.min(100, (state.balance / WITHDRAW_MIN) * 100);
    return '<section class="card">' +
      '<div class="row-between"><span>Withdrawal progress</span><b>' + naira(state.balance) + ' / ' + naira(WITHDRAW_MIN) + '</b></div>' +
      '<div class="meter"><span style="width:' + pct + '%"></span></div>' +
      '<p class="hint">' + (state.balance >= WITHDRAW_MIN ? 'Withdrawal unlocked.' : 'Earn ' + naira(WITHDRAW_MIN - state.balance) + ' more to unlock withdrawal.') + '</p>' +
      '</section>';
  }

  /* =========================================================
     Views
     ========================================================= */
  function heroBanner() {
    return '<section class="hero">' +
      '<div class="hero-copy"><span class="hero-eyebrow">Daily Music Pay</span>' +
      '<h1>Listen. Tap. Earn.</h1><p>3 fresh Nigerian tracks every day.</p></div>' +
      '<div class="hero-art"><span class="note n1">' + icon('music') + '</span><span class="note n2">' + icon('headphones') + '</span>' +
      '<span class="coin c1">₦</span><span class="coin c2">₦</span></div></section>';
  }

  function miniStats() {
    return '<div class="mini-row">' +
      '<div class="mini"><span>Total earned</span><b>' + naira(state.total) + '</b></div>' +
      '<div class="mini"><span>Songs played</span><b>' + state.songsPlayed + '</b></div>' +
      '<div class="mini"><span>Today</span><b>' + naira(state.today.earn) + '</b></div>' +
      '</div>';
  }

  function viewHome() {
    const tracks = dailySongs();
    return heroBanner() + balanceCard() + miniStats() + withdrawProgress() +
      '<div class="quick-row">' +
        '<button class="quick" data-tab="tasks"><span class="q-ic purple">' + icon('music') + '</span>Daily Tasks</button>' +
        '<button class="quick" data-action="withdraw"><span class="q-ic teal">' + icon('wallet') + '</span>Withdraw</button>' +
        '<button class="quick" data-tab="wallet"><span class="q-ic pink">' + icon('receipt') + '</span>History</button>' +
      '</div>' +
      '<div class="sec-head"><h2>Today\u2019s Music Tasks</h2><span class="pill">' + doneCount() + '/' + DAILY_SONG_COUNT + '</span></div>' +
      '<div class="tracks">' + tracks.map((s) => trackCard(s)).join('') + '</div>' +
      '<div class="sec-head"><h2>Recent Activity</h2>' + (state.activity.length ? '<a href="#wallet" data-tab="wallet">See all</a>' : '') + '</div>' +
      '<div class="activity">' + activityHTML(state.activity.slice(0, 3)) + '</div>';
  }

  function viewTasks() {
    const tracks = dailySongs();
    const dc = doneCount();
    const p = (dc / DAILY_SONG_COUNT) * 360;
    return '<div class="page-head"><h1>Daily Music Tasks</h1><p>Listen to each track for ' + LISTEN_SECONDS + 's to earn ' + naira(SONG_REWARD) + ' each.</p></div>' +
      '<section class="card track-progress"><div class="ring" style="--p:' + p + 'deg"><span>' + dc + '/' + DAILY_SONG_COUNT + '</span></div>' +
        '<div><b>' + (dc === DAILY_SONG_COUNT ? 'All done for today!' : 'Keep listening') + '</b>' +
        '<p class="muted">' + (dc === DAILY_SONG_COUNT ? 'New tracks unlock at midnight.' : 'Complete all ' + DAILY_SONG_COUNT + ' to make ' + naira(SONG_REWARD * DAILY_SONG_COUNT) + ' today.') + '</p></div></section>' +
      '<div class="tracks">' + tracks.map((s) => trackCard(s, true)).join('') + '</div>' +
      '<p class="note">New tracks unlock every day at midnight.</p>';
  }

  function viewWallet() {
    return '<div class="page-head"><h1>Wallet</h1><p>Withdraw funds and track your withdrawals.</p></div>' +
      balanceCard() +
      withdrawProgress() +
      '<button class="btn-primary full" data-action="withdraw" style="margin-bottom:16px">' + icon('wallet') + ' Withdraw Funds</button>' +
      '<div class="sec-head"><h2>Withdrawal History</h2></div>' +
      withdrawalHTML();
  }

  function viewProfile() {
    const bank = state.bank || {};
    const since = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })
      : '—';
    const linked = !!(bank.bank && bank.account);
    return '<div class="page-head"><h1>Profile</h1><p>Your account, payout and preferences.</p></div>' +

      '<section class="profile-hero">' +
        '<div class="ph-cover"></div>' +
        '<div class="ph-avatar-wrap"><span class="avatar xl">' + esc(initials()) + '</span><span class="ph-badge">' + icon('check') + '</span></div>' +
        '<div class="ph-name">' + esc(user.name || 'Member') + '</div>' +
        '<div class="ph-mail">' + esc(user.email || '') + '</div>' +
        '<div class="ph-pills"><span class="ph-pill">' + icon('calendar') + ' Member since ' + since + '</span>' +
          '<span class="ph-pill accent">' + icon('shield') + ' Active</span></div>' +
      '</section>' +

      '<div class="mini-row profile-stats">' +
        '<div class="mini"><span>Total earned</span><b>' + naira(state.total) + '</b></div>' +
        '<div class="mini"><span>Songs played</span><b>' + state.songsPlayed + '</b></div>' +
        '<div class="mini"><span>Balance</span><b>' + naira(state.balance) + '</b></div>' +
      '</div>' +

      '<section class="card"><h2 class="card-title">Account</h2>' +
        '<div class="info-row"><span class="info-ic">' + icon('user') + '</span><div><span>Full name</span><b>' + esc(user.name || '—') + '</b></div></div>' +
        '<div class="info-row"><span class="info-ic">' + icon('shield') + '</span><div><span>Email</span><b>' + esc(user.email || '—') + '</b></div></div>' +
        '<div class="info-row"><span class="info-ic">' + icon('calendar') + '</span><div><span>Member since</span><b>' + since + '</b></div></div>' +
      '</section>' +

      '<section class="card">' +
        '<div class="row-between" style="margin:0 0 12px"><h2 class="card-title" style="margin:0">Payout Account</h2>' +
          (linked ? '<span class="verified">' + icon('check') + ' Linked</span>' : '<span class="pill">Not set</span>') + '</div>' +
        '<form id="bankForm" novalidate>' +
          '<div class="field bank-field"><span>Bank</span>' +
            '<input class="input" id="bankSearch" placeholder="Search or select your bank" autocomplete="off" value="' + esc(bank.bank || '') + '" />' +
            '<input type="hidden" name="bank" id="bankCode" value="' + esc(bank.code || '') + '" />' +
            '<div class="bank-dropdown" id="bankDropdown"></div>' +
          '</div>' +
          '<label class="field"><span>Account number</span><input class="input" name="account" inputmode="numeric" maxlength="10" placeholder="10-digit account number" value="' + esc(bank.account || '') + '" /><em class="err"></em></label>' +
          '<div class="acct-status" id="acctStatus"></div>' +
          '<label class="field"><span>Account name</span><input class="input" name="acctName" placeholder="Auto-verified name" value="' + esc(bank.name || '') + '" readonly title="Verified automatically" /><em class="err"></em></label>' +
          '<button class="btn-primary full" type="submit">' + icon('bank') + ' Save Account</button>' +
        '</form></section>' +

      '<section class="card"><h2 class="card-title">Session</h2>' +
        '<button class="btn-ghost full" data-action="logout">' + icon('logout') + ' Log out</button>' +
        '<button class="btn-danger full" data-action="reset" style="margin-top:10px">Reset wallet data</button></section>';
  }

  const VIEWS = { home: viewHome, tasks: viewTasks, wallet: viewWallet, profile: viewProfile };
  let current = 'home';

  let banksCache = null;
  let verifyTimer = null;
  let verifiedAccount = null;

  async function populateBanks() {
    if (!document.getElementById('bankSearch')) return;
    if (!banksCache) {
      try {
        const r = await fetch('/api/banks');
        const j = await r.json();
        const arr = j && j.banks ? j.banks.map((b) => ({ name: b.bank_name || b.name, code: b.code })) : [];
        if (arr.length) banksCache = arr;
      } catch (e) { /* ignore */ }
    }
    const dd = document.getElementById('bankDropdown');
    if (dd && dd.classList.contains('open')) renderBankDropdown();
  }

  function renderBankDropdown() {
    const dd = document.getElementById('bankDropdown');
    if (!dd) return;
    if (!banksCache) { dd.innerHTML = '<div class="bank-empty">Loading banks…</div>'; dd.classList.add('open'); return; }
    const search = document.getElementById('bankSearch');
    const q = search ? search.value : '';
    const needle = q.trim().toLowerCase();
    const list = banksCache.filter((b) => !needle || b.name.toLowerCase().indexOf(needle) !== -1 || String(b.code).indexOf(needle) !== -1).slice(0, 80);
    if (!list.length) { dd.innerHTML = '<div class="bank-empty">No bank matches "' + esc(q) + '"</div>'; dd.classList.add('open'); return; }
    dd.innerHTML = list.map((b) => '<div class="bank-item" data-code="' + esc(b.code) + '" data-name="' + esc(b.name) + '">' + esc(b.name) + '</div>').join('');
    dd.classList.add('open');
  }

  function selectBank(code, name) {
    const s = document.getElementById('bankSearch');
    const c = document.getElementById('bankCode');
    if (s) s.value = name;
    if (c) c.value = code;
    verifiedAccount = null;
    const nm = document.querySelector('#bankForm [name="acctName"]');
    if (nm) nm.value = '';
    const dd = document.getElementById('bankDropdown');
    if (dd) dd.classList.remove('open');
    const form = document.getElementById('bankForm');
    if (form) scheduleVerify(form);
  }

  function scheduleVerify(form) {
    clearTimeout(verifyTimer);
    verifyTimer = setTimeout(() => verifyAccount(form), 450);
  }

  async function verifyAccount(form) {
    const status = document.getElementById('acctStatus');
    const code = form.bank.value;
    const acct = form.account.value;
    const nm = document.querySelector('#bankForm [name="acctName"]');
    if (!status) return;
    if (acct.length !== 10 || !code) { status.textContent = ''; status.className = 'acct-status'; verifiedAccount = null; if (nm) nm.value = ''; return; }
    verifiedAccount = null;
    if (nm) nm.value = '';
    status.textContent = 'Verifying account…'; status.className = 'acct-status verifying';
    try {
      const r = await fetch('/api/resolve?acc_no=' + encodeURIComponent(acct) + '&bank=' + encodeURIComponent(code));
      const j = await r.json();
      const name = j && j.ok && j.result && j.result[0] && j.result[0].account_name;
      if (name) {
        verifiedAccount = { code, account: acct, name };
        if (nm) nm.value = name;
        status.textContent = '✓ ' + name; status.className = 'acct-status ok';
        state.bank = { bank: document.getElementById('bankSearch').value.trim(), code, name, account: acct, verified: true };
        save();
      } else {
        status.textContent = (j && (j.detail || j.message || j.error)) || 'Could not verify this account.'; status.className = 'acct-status err';
      }
    } catch (e) {
      status.textContent = 'Verification unavailable. Try again.'; status.className = 'acct-status err';
    }
  }

  function render(tab, keepScroll) {
    if (!VIEWS[tab]) tab = 'home';
    current = tab;
    const root = $('#view');
    if (!root) return;
    root.innerHTML = VIEWS[tab]();
    if (tab === 'profile') populateBanks();
    $$('.tabs a').forEach((a) => a.classList.toggle('active', a.dataset.tab === tab));
    updatePlayer();
    if (!keepScroll) window.scrollTo({ top: 0 });
  }

  function go(tab) {
    if (location.hash === '#' + tab) render(tab);
    else location.hash = tab;
  }

  /* =========================================================
     Withdraw
     ========================================================= */
  function openWithdraw() {
    const bank = state.bank || {};
    if (!bank.bank || !/^\d{10}$/.test(bank.account || '')) {
      feedback({
        type: 'info',
        title: 'Add a payout account',
        message: 'Withdrawals only go to your saved bank account. Add and verify it in your Profile first.',
        button: 'Go to Profile',
        onOk: () => go('profile')
      });
      return;
    }
    if (state.balance < WITHDRAW_MIN) {
      feedback({ type: 'info', title: 'Withdrawal locked', message: 'Withdrawals unlock at ' + naira(WITHDRAW_MIN) + '. Keep listening to earn more.' });
      return;
    }
    const form = $('#withdrawForm');
    if (!form) return;
    form.reset();
    $$('.err', form).forEach((e) => (e.textContent = ''));
    $('#wdAvail').textContent = naira(state.balance);
    const note = $('#wdAccountNote');
    if (note) note.innerHTML = '<span>' + esc(bank.bank) + ' <b>••••' + esc(bank.account.slice(-4)) + '</b></span>' +
      '<a href="#profile" data-tab="profile">Change</a>';
    const amounts = [100000, 200000, 500000, state.balance].filter((v, i, a) => v >= WITHDRAW_MIN && v <= state.balance && a.indexOf(v) === i);
    $('#quickAmounts').innerHTML = amounts.map((v) => '<button type="button" class="chip" data-amt="' + v + '">' + (v === state.balance ? 'Max' : naira(v)) + '</button>').join('');
    $('#withdrawModal').classList.add('open');
  }

  function closeWithdraw() { const m = $('#withdrawModal'); if (m) m.classList.remove('open'); }

  function submitWithdraw(e) {
    e.preventDefault();
    const bank = state.bank || {};
    const form = e.target;
    const amount = Math.floor(+form.amount.value);
    const err = !amount ? 'Enter an amount.' : amount < WITHDRAW_MIN ? 'Minimum withdrawal is ' + naira(WITHDRAW_MIN) + '.' : amount > state.balance ? 'More than your available balance.' : '';
    const field = form.amount.closest('.field');
    if (field) { const el = field.querySelector('.err'); if (el) el.textContent = err; }
    if (err) return;

    if (!bank.bank || !/^\d{10}$/.test(bank.account || '')) {
      closeWithdraw();
      feedback({ type: 'info', title: 'Add a payout account', message: 'Add and verify your bank account in Profile before withdrawing.', button: 'Go to Profile', onOk: () => go('profile') });
      return;
    }

    state.balance -= amount;
    state.activity.unshift({ type: 'withdraw', desc: 'Withdrawal to ' + bank.bank + ' ••••' + bank.account.slice(-4), amount: -amount, ts: Date.now(), status: 'Pending' });
    save();
    closeWithdraw();
    feedback({ title: 'Withdrawal pending', message: 'Your withdrawal of ' + naira(amount) + ' is pending. It will be sent to ' + bank.account + ' - ' + bank.bank + ' when it has been resolved.' });
    render(current);
  }

  /* =========================================================
     Events
     ========================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    const av = $('#topAvatar'); if (av) av.textContent = initials();
    const gn = $('#greetName'); if (gn) gn.textContent = firstName();
    const pb = $('#profileBtn'); if (pb) pb.addEventListener('click', () => go('profile'));
    const bb = $('#bellBtn'); if (bb) bb.addEventListener('click', () => go('wallet'));
    const ps = $('#psPlay'); if (ps) ps.addEventListener('click', togglePlayer);
    const pcl = $('#psClose'); if (pcl) pcl.addEventListener('click', stopSong);

    document.addEventListener('click', (e) => {
      const bankItem = e.target.closest && e.target.closest('#bankDropdown [data-code]');
      if (bankItem) { e.preventDefault(); selectBank(bankItem.dataset.code, bankItem.dataset.name); return; }

      if (!(e.target.closest && e.target.closest('.bank-field'))) { const dd = $('#bankDropdown'); if (dd) dd.classList.remove('open'); }

      const tabEl = e.target.closest('[data-tab]');
      if (tabEl) { e.preventDefault(); closeWithdraw(); go(tabEl.dataset.tab); return; }

      const amtEl = e.target.closest('[data-amt]');
      if (amtEl) { const inp = $('#withdrawForm [name="amount"]'); if (inp) inp.value = amtEl.dataset.amt; return; }

      if ((e.target.closest && e.target.closest('[data-close]')) || e.target.id === 'withdrawModal') { closeWithdraw(); return; }

      const el = e.target.closest('[data-action]');
      if (!el) return;
      const action = el.dataset.action;
      if (action === 'play') playSong(el.dataset.id);
      else if (action === 'withdraw') openWithdraw();
      else if (action === 'logout') { stopSong(); Auth.logout(); location.href = 'index.html'; }
      else if (action === 'reset') {
        if (confirm('Reset your balance, music tasks and activity to zero?')) {
          stopSong(); state = defaultState(); save(); render(current);
          feedback({ title: 'Wallet reset', message: 'Your balance, tracks and activity have been cleared.' });
        }
      }
    });

    document.addEventListener('submit', (e) => {
      if (e.target.id === 'withdrawForm') return submitWithdraw(e);
      e.preventDefault();
      if (e.target.id === 'bankForm') {
        const f = e.target;
        const code = f.bank.value;
        const bankName = (document.getElementById('bankSearch') ? document.getElementById('bankSearch').value.trim() : '') || (state.bank && state.bank.bank) || 'Bank';
        const acct = f.account.value;
        if (!code) { feedback({ type: 'error', title: 'Bank required', message: 'Please select your bank.' }); return; }
        if (!/^\d{10}$/.test(acct)) { feedback({ type: 'error', title: 'Invalid account', message: 'Account number must be 10 digits.' }); return; }
        const fresh = verifiedAccount && verifiedAccount.code === code && verifiedAccount.account === acct;
        const savedOk = state.bank && state.bank.verified && state.bank.code === code && state.bank.account === acct && state.bank.name;
        if (!fresh && !savedOk) { feedback({ type: 'error', title: 'Account not verified', message: 'Wait for the account name to be verified automatically, then save.' }); return; }
        const holder = fresh ? verifiedAccount.name : state.bank.name;
        state.bank = { bank: bankName, code, name: holder, account: acct, verified: true };
        save();
        feedback({ title: 'Account linked', message: bankName + ' ••••' + acct.slice(-4) + ' — ' + holder });
        render('profile', true);
      }
    });

    document.addEventListener('input', (e) => {
      if (e.target.id === 'bankSearch') {
        const c = document.getElementById('bankCode'); if (c) c.value = '';
        verifiedAccount = null;
        const nm = document.querySelector('#bankForm [name="acctName"]'); if (nm) nm.value = '';
        renderBankDropdown();
        return;
      }
      const f = e.target.closest && e.target.closest('#bankForm');
      if (!f) return;
      if (e.target.name === 'account') {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
        verifiedAccount = null;
        const nm = document.querySelector('#bankForm [name="acctName"]'); if (nm) nm.value = '';
        scheduleVerify(f);
      }
    });

    document.addEventListener('focusin', (e) => {
      if (e.target.id === 'bankSearch') renderBankDropdown();
    });

    document.addEventListener('change', (e) => {
      if (e.target.id === 'muteToggle') { state.muted = e.target.checked; synth.setMuted(state.muted); save(); }
    });

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeWithdraw(); });
    window.addEventListener('hashchange', () => render((location.hash || '#home').slice(1)));
    render((location.hash || '#home').slice(1));
    loadArtwork(dailySongs());
  });
})();
