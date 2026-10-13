/* brok.enstrokes portfolio
   Reads data/works.json (your pieces) and data/site.json (name, about, contact).
   You never need to edit this file to add sketches: use /admin instead. */
(function () {
  'use strict';

  var CFG = window.SITE_CONFIG || {};

  var CATS = [
    { id: 'sketches',  label: 'Sketches',  icon: 'pencil',   blurb: 'Observational drawings and studies from my sketchbook.' },
    { id: 'scribbles', label: 'Scribbles', icon: 'scribble', blurb: 'Loose doodles and quick experiments.' },
    { id: 'stickers',  label: 'Stickers',  icon: 'sticker',  blurb: 'Little designs made to be printed and stuck on things.' },
    { id: 'process',   label: 'Process',   icon: 'process',  blurb: 'Behind the scenes: how the drawings come together.' }
  ];
  var CAT_IDS = {};
  CATS.forEach(function (c) { CAT_IDS[c.id] = c; });

  var ICONS = {
    pencil:   '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
    scribble: '<path d="M3 14c2-6 4-6 5-2s2 6 4 1 2-9 4-4 2 6 5 1"/>',
    sticker:  '<path d="M5 3h14a2 2 0 012 2v9l-7 7H5a2 2 0 01-2-2V5a2 2 0 012-2z"/><path d="M14 21v-5a2 2 0 012-2h5"/>',
    process:  '<circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>',
    user:     '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    left:     '<path d="M15 18l-6-6 6-6"/>',
    menu:     '<path d="M4 6h16M4 12h16M4 18h16"/>',
    heart:    '<path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z"/>',
    image:    '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="1.6"/><path d="M21 16l-5-5-9 10"/>'
  };

  var state = { site: {}, works: [], sort: 'latest', list: [] };
  var view = document.getElementById('view');
  var app = document.getElementById('app');

  /* ---------- tiny helpers ---------- */

  function el(tag, props) {
    var n = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else if (k.indexOf('on') === 0) n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v === true ? '' : v);
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var kid = arguments[i];
      if (kid === null || kid === undefined || kid === false) continue;
      n.appendChild(typeof kid === 'object' ? kid : document.createTextNode(String(kid)));
    }
    return n;
  }

  function icon(name) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '1.8');
    s.setAttribute('stroke-linecap', 'round');
    s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = ICONS[name] || '';
    return s;
  }

  function lsGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function lsSet(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* private mode: ignore */ } }

  function imgSrc(w) {
    if (!w.image) return '';
    if (/^https?:\/\//i.test(w.image)) return w.image;
    return String(w.image).replace(/^\/+/, '');
  }
  function workKey(w) { return imgSrc(w) || (w.category + ':' + w.title); }

  function safeUrl(u) {
    try {
      var x = new URL(u, location.href);
      return ['http:', 'https:', 'mailto:'].indexOf(x.protocol) !== -1 ? x.href : null;
    } catch (e) { return null; }
  }

  function fmt(n) { return n >= 1000 ? (Math.round(n / 100) / 10) + 'k' : String(n); }

  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 3600);
  }

  /* ---------- likes ---------- */

  var LS_LIKED = 'brok-liked-v1';
  var liked = {};
  try { (JSON.parse(lsGet(LS_LIKED) || '[]')).forEach(function (k) { liked[k] = true; }); } catch (e) { /* ignore */ }

  var remote = !!(CFG.supabaseUrl && CFG.supabaseKey && !/PASTE_/i.test(CFG.supabaseUrl + CFG.supabaseKey));
  var base = remote ? String(CFG.supabaseUrl).replace(/\/+$/, '') : '';
  var counts = {};
  var busy = {};

  function saveLiked() { lsSet(LS_LIKED, JSON.stringify(Object.keys(liked))); }
  function countOf(k) { return counts[k] || 0; }

  function sbHeaders() {
    var h = { 'apikey': CFG.supabaseKey, 'Content-Type': 'application/json' };
    if (/^eyJ/.test(CFG.supabaseKey)) h['Authorization'] = 'Bearer ' + CFG.supabaseKey;
    return h;
  }

  function paintLike(btn) {
    var k = btn.getAttribute('data-key');
    var on = !!liked[k];
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    var c = btn.querySelector('.count');
    if (c) c.textContent = fmt(countOf(k));
  }
  function paintAllLikes(key) {
    var btns = document.querySelectorAll('.like[data-key]');
    for (var i = 0; i < btns.length; i++) {
      if (!key || btns[i].getAttribute('data-key') === key) paintLike(btns[i]);
    }
  }

  function likeButton(key, extraClass) {
    var b = el('button', { type: 'button', class: 'like ' + (extraClass || ''), 'data-key': key, 'aria-pressed': 'false', 'aria-label': 'Like this piece' },
      icon('heart'), el('span', { class: 'count', text: '0' }));
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleLike(key, false);
      b.classList.add('pop');
      setTimeout(function () { b.classList.remove('pop'); }, 400);
    });
    paintLike(b);
    return b;
  }

  function loadCounts() {
    if (!remote) {
      state.works.forEach(function (w) { var k = workKey(w); counts[k] = liked[k] ? 1 : 0; });
      paintAllLikes();
      return;
    }
    fetch(base + '/rest/v1/likes?select=work_key,count', { headers: sbHeaders() })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (rows) {
        rows.forEach(function (row) { counts[row.work_key] = row.count; });
        paintAllLikes();
        if (state.sort === 'liked') route(); // re-sort once real numbers arrive
      })
      .catch(function () { /* counts stay at 0; the site still works */ });
  }

  function applyLike(k, on, count) {
    if (on) liked[k] = true; else delete liked[k];
    saveLiked();
    counts[k] = count;
    paintAllLikes(k);
  }

  function toggleLike(k, onlyAdd) {
    if (busy[k]) return;
    var was = !!liked[k];
    if (onlyAdd && was) return;
    var delta = was ? -1 : 1;
    applyLike(k, !was, Math.max(0, countOf(k) + delta));
    if (!remote) return;
    busy[k] = true;
    fetch(base + '/rest/v1/rpc/change_like', {
      method: 'POST',
      headers: sbHeaders(),
      body: JSON.stringify({ p_key: k, p_delta: delta })
    })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (n) { if (typeof n === 'number') { counts[k] = n; paintAllLikes(k); } })
      .catch(function () {
        applyLike(k, was, Math.max(0, countOf(k) - delta));
        toast("Couldn't save your like. Please try again.");
      })
      .then(function () { delete busy[k]; });
  }

  /* ---------- sidebar ---------- */

  function renderNav() {
    var nav = document.getElementById('nav');
    var bottom = document.getElementById('sidebarBottom');
    var current = currentId();
    nav.replaceChildren.apply(nav, CATS.map(function (c) {
      var n = state.works.filter(function (w) { return w.category === c.id; }).length;
      return el('a', { class: 'nav-item' + (current === c.id ? ' active' : ''), href: '#' + c.id, title: c.label },
        icon(c.icon), el('span', { class: 'label', text: c.label }), el('span', { class: 'badge', text: String(n) }));
    }));

    var collapseBtn = el('button', { class: 'nav-item subtle', id: 'collapseBtn', type: 'button', title: 'Collapse menu' },
      icon('left'), el('span', { class: 'label', text: 'Collapse' }));
    collapseBtn.addEventListener('click', function () {
      app.classList.toggle('collapsed');
      lsSet('brok-collapsed', app.classList.contains('collapsed') ? '1' : '0');
    });
    bottom.replaceChildren(
      el('a', { class: 'nav-item subtle' + (current === 'about' ? ' active' : ''), href: '#about', title: 'About & contact' },
        icon('user'), el('span', { class: 'label', text: 'About & contact' })),
      collapseBtn
    );
  }

  function applySite() {
    var s = state.site;
    var name = s.name || 'brok.enstrokes';
    document.getElementById('brandName').textContent = name;
    document.getElementById('mobileName').textContent = name;
    document.getElementById('brandRole').textContent = s.role || 'Illustrator';
    document.getElementById('logo').textContent = name.charAt(0).toUpperCase();
  }

  /* ---------- views ---------- */

  function currentId() {
    var id = (location.hash || '#sketches').slice(1);
    return id === 'about' || CAT_IDS[id] ? id : 'sketches';
  }

  function makeCard(w, index) {
    var key = workKey(w);
    var src = imgSrc(w);
    var thumb = el('button', { class: 'thumb' + (src ? '' : ' no-img'), type: 'button', 'aria-label': src ? 'Open ' + w.title : null });

    function placeholder() {
      thumb.classList.add('no-img');
      thumb.appendChild(el('div', { class: 'ph' }, icon('image'), el('span', { text: w.title })));
    }
    if (src) {
      var img = el('img', { src: src, alt: w.title, loading: 'lazy', decoding: 'async' });
      img.addEventListener('error', function () { img.remove(); placeholder(); });
      thumb.appendChild(img);
      // One tap opens the big view; a quick double tap likes it (like Instagram).
      var tapTimer = null;
      thumb.addEventListener('click', function () {
        if (tapTimer) {
          clearTimeout(tapTimer);
          tapTimer = null;
          var heart = icon('heart');
          heart.setAttribute('class', 'burst');
          thumb.appendChild(heart);
          setTimeout(function () { heart.remove(); }, 850);
          toggleLike(key, true);
          return;
        }
        tapTimer = setTimeout(function () { tapTimer = null; openLightbox(index); }, 260);
      });
    } else {
      placeholder();
    }

    var meta = [w.medium, w.year].filter(Boolean).join(', ');
    return el('article', { class: 'card' },
      thumb,
      el('div', { class: 'card-foot' },
        el('div', { class: 'card-info' }, el('h3', { text: w.title }), el('p', { text: meta })),
        likeButton(key)
      )
    );
  }

  function renderGallery(cat) {
    var items = state.works.filter(function (w) { return w.category === cat.id; });
    var list = items.slice();
    if (state.sort === 'liked') {
      list = list
        .map(function (w, i) { return { w: w, i: i }; })
        .sort(function (a, b) { return (countOf(workKey(b.w)) - countOf(workKey(a.w))) || (a.i - b.i); })
        .map(function (x) { return x.w; });
    }
    state.list = list;

    var select = el('select', { class: 'sort', 'aria-label': 'Sort pieces' },
      el('option', { value: 'latest', text: 'Latest first' }),
      el('option', { value: 'liked', text: 'Most liked' }));
    select.value = state.sort;
    select.addEventListener('change', function () { state.sort = select.value; route(); });

    var head = el('div', { class: 'page-head' },
      el('div', null, el('h1', { text: cat.label }), el('p', { class: 'blurb', text: cat.blurb })),
      el('div', { class: 'head-tools' },
        el('span', { text: items.length + (items.length === 1 ? ' piece' : ' pieces') }),
        items.length > 1 ? select : null));

    var body = items.length
      ? el.apply(null, ['div', { class: 'grid' }].concat(list.map(makeCard)))
      : el('p', { class: 'empty', text: 'Nothing here yet. New pieces are coming soon.' });

    view.replaceChildren(head, body);
    document.title = cat.label + ' — ' + (state.site.name || 'brok.enstrokes');
  }

  function contactLink(label, href) {
    var safe = safeUrl(href);
    return safe ? el('li', null, el('a', { href: safe, target: '_blank', rel: 'noopener noreferrer', text: label })) : null;
  }

  function renderAbout() {
    var s = state.site;
    var links = [];
    if (s.email) links.push(contactLink('Email', 'mailto:' + s.email));
    if (s.instagram) {
      var ig = /^https?:\/\//i.test(s.instagram) ? s.instagram : 'https://instagram.com/' + String(s.instagram).replace(/^@/, '');
      links.push(contactLink('Instagram', ig));
    }
    if (s.website) links.push(contactLink('Website', s.website));
    links = links.filter(Boolean);

    view.replaceChildren(
      el('div', { class: 'page-head' }, el('div', null, el('h1', { text: 'About & contact' }))),
      el('div', { class: 'about' },
        el('p', { text: s.about || '' }),
        links.length ? el.apply(null, ['ul', { class: 'contact-list' }].concat(links)) : null)
    );
    document.title = 'About — ' + (s.name || 'brok.enstrokes');
  }

  function showLoadError() {
    view.replaceChildren(el('div', { class: 'notice' },
      el('strong', { text: "Couldn't load the artwork list." }),
      el('span', { text: 'If you opened index.html by double-clicking it, your browser blocks loading data files that way. ' +
        'Open the folder in VS Code and use the "Live Server" extension, or just view the published website.' })));
  }

  function route() {
    var id = currentId();
    renderNav();
    if (id === 'about') renderAbout(); else renderGallery(CAT_IDS[id]);
    paintAllLikes();
    window.scrollTo(0, 0);
    app.classList.remove('menu-open');
  }

  /* ---------- lightbox ---------- */

  var lb = document.getElementById('lightbox');
  var lbIndex = 0, lastFocus = null;

  function lbItems() { return state.list.filter(function (w) { return imgSrc(w); }); }

  function showLightbox(i) {
    var items = lbItems();
    if (!items.length) return;
    lbIndex = (i + items.length) % items.length;
    var w = items[lbIndex];
    var img = document.getElementById('lbImg');
    img.src = imgSrc(w);
    img.alt = w.title;
    document.getElementById('lbTitle').textContent = w.title;
    document.getElementById('lbMeta').textContent = [w.medium, w.year].filter(Boolean).join(', ');
    var b = document.getElementById('lbLike');
    b.setAttribute('data-key', workKey(w));
    paintLike(b);
    var multiple = items.length > 1;
    document.getElementById('lbPrev').hidden = !multiple;
    document.getElementById('lbNext').hidden = !multiple;
  }

  function openLightbox(cardIndex) {
    var w = state.list[cardIndex];
    var items = lbItems();
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    showLightbox(Math.max(0, items.indexOf(w)));
    document.getElementById('lbClose').focus();
  }

  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function initLightbox() {
    var b = document.getElementById('lbLike');
    b.appendChild(icon('heart'));
    b.appendChild(el('span', { class: 'count', text: '0' }));
    b.addEventListener('click', function () {
      toggleLike(b.getAttribute('data-key'), false);
      b.classList.add('pop');
      setTimeout(function () { b.classList.remove('pop'); }, 400);
    });
    document.getElementById('lbClose').addEventListener('click', closeLightbox);
    document.getElementById('lbPrev').addEventListener('click', function () { showLightbox(lbIndex - 1); });
    document.getElementById('lbNext').addEventListener('click', function () { showLightbox(lbIndex + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') showLightbox(lbIndex - 1);
      else if (e.key === 'ArrowRight') showLightbox(lbIndex + 1);
    });
  }

  /* ---------- start ---------- */

  function getJSON(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(path + ' ' + r.status);
      return r.json();
    });
  }

  function init() {
    document.getElementById('menuBtn').appendChild(icon('menu'));
    document.getElementById('menuBtn').addEventListener('click', function () { app.classList.add('menu-open'); });
    document.getElementById('scrim').addEventListener('click', function () { app.classList.remove('menu-open'); });
    if (lsGet('brok-collapsed') === '1') app.classList.add('collapsed');
    initLightbox();

    Promise.all([
      getJSON('data/site.json').catch(function () { return {}; }),
      getJSON('data/works.json')
    ]).then(function (res) {
      state.site = res[0] || {};
      state.works = ((res[1] && res[1].works) || []).filter(function (w) { return w && w.title && CAT_IDS[w.category]; });
      applySite();
      route();
      loadCounts();
      window.addEventListener('hashchange', route);
    }).catch(function () {
      renderNav();
      showLoadError();
    });
  }

  init();
})();
