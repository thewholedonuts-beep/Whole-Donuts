/**
 * gateway.js — Wenevergonnaclose landing gateway controller.
 *
 * Sequence:
 *   1. Intro (stick figure + ENTER button)
 *   2. "+U" / BEPZITIV animation
 *   3. Split-screen ecosystem picker
 */

(function () {
  'use strict';

  var PLUS_U_DURATION_MS = 1800;

  var phaseIntro  = document.getElementById('phase-intro');
  var phasePlusU  = document.getElementById('phase-plus-u');
  var phaseSplit  = document.getElementById('phase-split');
  var btnEnter    = document.getElementById('btn-enter');

  function showPhase(el) {
    [phaseIntro, phasePlusU, phaseSplit].forEach(function (s) {
      s.hidden = (s !== el);
    });
  }

  /* ── Phase transitions ─────────────────────────────── */

  function enterGateway() {
    showPhase(phasePlusU);
    setTimeout(function () {
      showPhase(phaseSplit);
    }, PLUS_U_DURATION_MS);
  }

  /* ── Event bindings ────────────────────────────────── */

  btnEnter.addEventListener('click', enterGateway);
  btnEnter.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      enterGateway();
    }
  });

  phaseSplit.querySelectorAll('.ecosystem-side').forEach(function (side) {
    var href = side.getAttribute('data-href');

    function navigate() {
      if (href && /^https?:\/\//.test(href)) {
        window.location.href = href;
      }
    }

    side.addEventListener('click', navigate);
    side.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate();
      }
    });
  });

  /* ── Auto-advance on host match (domain routing) ───── */

  var AUTO_ROUTE = {
    'wholedonuts.org':             'https://wholedonuts.org',
    'wholedonuts.app':             'https://wholedonuts.app',
    'wholedonuts.me':              'https://wholedonuts.me',
    'wholedonuts.pro':             'https://wholedonuts.pro',
    'wholedonuts.buzz':            'https://wholedonuts.buzz',
    'wholedonuts.store':           'https://wholedonuts.store',
    'thenurturedchef.com':         'https://thenurturedchef.com',
    'thenurturedchef.foundation':  'https://thenurturedchef.foundation',
    'thenutur3dchef.com':          'https://thenutur3dchef.com'
  };

  var host = window.location.hostname;
  if (AUTO_ROUTE[host]) {
    window.location.replace(AUTO_ROUTE[host]);
  }
}());
