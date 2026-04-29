/* ============================================
   Birdie CO2 Experience — App Logic
   State machine, transitions, data collection,
   progressive saving via upsert
   ============================================ */

(function () {
  'use strict';

  // --- Session data ---
  const params = new URLSearchParams(window.location.search);
  const sessionData = {
    session_id: crypto.randomUUID(),
    birdie_status: null,
    location_id: params.get('location') || 'default',
    consent: false,
    completed: false,
    mitigation_open_windows: false,
    mitigation_open_doors: false,
    mitigation_reduce_occupancy: false,
    mitigation_turn_on_fans: false,
    mitigation_turn_on_filters: false,
    likert_knowledge: null,
    likert_confidence: null,
    user_agent: navigator.userAgent
  };

  // --- Screens ---
  const SCREENS = [
    'screen-consent',
    'screen-status',
    'screen-impacts',
    'screen-mitigation',
    'screen-likert',
    'screen-thanks'
  ];
  let currentScreen = 0;

  function showScreen(index) {
    SCREENS.forEach((id, i) => {
      const el = document.getElementById(id);
      el.classList.toggle('active', i === index);
    });
    currentScreen = index;
    buildProgressBar(index);
    window.scrollTo(0, 0);
  }

  // --- Progress bar ---
  function buildProgressBar(screenIndex) {
    const screen = document.getElementById(SCREENS[screenIndex]);
    const bar = screen.querySelector('.progress-bar');
    if (!bar) return;

    const step = parseInt(bar.dataset.step, 10);
    const total = 4;
    bar.innerHTML = '';

    for (let i = 1; i <= total; i++) {
      const dot = document.createElement('span');
      dot.style.flex = '1';
      dot.style.height = '3px';
      dot.style.borderRadius = '2px';
      dot.style.transition = 'background 0.3s ease';

      if (i <= step) {
        dot.style.background = '#F5C518';
      } else {
        const isDark = screen.classList.contains('screen--dark');
        dot.style.background = isDark ? '#333' : '#e0e0e0';
      }
      bar.appendChild(dot);

      if (i < total) {
        const gap = document.createElement('span');
        gap.style.width = '4px';
        gap.style.flexShrink = '0';
        bar.appendChild(gap);
      }
    }
  }

  // --- Save helpers (fire-and-forget, never blocks UI) ---
  function saveProgress() {
    submitResponse(sessionData).catch(() => {});
  }

  // --- Inject real birdie images ---
  function injectBirdieImages() {
    const aliveContainer = document.getElementById('birdie-alive-img');
    if (aliveContainer) {
      aliveContainer.innerHTML = '<img src="assets/birdie-alive.png" alt="Birdie sitting upright on a branch — air quality is good" class="birdie-img">';
    }

    const deadContainer = document.getElementById('birdie-dead-img');
    if (deadContainer) {
      deadContainer.innerHTML = '<img src="assets/birdie-dead.png" alt="Birdie hanging upside down from a branch — air quality is poor" class="birdie-img">';
    }

    const thanksContainer = document.getElementById('thanks-birdie');
    if (thanksContainer) {
      thanksContainer.innerHTML = '<img src="assets/birdie-icon.png" alt="Birdie icon" class="thanks-birdie-img">';
    }
  }

  // --- Screen 1: Consent ---
  function initConsent() {
    const check = document.getElementById('consent-check');
    const btn = document.getElementById('btn-begin');
    const label = document.querySelector('.consent-checkbox');

    label.addEventListener('click', (e) => {
      e.preventDefault();
      check.checked = !check.checked;
      btn.disabled = !check.checked;
    });

    check.addEventListener('change', () => {
      btn.disabled = !check.checked;
    });

    btn.addEventListener('click', () => {
      if (!check.checked) return;
      sessionData.consent = true;
      showScreen(1);
    });
  }

  // --- Screen 2: Status selection ---
  // SAVE POINT 1: After the user reports alive/dead,
  // create the record. This captures the core observation
  // even if they close the tab immediately after.
  function initStatus() {
    const cards = document.querySelectorAll('.status-card');

    cards.forEach(card => {
      card.addEventListener('click', () => {
        const status = card.dataset.status;
        sessionData.birdie_status = status;

        // Visual feedback
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        // Save the birdie observation immediately
        saveProgress();

        // Brief delay then advance
        setTimeout(() => showScreen(2), 300);
      });
    });
  }

  // --- Screen 3: Impacts ---
  function initImpacts() {
    document.getElementById('btn-what-can-i-do').addEventListener('click', () => {
      showScreen(3);
    });
  }

  // --- Screen 4: Mitigation ---
  // SAVE POINT 2: After checkboxes, update the record
  // with mitigation selections.
  function initMitigation() {
    document.getElementById('btn-mitigation-next').addEventListener('click', () => {
      const fields = [
        'mitigation_open_windows',
        'mitigation_open_doors',
        'mitigation_reduce_occupancy',
        'mitigation_turn_on_fans',
        'mitigation_turn_on_filters'
      ];
      fields.forEach(name => {
        const el = document.querySelector(`input[name="${name}"]`);
        sessionData[name] = el ? el.checked : false;
      });

      // Save checkbox selections
      saveProgress();

      showScreen(4);
    });
  }

  // --- Screen 5: Likert ---
  // SAVE POINT 3 (final): After Likert scales,
  // update the record and mark as completed.
  function initLikert() {
    const submitBtn = document.getElementById('btn-submit');

    document.querySelectorAll('.likert-scale').forEach(scale => {
      const field = scale.dataset.field;
      const buttons = scale.querySelectorAll('.likert-btn');

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const value = parseInt(btn.dataset.value, 10);
          sessionData[field] = value;

          buttons.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');

          if (sessionData.likert_knowledge !== null && sessionData.likert_confidence !== null) {
            submitBtn.disabled = false;
          }
        });
      });
    });

    let submitted = false;
    submitBtn.addEventListener('click', async () => {
      if (submitted) return;
      submitted = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'SUBMITTING...';

      // Mark as completed and do final save
      sessionData.completed = true;
      await submitResponse(sessionData);
      showScreen(5);
    });
  }

  // --- Init ---
  function init() {
    injectBirdieImages();
    initConsent();
    initStatus();
    initImpacts();
    initMitigation();
    initLikert();
    showScreen(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
