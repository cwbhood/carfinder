/* CarFinder site script: the theme toggle. The stored choice is localStorage "cf_theme" holding a JSON string
   ("light" or "dark"), the same key and encoding the app's save() helper uses. Pages also carry a two-line inline copy
   of the read in <head> so the stored theme applies before first paint. */
(function () {
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function current() {
    var t = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return mq && mq.matches ? 'dark' : 'light';
  }
  function label(btn) {
    var next = current() === 'dark' ? 'light' : 'dark';
    btn.setAttribute('aria-label', 'Switch to ' + next + ' theme');
    btn.setAttribute('title', 'Switch to ' + next + ' theme');
  }
  var meta = document.querySelectorAll('meta[name="theme-color"]');
  function syncMeta() {
    var bg = getComputedStyle(root).getPropertyValue('--bg').trim();
    if (root.hasAttribute('data-theme')) for (var i = 0; i < meta.length; i++) meta[i].setAttribute('content', bg);
  }
  var btns = document.querySelectorAll('.theme-toggle');
  for (var i = 0; i < btns.length; i++) {
    label(btns[i]);
    btns[i].addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('cf_theme', JSON.stringify(next)); } catch (e) {}
      for (var j = 0; j < btns.length; j++) label(btns[j]);
      syncMeta();
    });
  }
  syncMeta();
})();
