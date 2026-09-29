// Shared progressive enhancements. Guides and navigation links work without JavaScript.
(function () {
  'use strict';
  // Keep the head's gtag queue available immediately, but let rendering/resources
  // finish before fetching Analytics. The deadline also covers a slow window load.
  var analyticsRequested = false;
  var analyticsDeadline;
  var analyticsIdle;
  function loadAnalytics() {
    if (analyticsRequested) return;
    analyticsRequested = true;
    window.clearTimeout(analyticsDeadline);
    if (analyticsIdle && window.cancelIdleCallback) window.cancelIdleCallback(analyticsIdle);
    window.removeEventListener('load', scheduleAnalytics);
    document.removeEventListener('visibilitychange', flushAnalytics);
    if (document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]')) return;
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-EEVCE53BZW';
    document.head.appendChild(script);
  }
  function scheduleAnalytics() {
    if (analyticsRequested) return;
    if ('requestIdleCallback' in window) {
      analyticsIdle = window.requestIdleCallback(loadAnalytics, { timeout: 1000 });
    } else {
      window.setTimeout(loadAnalytics, 0);
    }
  }
  function flushAnalytics() {
    if (document.visibilityState === 'hidden') loadAnalytics();
  }
  analyticsDeadline = window.setTimeout(loadAnalytics, 2000);
  document.addEventListener('visibilitychange', flushAnalytics);
  if (document.readyState === 'complete') scheduleAnalytics();
  else window.addEventListener('load', scheduleAnalytics, { once: true });

  var toggle = document.querySelector('.nav-toggle');
  var mobileNav = document.querySelector('.mobile-nav');
  var header = document.querySelector('.site-header');
  function closeNav(restoreFocus) {
    if (!toggle || !mobileNav) return;
    mobileNav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    if (restoreFocus) toggle.focus();
  }
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      var open = !mobileNav.classList.contains('is-open');
      // Read before changing menu/ARIA state, which invalidates styles.
      var bottom = open ? header.getBoundingClientRect().bottom : 0;
      if (open) mobileNav.style.setProperty('--nav-bottom', bottom + 'px');
      mobileNav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (open) mobileNav.querySelector('.mobile-close').focus();
    });
    mobileNav.querySelector('.mobile-close').addEventListener('click', function () { closeNav(true); });
    mobileNav.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab') return;
      var controls = Array.from(mobileNav.querySelectorAll('a, button, summary')).filter(function (el) { return el.getClientRects().length > 0; });
      var first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    document.addEventListener('click', function (event) {
      if (mobileNav.classList.contains('is-open') && !mobileNav.contains(event.target) && !toggle.contains(event.target)) closeNav();
    });
    mobileNav.addEventListener('click', function (event) { if (event.target.closest('a')) closeNav(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 960) closeNav(); });
    window.addEventListener('scroll', function () {
      if (mobileNav.classList.contains('is-open')) mobileNav.style.setProperty('--nav-bottom', header.getBoundingClientRect().bottom + 'px');
    }, { passive: true });
  }
  function setDropdown(button, open) {
    button.setAttribute('aria-expanded', String(open));
    button.parentElement.classList.toggle('is-open', open);
    button.parentElement.classList.toggle('is-closed', !open);
  }
  var dropdownButtons = document.querySelectorAll('.dropdown-toggle');
  dropdownButtons.forEach(function (button) {
    var item = button.parentElement;
    button.addEventListener('click', function () {
      var open = button.getAttribute('aria-expanded') !== 'true';
      dropdownButtons.forEach(function (other) { setDropdown(other, other === button && open); });
    });
    item.addEventListener('mouseenter', function () { if (window.matchMedia('(hover: hover)').matches) setDropdown(button, true); });
    item.addEventListener('mouseleave', function () { if (!item.contains(document.activeElement)) setDropdown(button, false); });
    item.addEventListener('focusout', function (event) { if (!item.contains(event.relatedTarget)) setDropdown(button, false); });
    button.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown') { event.preventDefault(); setDropdown(button, true); item.querySelector('.dropdown a').focus(); }
    });
  });
  document.addEventListener('click', function (event) {
    dropdownButtons.forEach(function (button) { if (!button.parentElement.contains(event.target)) setDropdown(button, false); });
  });
  document.querySelectorAll('nav a[href]').forEach(function (link) {
    if (link.getAttribute('href') === window.location.pathname) link.setAttribute('aria-current', 'page');
  });
  var dialog = document.getElementById('search-dialog');
  var searchButton = document.querySelector('.header-search');
  if (dialog && searchButton) {
    searchButton.addEventListener('click', function () { closeNav(); dialog.showModal(); dialog.querySelector('input').focus(); });
    dialog.querySelector('.search-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (event) {
      if (event.target !== dialog) return;
      var rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  }
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      if (mobileNav && mobileNav.classList.contains('is-open')) closeNav(true);
      document.querySelectorAll('.has-dropdown').forEach(function (item) {
        if (item.contains(document.activeElement)) item.querySelector('button').focus();
        item.classList.remove('is-open'); item.classList.add('is-closed');
        item.querySelector('button').setAttribute('aria-expanded', 'false');
      });
      document.querySelectorAll('.search-results').forEach(function (box) { box.classList.remove('is-visible'); });
    }
  });
  var compactLayout = window.matchMedia('(max-width: 960px)');
  document.querySelectorAll('.toc-disclosure').forEach(function (toc) {
    function adaptContents() { toc.open = !compactLayout.matches; }
    adaptContents();
    compactLayout.addEventListener('change', adaptContents);
  });
  function normalize(text) { return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  document.querySelectorAll('[data-search], .empty-state .search-box').forEach(function (box) {
    var input = box.querySelector('input');
    var results = box.querySelector('.search-results, #search-results');
    if (!input || !results) return;
    if (!input.getAttribute('aria-label') && !box.querySelector('label')) input.setAttribute('aria-label', 'Search guides and calculators');
    results.setAttribute('aria-live', 'polite');
    input.addEventListener('input', function () {
      var query = normalize(input.value);
      results.replaceChildren();
      results.classList.toggle('is-visible', query.length >= 2);
      if (query.length < 2) return;
      var tokens = query.split(/\s+/);
      var matches = (window.SITE_INDEX || []).filter(function (item) {
        var haystack = normalize(item.title + ' ' + item.keywords);
        return tokens.every(function (token) { return haystack.indexOf(token) !== -1; });
      }).sort(function (a, b) { return Number(normalize(b.title).includes(query)) - Number(normalize(a.title).includes(query)); }).slice(0, 8);
      if (!matches.length) {
        var empty = document.createElement('p'); empty.className = 'empty';
        empty.textContent = 'No matches yet. Try “primer”, “cost”, or “thickness”.'; results.append(empty);
      }
      matches.forEach(function (item) { var link = document.createElement('a'); link.href = item.url; link.textContent = item.title; results.append(link); });
    });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown' && results.querySelector('a')) { event.preventDefault(); results.querySelector('a').focus(); }
    });
  });
  var quickForm = document.getElementById('quick-estimate');
  if (quickForm) {
    function estimate() {
      var length = Number(document.getElementById('quick-length').value);
      var width = Number(document.getElementById('quick-width').value);
      var depth = Number(document.getElementById('quick-depth').value);
      var valid = [length, width, depth].every(function (n) { return Number.isFinite(n) && n > 0; }) && length <= 10000 && width <= 10000;
      document.getElementById('quick-error').textContent = valid ? '' : 'Enter a positive length and width, up to 10,000 feet per side.';
      document.getElementById('quick-bags').textContent = valid ? Math.ceil(length * width / (40 * .125 / depth) * 1.1).toLocaleString() : '—';
      document.getElementById('quick-area').textContent = valid ? (length * width).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—';
    }
    quickForm.addEventListener('submit', function (event) { event.preventDefault(); estimate(); });
    quickForm.addEventListener('input', estimate);
    quickForm.addEventListener('change', estimate);
  }
  var viewer = document.querySelector('.layer-viewer');
  if (viewer) {
    var layersButton = viewer.querySelector('.layer-toggle');
    var rotation = document.getElementById('floor-rotation');
    layersButton.addEventListener('click', function () {
      var assembled = viewer.classList.toggle('is-assembled');
      layersButton.setAttribute('aria-pressed', String(!assembled));
      layersButton.textContent = assembled ? 'Separate the layers ↑' : 'Bring layers together ↓';
    });
    rotation.addEventListener('input', function () { viewer.style.setProperty('--rotation', rotation.value + 'deg'); });
  }
})();
