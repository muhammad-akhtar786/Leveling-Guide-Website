(function () {
  'use strict';

  document.documentElement.classList.add('has-js');

  var measurementId = 'G-EEVCE53BZW';
  var gaScriptUrl = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  function loadGoogleAnalytics() {
    if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
      return;
    }

    var script = document.createElement('script');
    script.src = gaScriptUrl;
    script.async = true;
    script.setAttribute('data-lg-analytics', 'true');
    document.head.appendChild(script);
  }

  function scheduleAnalytics() {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadGoogleAnalytics, { timeout: 2000 });
      return;
    }
    window.setTimeout(loadGoogleAnalytics, 1500);
  }

  scheduleAnalytics();
})();
