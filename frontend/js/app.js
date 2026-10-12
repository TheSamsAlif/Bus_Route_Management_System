const API = '/api';
let user = null, favs = [], routes = [], buses = [], anns = [], operators = [];

const $ = id => document.getElementById(id);
const qs = (s, p) => (p||document).querySelector(s);
const qsa = (s, p) => [...((p||document).querySelectorAll(s))];

let el = {};

function cacheEl() {
  el = {
    splash: $('splash-screen'), app: $('app'), main: $('main-content'), userBtn: $('user-btn'),
    from: $('from-input'), to: $('to-input'), search: $('search-btn'), swap: $('swap-btn'),
    routes: $('popular-routes'), buses: $('bus-grid'), ann: $('ann-section'),
    modal: $('modal-overlay'), mcont: $('modal-content'), mclose: $('modal-close'),
    auth: $('auth-modal'), aclose: $('auth-close'), aform: $('auth-form'),
    atabs: qsa('.auth-tab'), nameFg: $('name-fg'), toast: $('toast-container'),
    offline: $('offline-banner')
  };
}

function init() {
  cacheEl();
  createParticles();
  bindToggles();
  bindAuth();
  bindModal();
  bindNav();
  bindOnline();
  setTimeout(() => {
    el.splash.classList.add('fade-out');
    setTimeout(() => { el.app.classList.remove('hidden'); loadAll(); }, 600);
  }, 2500);
}

function createParticles() {
  const c = $('particles'); if (!c) return;
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div'); p.className = 'particle';
    const s = Math.random() * 6 + 3;
    p.style.cssText = `width:${s}px;height:${s}px;left:${Math.random()*100}%;animation-duration:${Math.random()*20+15}s;animation-delay:${Math.random()*10}s`;
    c.appendChild(p);
  }
}

function bindToggles() {
  $('theme-toggle')?.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const ico = qs('#theme-toggle i');
    if (ico) {
      if (document.body.classList.contains('light-mode')) { ico.className = 'fas fa-sun'; }
      else { ico.className = 'fas fa-moon'; }
    }
  });
  $('lang-toggle')?.addEventListener('click', () => {
    showToast('ইংরেজি ও বাংলা উভয় ভাষা সাপোর্টেড', 'info');
  });
  $('notif-btn')?.addEventListener('click', () => {
    const list = anns.length ? anns.map(a =>
      `<div style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
        <div style="font-weight:600;font-size:13px">${a.title}</div>
        <div style="font-size:11px;opacity:0.6;margin-top:3px">${a.message}</div>
        <div style="font-size:10px;opacity:0.35;margin-top:4px">${new Date(a.createdAt).toLocaleDateString('bn-BD')}</div>
      </div>`).join('') : '<div style="opacity:0.5;text-align:center;padding:20px">কোনো বিজ্ঞপ্তি নেই</div>';
    showModal(`<div class="detail-card"><h4 style="margin-bottom:10px;font-size:15px"><i class="fas fa-bell" style="color:var(--w)"></i> বিজ্ঞপ্তি (${anns.length})</h4>${list}</div>`);
  });
}

function bindOnline() {
  window.addEventListener('online', () => {
    if (el.offline) el.offline.classList.add('hidden');
    showToast('আবার অনলাইনে ফিরে এসেছেন', 'success');
  });
  window.addEventListener('offline', () => {
    if (el.offline) el.offline.classList.remove('hidden');
  });
}

function bindAuth() {
  el.userBtn?.addEventListener('click', () => user ? showPage('profile') : showAuth());
  el.aclose?.addEventListener('click', () => el.auth.classList.remove('active'));
  el.atabs?.forEach(t => t.addEventListener('click', () => {
    el.atabs.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    if (el.nameFg) el.nameFg.style.display = t.dataset.tab === 'register' ? 'block' : 'none';
    const btn = el.aform?.querySelector('button span');
    if (btn) btn.textContent = t.dataset.tab === 'register' ? 'রেজিস্টার' : 'লগিন';
  }));
  el.aform?.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const isReg = el.atabs && el.atabs[1]?.classList.contains('active');
    const body = isReg
      ? { username: fd.get('username'), name: fd.get('name')||fd.get('username'), password: fd.get('password') }
      : { username: fd.get('username'), password: fd.get('password') };
    try {
      const r = await fetch(`${API}/auth/${isReg?'register':'login'}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      const d = await r.json();
      if (d.success) {
        localStorage.setItem('gbd_token', d.token);
        user = d.user; favs = d.user.favorites || [];
        updateUI();
        el.auth.classList.remove('active');
        el.aform.reset();
        showPage('home');
        showToast(isReg ? 'রেজিস্ট্রেশন সফল! স্বাগতম!' : 'লগিন সফল!', 'success');
      } else showToast(d.message || 'ত্রুটি হয়েছে', 'error');
    } catch(e) { showToast('কানেকশন ত্রুটি — সার্ভার চালু আছে কি?', 'error'); }
  });
}

function bindModal() {
  el.mclose?.addEventListener('click', () => el.modal.classList.remove('active'));
  el.modal?.addEventListener('click', e => { if (e.target === el.modal) el.modal.classList.remove('active'); });
}

function bindNav() {
  qsa('.nav-item').forEach(b => b.addEventListener('click', () => showPage(b.dataset.page)));
}

function showAuth() { el.auth?.classList.add('active'); }
function showAuthReg() { showAuth(); if (el.atabs && el.atabs[1]) { el.atabs.forEach(x => x.classList.remove('active')); el.atabs[1].classList.add('active'); if (el.nameFg) el.nameFg.style.display = 'block'; const btn = el.aform?.querySelector('button span'); if (btn) btn.textContent = 'রেজিস্টার'; } }

async function loadAll() {
  showSkels();
  await Promise.all([fetchRoutes(), fetchBuses(), fetchAnns(), fetchOperators()]);
  await checkAuth();
  showPage('home');
}

function showSkels() {
  if (el.routes) el.routes.innerHTML = Array(3).fill('<div class="route-card skeleton" style="height:90px"></div>').join('');
  if (el.buses) el.buses.innerHTML = Array(4).fill('<div class="bus-card skeleton" style="height:110px"></div>').join('');
}

async function checkAuth() {
  const t = localStorage.getItem('gbd_token');
  if (t) await fetchUser(t);
  else updateUI();
}

async function fetchUser(t) {
  try {
    const r = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${t}` } });
    if (!r.ok) { localStorage.removeItem('gbd_token'); showPage('home'); return; }
    const d = await r.json();
    if (d.success) { user = d.user; favs = d.user.favorites || []; updateUI(); }
    else showPage('home');
  } catch(e) { showPage('home'); }
}

function showToast(msg, type = 'info', duration = 3000) {
  const c = el.toast || $('toast-container');
  if (!c) return;
  const icons = { success:'fa-check-circle', error:'fa-exclamation-circle', warning:'fa-exclamation-triangle', info:'fa-info-circle' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas ${icons[type]||'fa-info-circle'}"></i><span>${msg}</span><button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
  c.appendChild(t);
  setTimeout(() => { t.style.animation = 'toastOut 0.3s ease forwards'; setTimeout(() => t.remove(), 300); }, duration);
}

function updateUI() {
  if (!el.userBtn) return;
  if (user) {
    el.userBtn.textContent = (user.name||user.username).charAt(0).toUpperCase();
    el.userBtn.style.fontWeight = '700'; el.userBtn.style.fontSize = '18px';
  } else {
    el.userBtn.innerHTML = '<i class="fas fa-user"></i>';
    el.userBtn.style.fontWeight = ''; el.userBtn.style.fontSize = '';
  }
}

async function fetchRoutes() {
  try { const r = await fetch(`${API}/routes?popular=true`); const d = await r.json(); if (d.success) { routes = d.routes; } } catch(e) { showToast('রুট লোড করতে সমস্যা', 'error'); }
}
async function fetchBuses() {
  try { const r = await fetch(`${API}/buses`); const d = await r.json(); if (d.success) { buses = d.buses; } } catch(e) {}
}
async function fetchAnns() {
  try { const r = await fetch(`${API}/announcements`); const d = await r.json(); if (d.success) { anns = d.announcements; qs('.notification-badge').textContent = anns.length; } } catch(e) {}
}
async function fetchOperators() {
  try { const r = await fetch(`${API}/operators`); const d = await r.json(); if (d.success) { operators = d.operators; } } catch(e) {}
}

function catLabel(c) { return {dhaka_city:'ঢাকা সিটি',intercity:'ইন্টারসিটি',long_route:'লং রুট'}[c]||c; }

function getOperatorName(opId) {
  if (!opId) return '';
  const op = operators.find(o => o._id === opId);
  return op ? op.name : '';
}

function renderRoutes(list, container) {
  const c = container || el.routes;
  if (!c) return;
  c.innerHTML = list.map(r => `
    <div class="route-card" onclick="showRoute('${r._id}')">
      <div class="route-top">
        <span class="route-name">${r.name}</span>
        <span class="route-badge ${r.category}">${catLabel(r.category)}</span>
      </div>
      <div class="route-path"><span class="dot green"></span><span class="label">${r.from}</span><span class="line"></span><span class="dot red"></span><span class="label">${r.to}</span></div>
      <div class="route-meta">
        <span><i class="fas fa-road"></i> ${r.distance} কি.মি</span>
        <span><i class="fas fa-clock"></i> ${r.estimatedTime} মিনিট</span>
        <span><i class="fas fa-bus"></i> ${r.buses?.length||0}টি বাস</span>
        <span class="traffic-badge ${r.trafficStatus||'low'}">${r.trafficStatus==='high'?'🔴':r.trafficStatus==='medium'?'🟡':'🟢'} ${r.trafficStatus||'কম'}</span>
      </div>
    </div>`).join('');
}

function renderBuses(list) {
  if (!el.buses) return;
  el.buses.innerHTML = list.map(b => {
    const opName = getOperatorName(b.operator) || b.operator || '';
    return `<div class="bus-card" onclick="showBus('${b._id}')">
      <span class="bus-badge ${b.type}">${b.type.replace('_',' ')}</span>
      <div class="bus-name">${b.name}</div>
      ${opName ? `<div class="bus-op">${opName}</div>` : ''}
      <div class="bus-fare">৳${b.fare} <small>থেকে</small></div>
    </div>`;
  }).join('');
}

function renderAnns() {
  if (!el.ann || !anns.length) { if (el.ann) el.ann.style.display = 'none'; return; }
  el.ann.style.display = 'block';
  const a = anns[0];
  const ic = { general:'fa-bullhorn', traffic:'fa-car-crash', tips:'fa-lightbulb', emergency:'fa-exclamation' };
  el.ann.innerHTML = `<div class="ann-card">
    <div class="ann-icon ${a.type}"><i class="fas ${ic[a.type]||'fa-bullhorn'}"></i></div>
    <div class="ann-text"><h4>${a.title}</h4><p>${a.message.substring(0,70)}...</p></div>
  </div>`;
}

// ================ LANDING PAGE (Redesigned Transit Portal) ================
let _heroCategoryFilter = 'all';

function showLanding() {
  document.body.classList.add('landing-active');
  cacheEl();
  
  const samplePopular = routes.slice(0, 6);
  
  el.main.innerHTML = `
  <div class="portal-wrapper">
    <!-- Ambient Background Lighting -->
    <div class="portal-ambient">
      <div class="ambient-glow glow-1"></div>
      <div class="ambient-glow glow-2"></div>
      <div class="ambient-glow glow-3"></div>
    </div>

    <!-- Portal Navigation Bar -->
    <header class="landing-navbar">
      <div class="landing-nav-brand" onclick="showLanding()">
        <div class="landing-nav-icon"><i class="fas fa-bus-alt"></i></div>
        <div class="landing-nav-text">
          <h2>গন্তব্য BD</h2>
          <span>SMART BUS PORTAL</span>
        </div>
      </div>
      <nav class="landing-nav-links">
        <button class="landing-nav-link active" onclick="document.getElementById('search-anchor')?.scrollIntoView({behavior:'smooth'})"><i class="fas fa-search"></i> রুট খুঁজুন</button>
        <button class="landing-nav-link" onclick="document.getElementById('calc-anchor')?.scrollIntoView({behavior:'smooth'})"><i class="fas fa-calculator"></i> হাফ পাস ক্যালকুলেটর</button>
        <button class="landing-nav-link" onclick="showPage('routes')"><i class="fas fa-route"></i> সকল রুট (${routes.length||'১৫৪+'})</button>
        <button class="landing-nav-link" onclick="showPage('buses')"><i class="fas fa-bus"></i> সকল বাস (${buses.length||'৭৭৯+'})</button>
      </nav>
      <div class="landing-nav-actions">
        <button class="nav-btn-portal login" onclick="showAuth()"><i class="fas fa-sign-in-alt"></i> লগইন / অ্যাকাউন্ট</button>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="landing-hero" id="search-anchor">
      <div class="landing-hero-badge">
        <span class="badge-dot"></span>
        <span>🇧🇩 বাংলাদেশের সর্ববৃহৎ বাস রুট ও রিয়েলটাইম ভাড়া প্ল্যাটফর্ম</span>
      </div>
      
      <h1 class="landing-hero-title">
        ঢাকা সিটি ও সারা বাংলাদেশের বাস রুট<br>
        <span class="hero-gradient-text">এক ক্লিকেই খুঁজুন</span>
      </h1>
      
      <p class="landing-hero-subtitle">
        ঢাকা সিটির সকল অভ্যন্তরীণ রুট থেকে শুরু করে ৬৪ জেলার দূরপাল্লার আরামদায়ক বাস সার্ভিস। বর্তমান বিআরটিএ (BRTA) নির্ধারিত ভাড়ার তালিকা ও শিক্ষার্থীদের জন্য ৫০% হাফ পাস ক্যালকুলেশন সুবিধা।
      </p>

      <!-- Interactive Search Box -->
      <div class="hero-search-card">
        <div class="hero-cat-tabs">
          <button class="hero-cat-btn active" data-cat="all" onclick="filterHeroCategory('all', this)"><i class="fas fa-globe"></i> সকল রুট</button>
          <button class="hero-cat-btn" data-cat="dhaka_city" onclick="filterHeroCategory('dhaka_city', this)"><i class="fas fa-city"></i> ঢাকা সিটি বাস</button>
          <button class="hero-cat-btn" data-cat="intercity" onclick="filterHeroCategory('intercity', this)"><i class="fas fa-road"></i> ইন্টারসিটি</button>
          <button class="hero-cat-btn" data-cat="long_route" onclick="filterHeroCategory('long_route', this)"><i class="fas fa-map-marked-alt"></i> দূরপাল্লা ও জেলা রুট</button>
        </div>

        <div class="hero-search-inputs-grid">
          <div class="hero-input-field">
            <i class="fas fa-map-marker-alt from-icon"></i>
            <input type="text" id="hero-from" class="hero-input-box" placeholder="কোথা থেকে? (যেমন: মিরপুর ১০, উত্তরা, ঢাকা, মহাখালী)" autocomplete="off">
          </div>
          
          <button class="hero-swap-button" id="hero-swap" onclick="swapLandingSearch()" title="স্থান অদলবদল করুন">
            <i class="fas fa-exchange-alt"></i>
          </button>

          <div class="hero-input-field">
            <i class="fas fa-flag-checkered to-icon"></i>
            <input type="text" id="hero-to" class="hero-input-box" placeholder="কোথায় যাবেন? (যেমন: মতিঝিল, চট্টগ্রাম, সিলেট, খুলনা)" autocomplete="off">
          </div>

          <button class="hero-submit-btn" onclick="executeLandingSearch()">
            <i class="fas fa-search"></i> <span>রুট খুঁজুন</span>
          </button>
        </div>

        <!-- Quick Shortcut Pills -->
        <div class="hero-shortcuts">
          <span class="hero-shortcut-label"><i class="fas fa-fire" style="color:#fd79a8"></i> জনপ্রিয় রুট:</span>
          <span class="hero-shortcut-pill" onclick="setLandingSearch('মিরপুর ১০', 'মতিঝিল')">মিরপুর ১০ ⇄ মতিঝিল</span>
          <span class="hero-shortcut-pill" onclick="setLandingSearch('উত্তরা', 'মতিঝিল')">উত্তরা ⇄ মতিঝিল</span>
          <span class="hero-shortcut-pill" onclick="setLandingSearch('ঢাকা', 'চট্টগ্রাম')">ঢাকা ⇄ চট্টগ্রাম</span>
          <span class="hero-shortcut-pill" onclick="setLandingSearch('ঢাকা', 'কক্সবাজার')">ঢাকা ⇄ কক্সবাজার</span>
          <span class="hero-shortcut-pill" onclick="setLandingSearch('ঢাকা', 'সিলেট')">ঢাকা ⇄ সিলেট</span>
          <span class="hero-shortcut-pill" onclick="setLandingSearch('ঢাকা', 'রাজশাহী')">ঢাকা ⇄ রাজশাহী</span>
          <span class="hero-shortcut-pill" onclick="setLandingSearch('গাবতলী', 'সাভার')">গাবতলী ⇄ সাভার</span>
          <span class="hero-shortcut-pill" onclick="setLandingSearch('কুড়িল বিশ্বরোড', 'চিটাগাং রোড')">কুড়িল ⇄ চিটাগাং রোড</span>
        </div>
      </div>

      <!-- Hero Search Results Container -->
      <div class="hero-search-results" id="hero-search-results">
        <div class="results-header-bar">
          <div class="results-title"><i class="fas fa-star" style="color:#fdcb6e"></i> নির্বাচিত জনপ্রিয় রুটসমূহ</div>
          <button class="view-all" onclick="showPage('routes')">সকল ${routes.length||'১৫৪+'}টি রুট দেখুন <i class="fas fa-arrow-right"></i></button>
        </div>
        <div id="hero-results-list">
          ${renderLandingRouteCards(samplePopular)}
        </div>
      </div>
    </section>

    <!-- Fare Calculator & Student 50% Half Pass Section -->
    <section class="landing-calc-section" id="calc-anchor">
      <div class="portal-section-header">
        <span class="section-tag">BRTA APPROVED FARE CALCULATOR</span>
        <h2>স্মার্ট বাস ভাড়া ও হাফ পাস ক্যালকুলেটর</h2>
        <p>বর্তমান সরকারি গেজেট ও বিআরটিএ নীতিমালা অনুযায়ী প্রতি কিলোমিটার ভিত্তিক বাস ভাড়া এবং শিক্ষার্থীদের জন্য ৫০% হাফ পাসের সঠিক হিসেব</p>
      </div>

      <div class="calc-widget-split">
        <div class="calc-left-form">
          <div class="calc-form-group">
            <label><i class="fas fa-road" style="color:#00cec9"></i> ভ্রমণের দূরত্ব (কিলোমিটার)</label>
            <input type="number" id="landing-calc-dist" class="calc-input" placeholder="যেমন: ১২ অথবা ৩০০" value="15" min="1" oninput="calcLandingFare()">
          </div>

          <div class="calc-grid-2">
            <div class="calc-form-group">
              <label><i class="fas fa-layer-group" style="color:#a29bfe"></i> রুটের ধরন</label>
              <select id="landing-calc-cat" class="calc-select" onchange="calcLandingFare()">
                <option value="dhaka_city">ঢাকা ও চট্টগ্রাম সিটি (২.৪৫ ৳/কি.মি)</option>
                <option value="dtca">ডিটিসিএ এলাকা (২.৪০ ৳/কি.মি)</option>
                <option value="intercity">ইন্টারসিটি রুট (২.১৫ ৳/কি.মি)</option>
                <option value="long_route">দূরপাল্লা / আন্তঃজেলা (২.১৫ ৳/কি.মি)</option>
              </select>
            </div>
            
            <div class="calc-form-group">
              <label><i class="fas fa-snowflake" style="color:#7ab8ff"></i> বাসের ধরন</label>
              <select id="landing-calc-type" class="calc-select" onchange="calcLandingFare()">
                <option value="non_ac">নন-এসি সাধারণ বাস</option>
                <option value="ac">এসি চেয়ার কোচ (+৬০%)</option>
                <option value="sleeper">ডিলাক্স স্লিপার কোচ (+১১০%)</option>
              </select>
            </div>
          </div>

          <!-- Student Discount 50% Switch -->
          <div class="student-toggle-box">
            <div class="student-toggle-info">
              <div class="student-toggle-icon"><i class="fas fa-graduation-cap"></i></div>
              <div class="student-toggle-text">
                <h4>শিক্ষার্থী হাফ পাস (Student 50% Off)</h4>
                <p>ছাত্র/ছাত্রীদের জন্য নির্ধারিত সরকারি ৫০% ভাড়া ছাড়</p>
              </div>
            </div>
            <label class="switch-ui">
              <input type="checkbox" id="landing-student-toggle" onchange="calcLandingFare()">
              <span class="slider-round"></span>
            </label>
          </div>

          <button class="hero-submit-btn" style="width:100%;justify-content:center;margin-top:8px" onclick="calcLandingFare()">
            <i class="fas fa-calculator"></i> তাৎক্ষণিক ভাড়া হিসেব করুন
          </button>
        </div>

        <!-- Right Side Live Price Preview -->
        <div class="calc-right-result" id="landing-calc-result-box">
          <div style="font-size:13px;color:#8c96ac;font-weight:600;letter-spacing:1px">আনুমানিক যাত্রী ভাড়া</div>
          <div class="result-big-price" id="calc-preview-price">৳৩৭</div>
          <div id="calc-student-saving-container" style="display:none">
            <span class="student-saving-badge"><i class="fas fa-check-circle"></i> শিক্ষার্থী হিসেবে সাশ্রয়: <strong id="calc-saved-amount">৳১৯</strong></span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;text-align:left;font-size:12px;color:#a0aec0;border-top:1px solid rgba(255,255,255,0.08);padding-top:14px">
            <div><strong>বেস রেট:</strong> <span id="calc-preview-rate">৳২.৪৫</span> / কি.মি</div>
            <div><strong>সর্বনিম্ন ভাড়া:</strong> ৳১০ (হাফ পাস ৳৫)</div>
            <div><strong>দূরত্ব চার্জ:</strong> <span id="calc-preview-dist-charge">৳৩৬.৭৫</span></div>
            <div><strong>পিক আওয়ার:</strong> স্বাভাবিক সময়</div>
          </div>
          <div style="margin-top:14px;padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:10px;font-size:11px;color:#8c96ac">
            * বিআরটিএ কর্তৃক অনুমোদিত ভাড়া নির্দেশিকা অনুযায়ী হালনাগাদকৃত।
          </div>
        </div>
      </div>
    </section>

    <!-- Live Statistics Counter Grid -->
    <section class="portal-stats-section" id="stats-anchor">
      <div class="portal-stats-grid">
        <div class="portal-stat-card">
          <div class="stat-icon-wrap blue"><i class="fas fa-route"></i></div>
          <div class="stat-number">${routes.length||'১৫৪+'}</div>
          <div class="stat-label">সক্রিয় বাস রুট (ঢাকা ও জেলা)</div>
        </div>
        <div class="portal-stat-card">
          <div class="stat-icon-wrap green"><i class="fas fa-bus"></i></div>
          <div class="stat-number">${buses.length||'৭৭৯+'}</div>
          <div class="stat-label">তালিকাভুক্ত বাস ও কোচ</div>
        </div>
        <div class="portal-stat-card">
          <div class="stat-icon-wrap purple"><i class="fas fa-building"></i></div>
          <div class="stat-number">${operators.length||'৪৬'}টি</div>
          <div class="stat-label">শীর্ষ পরিবহন অপারেটর</div>
        </div>
        <div class="portal-stat-card">
          <div class="stat-icon-wrap pink"><i class="fas fa-percent"></i></div>
          <div class="stat-number">৫০%</div>
          <div class="stat-label">শিক্ষার্থী হাফ পাস সুবিধা</div>
        </div>
      </div>
    </section>

    <!-- Top Operators Showcase -->
    <section class="landing-hero" id="operators-anchor" style="padding-top:20px;padding-bottom:20px">
      <div class="portal-section-header" style="margin-bottom:16px">
        <span class="section-tag">TOP OPERATORS</span>
        <h2>বাংলাদেশের জনপ্রিয় বাস সার্ভিসসমূহ</h2>
        <p>ঢাকা শহরের লোকাল বাস ও দূরপাল্লার শীর্ষ এসি, নন-এসি এবং স্লিপার পরিবহন অপারেটর</p>
      </div>
      <div class="operators-pill-grid">
        ${renderOperatorChips()}
      </div>
    </section>

    <!-- BRTA Guidelines & Notice -->
    <section class="brta-guideline-box">
      <div class="brta-icon-circle"><i class="fas fa-shield-alt"></i></div>
      <div class="brta-text">
        <h3>সরকারি বিআরটিএ বাস ভাড়া নীতিমালা ও হাফ পাস নোটিশ</h3>
        <p>
          ঢাকা ও চট্টগ্রাম মহানগরীতে ডিজেল চালিত বাসে প্রতি কি.মি যাত্রী প্রতি ভাড়া ২.৪৫ টাকা এবং সর্বনিম্ন ভাড়া ১০ টাকা। শিক্ষার্থীদের জন্য বৈধ পরিচয়পত্র প্রদর্শনে ৫০% হাফ পাস বাধ্যতামূলক (সর্বনিম্ন ৫ টাকা)। দূরপাল্লায় প্রতি কি.মি সাধারণ বাস ভাড়া ২.১৫ টাকা। বাড়তি ভাড়া আদায় আইনত দণ্ডনীয়।
        </p>
      </div>
    </section>

    <!-- Quick Access / Demo Login Footer Banner -->
    <section class="portal-quick-auth">
      <div class="auth-cta-text">
        <h3>পছন্দের রুট সেভ ও লাইভ আপডেট পেতে চান?</h3>
        <p>কোনো পাসওয়ার্ড মনে না থাকলে এক ক্লিকেই ডেমো একাউন্টে লগইন করে সকল ফিচার ব্যবহার করুন</p>
      </div>
      <div class="auth-demo-btns">
        <button class="demo-quick-btn" onclick="directDemoLogin('user')"><i class="fas fa-user"></i> ইউজার ডেমো লগইন</button>
        <button class="demo-quick-btn" onclick="directDemoLogin('admin')"><i class="fas fa-user-shield"></i> অ্যাডমিন ডেমো লগইন</button>
        <button class="nav-btn-portal login" onclick="showAuth()"><i class="fas fa-sign-in-alt"></i> নিজস্ব লগইন</button>
      </div>
    </section>

    <!-- Portal Footer -->
    <footer style="text-align:center;padding:30px 20px;color:#718096;font-size:13px;border-top:1px solid rgba(255,255,255,0.06)">
      <p style="margin-bottom:6px">© 2026 <strong>গন্তব্য BD (GontoboddhBD)</strong> — বাংলাদেশের পূর্ণাঙ্গ বাস ট্রাভেল ও রুট ইনফরমেশন সিস্টেম</p>
      <p style="font-size:11px;letter-spacing:1px;opacity:0.6">DESIGNED & DEVELOPED BY <strong>SAMS ALIF</strong></p>
    </footer>
  </div>`;

  qsa('.nav-item').forEach(b => b.classList.remove('active'));
  qs(`.nav-item[data-page="home"]`)?.classList.add('active');

  // Bind autocomplete to hero inputs
  setTimeout(() => {
    const fIn = $('hero-from');
    const tIn = $('hero-to');
    if (fIn) {
      fIn.addEventListener('input', debounce(e => acSuggest(e, 'from'), 200));
      fIn.addEventListener('keydown', e => { if (e.key === 'Enter') { if (tIn && !tIn.value) tIn.focus(); else executeLandingSearch(); } });
    }
    if (tIn) {
      tIn.addEventListener('input', debounce(e => acSuggest(e, 'to'), 200));
      tIn.addEventListener('keydown', e => { if (e.key === 'Enter') executeLandingSearch(); });
    }
    calcLandingFare();
  }, 100);
}

function renderLandingRouteCards(list) {
  if (!list || !list.length) {
    return `<div style="text-align:center;padding:30px;background:rgba(255,255,255,0.03);border-radius:18px;color:#8c96ac">কোনো রুট পাওয়া যায়নি</div>`;
  }
  return list.map(r => {
    const minFare = r.fareRange?.min || Math.round(r.distance * 2.45);
    const maxFare = r.fareRange?.max || Math.round(r.distance * 2.45 * 1.3);
    const studentHalfPass = Math.max(5, Math.round(minFare * 0.5));
    const busCount = r.buses?.length || 5;
    const trafficLabel = r.trafficStatus === 'high' ? 'উচ্চ জ্যাম' : r.trafficStatus === 'medium' ? 'মাঝারি' : 'স্বাভাবিক ট্রাফিক';
    const trafficColor = r.trafficStatus === 'high' ? '#e17055' : r.trafficStatus === 'medium' ? '#fdcb6e' : '#00b894';

    return `
    <div class="portal-route-card" onclick="showRoute('${r._id}')">
      <div class="portal-route-top">
        <div class="portal-route-title">${r.name}</div>
        <span class="route-badge ${r.category}">${catLabel(r.category)}</span>
      </div>
      <div class="portal-route-path">
        <div class="path-point"><span class="dot green"></span> <span>${r.from}</span></div>
        <div class="path-line-dash"></div>
        <div class="path-point"><span class="dot red"></span> <span>${r.to}</span></div>
      </div>
      <div class="portal-route-meta">
        <div class="meta-badges">
          <span><i class="fas fa-road" style="color:#00cec9"></i> ${r.distance} কি.মি</span>
          <span><i class="fas fa-clock" style="color:#fdcb6e"></i> ${r.estimatedTime} মিনিট</span>
          <span><i class="fas fa-bus" style="color:#a29bfe"></i> ${busCount}টি বাস সার্ভিস</span>
          <span style="color:${trafficColor}"><i class="fas fa-traffic-light"></i> ${trafficLabel}</span>
        </div>
        <div class="fare-comparison-pill">
          <span class="fare-regular">ভাড়া: ৳${minFare}${maxFare !== minFare ? ' - ৳' + maxFare : ''}</span>
          <span class="fare-student-badge">🎓 হাফ পাস: ৳${studentHalfPass}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderOperatorChips() {
  const defaultOps = [
    'গ্রীন লাইন পরিবহন', 'সোহাগ পরিবহন', 'হানিফ এন্টারপ্রাইজ', 'শ্যামলী এন আর ট্রাভেলস',
    'সেন্টমার্টিন ট্রাভেলস', 'এনা ট্রান্সপোর্ট', 'দেশ ট্রাভেলস', 'তুরাগ পরিবহন',
    'বিকাশ পরিবহন', 'বিহঙ্গ পরিবহন', 'প্রজাপতি পরিবহন', 'তরঙ্গ হিল্লোল',
    'শিকড় পরিবহন', 'রাইদা এন্টারপ্রাইজ', 'অনাবিল সুপার', 'স্বাধীন এক্সপ্রেস',
    'পল্লী বন্ধু পরিবহন', 'লাব্বাইক পরিবহন', 'আল-মক্কা পরিবহন', 'দিশারী পরিবহন'
  ];
  const list = operators.length ? operators.map(o => o.name) : defaultOps;
  return list.slice(0, 20).map(name =>
    `<div class="operator-chip-card" onclick="searchByOperator('${name}')"><i class="fas fa-bus-alt" style="color:#00cec9"></i> ${name}</div>`
  ).join('');
}

window.searchByOperator = function(name) {
  showPage('buses');
  setTimeout(() => {
    const input = $('bus-search');
    if (input) {
      input.value = name;
      filterBusName(name);
    }
  }, 100);
};

window.filterHeroCategory = function(cat, btn) {
  _heroCategoryFilter = cat;
  qsa('.hero-cat-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  executeLandingSearch();
};

window.swapLandingSearch = function() {
  const f = $('hero-from');
  const t = $('hero-to');
  if (f && t) {
    [f.value, t.value] = [t.value, f.value];
    if (f.value || t.value) executeLandingSearch();
  }
};

window.setLandingSearch = function(from, to) {
  const f = $('hero-from');
  const t = $('hero-to');
  if (f) f.value = from;
  if (t) t.value = to;
  executeLandingSearch();
  document.getElementById('search-anchor')?.scrollIntoView({ behavior: 'smooth' });
};

window.executeLandingSearch = async function() {
  const fromVal = $('hero-from')?.value?.trim();
  const toVal = $('hero-to')?.value?.trim();
  const resContainer = $('hero-results-list');
  if (!resContainer) return;

  if (!fromVal && !toVal) {
    let filtered = routes;
    if (_heroCategoryFilter !== 'all') {
      filtered = routes.filter(r => r.category === _heroCategoryFilter);
    }
    resContainer.innerHTML = renderLandingRouteCards(filtered.slice(0, 8));
    return;
  }

  resContainer.innerHTML = `<div style="text-align:center;padding:30px;color:#00cec9"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top:10px;font-size:14px">রুট অনুসন্ধান করা হচ্ছে...</p></div>`;

  try {
    let searchUrl = '';
    if (fromVal && toVal) {
      searchUrl = `${API}/routes/search/from/${encodeURIComponent(fromVal)}/to/${encodeURIComponent(toVal)}`;
    } else {
      const q = fromVal || toVal;
      searchUrl = `${API}/routes?search=${encodeURIComponent(q)}`;
    }

    const r = await fetch(searchUrl);
    const d = await r.json();

    if (d.success) {
      let matched = d.routes || [];
      if (_heroCategoryFilter !== 'all') {
        matched = matched.filter(rt => rt.category === _heroCategoryFilter);
      }
      if (matched.length > 0) {
        resContainer.innerHTML = renderLandingRouteCards(matched);
        showToast(`${matched.length}টি রুট পাওয়া গেছে!`, 'success');
      } else if (d.transits && d.transits.length > 0) {
        resContainer.innerHTML = `
        <div style="background:rgba(253,203,110,0.1);border:1px solid rgba(253,203,110,0.25);border-radius:18px;padding:20px;margin-bottom:14px">
          <h4 style="color:#fdcb6e;margin-bottom:10px;font-size:16px"><i class="fas fa-exchange-alt"></i> সরাসরি কোনো রুট পাওয়া যায়নি — ট্রানজিট সংযোগ দেখুন</h4>
          ${d.transits.map(tr => `
            <div style="background:rgba(0,0,0,0.2);padding:14px;border-radius:12px;margin-bottom:10px;font-size:13px">
              <div><strong>১ম রুট:</strong> ${tr.firstRoute.name} (${tr.firstRoute.from} → ${tr.firstRoute.to})</div>
              <div style="color:#00cec9;margin:6px 0"><i class="fas fa-arrow-down"></i> ট্রানজিট পয়েন্ট: <strong>${tr.interchangeStop}</strong> এ নামুন</div>
              <div><strong>২য় রুট:</strong> ${tr.secondRoute.name} (${tr.secondRoute.from} → ${tr.secondRoute.to})</div>
              <div style="margin-top:8px;font-size:12px;opacity:.7">মোট দূরত্ব: ${tr.totalDistance} কি.মি | সময়: ${tr.totalTime} মিনিট</div>
            </div>`).join('')}
        </div>`;
        showToast('সরাসরি রুট নেই, ট্রানজিট সুপারিশ দেখানো হয়েছে', 'info');
      } else {
        resContainer.innerHTML = `
        <div style="text-align:center;padding:40px 20px;background:rgba(255,255,255,0.03);border-radius:20px">
          <i class="fas fa-search-location" style="font-size:42px;color:#a0aec0;margin-bottom:14px;opacity:0.5"></i>
          <h3 style="font-size:18px;margin-bottom:6px">কোনো নির্দিষ্ট রুট পাওয়া যায়নি</h3>
          <p style="font-size:13px;color:#8c96ac">বানান পরীক্ষা করুন অথবা কাছাকাছি প্রধান স্টপেজের নাম দিয়ে খুঁজুন</p>
        </div>`;
        showToast('কোনো রুট পাওয়া যায়নি', 'warning');
      }
    }
  } catch(e) {
    resContainer.innerHTML = `<div style="text-align:center;padding:20px;color:#e17055">অনুসন্ধানে সমস্যা হয়েছে</div>`;
  }
};

window.calcLandingFare = async function() {
  const dist = parseFloat($('landing-calc-dist')?.value) || 15;
  const cat = $('landing-calc-cat')?.value || 'dhaka_city';
  const type = $('landing-calc-type')?.value || 'non_ac';
  const isStudent = $('landing-student-toggle')?.checked || false;

  try {
    const r = await fetch(`${API}/fares/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distance: dist, category: cat, busType: type, isStudent })
    });
    const d = await r.json();

    if (d.success) {
      const pEl = $('calc-preview-price');
      const rateEl = $('calc-preview-rate');
      const distChEl = $('calc-preview-dist-charge');
      const saveBox = $('calc-student-saving-container');
      const saveAmt = $('calc-saved-amount');

      if (pEl) pEl.textContent = `৳${d.fare}`;
      if (rateEl) rateEl.textContent = `৳${d.breakdown.baseRate}`;
      if (distChEl) distChEl.textContent = `৳${d.breakdown.distanceCharge}`;

      if (isStudent && d.studentDiscount > 0) {
        if (saveBox) saveBox.style.display = 'block';
        if (saveAmt) saveAmt.textContent = `৳${d.studentDiscount}`;
      } else {
        if (saveBox) saveBox.style.display = 'none';
      }
    }
  } catch(e) {}
};

window.directDemoLogin = async function(role) {
  const username = role === 'admin' ? 'admin' : 'user';
  const password = role === 'admin' ? 'admin123' : 'user123';
  showToast(`${role === 'admin' ? 'অ্যাডমিন' : 'ইউজার'} লগইন করা হচ্ছে...`, 'info');
  try {
    const r = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const d = await r.json();
    if (d.success) {
      localStorage.setItem('gbd_token', d.token);
      user = d.user;
      favs = d.user.favorites || [];
      updateUI();
      document.body.classList.remove('landing-active');
      showPage('home');
      showToast('লগিন সফল! ড্যাশবোর্ডে স্বাগতম', 'success');
    } else {
      showToast('লগইন ব্যর্থ হয়েছে', 'error');
    }
  } catch(e) {
    showToast('সার্ভার কানেকশন ত্রুটি', 'error');
  }
};

window.handleLandingLogin = async function() {
  const username = $('landing-username')?.value?.trim();
  const password = $('landing-password')?.value?.trim();
  if (!username || !password) return showToast('ইউজারনেম ও পাসওয়ার্ড দিন', 'warning');
  try {
    const r = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const d = await r.json();
    if (d.success) {
      localStorage.setItem('gbd_token', d.token);
      user = d.user; favs = d.user.favorites || [];
      updateUI();
      document.body.classList.remove('landing-active');
      showPage('home');
      showToast('লগিন সফল!', 'success');
    } else {
      showToast(d.message || 'ভুল ইউজারনেম বা পাসওয়ার্ড', 'error');
    }
  } catch(e) {
    showToast('কানেকশন ত্রুটি', 'error');
  }
};

window.fillDemo = function(type) {
  directDemoLogin(type);
};

window.toggleLandingPassword = function() {
  const p = $('landing-password');
  if (p) p.type = p.type === 'password' ? 'text' : 'password';
};


// ================ DASHBOARD ================
let _cachedNotifs = [];

async function fetchNotifications() {
  const tk = localStorage.getItem('gbd_token');
  if (!tk) return;
  try {
    const r = await fetch(`${API}/users/notifications`, { headers: { Authorization: `Bearer ${tk}` } });
    const d = await r.json();
    if (d.success) _cachedNotifs = d.notifications;
  } catch(e) {}
}

function showDashboard() {
  const myF = routes.filter(r => favs.includes(r._id));
  const totalRoutes = routes.length;
  const totalBuses = buses.length;
  const totalFavs = myF.length;
  const urgentNotifs = _cachedNotifs.filter(n => n.type === 'urgent');

  el.main.innerHTML = `
  <div style="padding-top:0">
    <div class="dash-greeting">
      <div class="av">${(user?.name||user?.username||'U').charAt(0).toUpperCase()}</div>
      <h2>স্বাগতম, ${user?.name||user?.username||'যাত্রী'}! 👋</h2>
      <p>@${user?.username||''} ${user?.role==='admin'?'👑 অ্যাডমিন':'• যাত্রী'}</p>
    </div>

    ${urgentNotifs.length ? `<div style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:600;margin-bottom:8px;display:flex;align-items:center;gap:6px"><i class="fas fa-bell" style="color:#e17055"></i> জরুরি নোটিফিকেশন</div>
      ${urgentNotifs.map(n => `
      <div class="urgent-notif">
        <div class="urgent-icon"><i class="fas fa-exclamation-triangle" style="color:#e17055"></i></div>
        <div class="urgent-text">
          <h4>${n.title||'জরুরি বিজ্ঞপ্তি'}</h4>
          <p>${n.message}</p>
        </div>
      </div>`).join('')}
    </div>` : ''}

    <div class="panel-stat-grid">
      <div class="panel-stat"><div class="num">${totalRoutes}</div><div class="lbl">সকল রুট</div></div>
      <div class="panel-stat"><div class="num">${totalFavs}</div><div class="lbl">পছন্দের রুট</div></div>
      <div class="panel-stat"><div class="num">${totalBuses}</div><div class="lbl">উপলব্ধ বাস</div></div>
      <div class="panel-stat"><div class="num">${operators.length}</div><div class="lbl">অপারেটর</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
      <div class="panel-glass" style="cursor:pointer;text-align:center;padding:18px 12px;margin-bottom:0" onclick="showPage('routes')">
        <div style="width:40px;height:40px;border-radius:12px;background:rgba(74,140,255,.15);display:flex;align-items:center;justify-content:center;margin:0 auto 8px"><i class="fas fa-route" style="color:#4a8cff;font-size:18px"></i></div>
        <span style="font-size:13px;font-weight:500">রুট দেখুন</span>
      </div>
      <div class="panel-glass" style="cursor:pointer;text-align:center;padding:18px 12px;margin-bottom:0" onclick="showPage('calculator')">
        <div style="width:40px;height:40px;border-radius:12px;background:rgba(122,184,255,.15);display:flex;align-items:center;justify-content:center;margin:0 auto 8px"><i class="fas fa-calculator" style="color:#7ab8ff;font-size:18px"></i></div>
        <span style="font-size:13px;font-weight:500">ভাড়া ক্যালক</span>
      </div>
      <div class="panel-glass" style="cursor:pointer;text-align:center;padding:18px 12px;margin-bottom:0" onclick="showPage('favorites')">
        <div style="width:40px;height:40px;border-radius:12px;background:rgba(253,121,168,.15);display:flex;align-items:center;justify-content:center;margin:0 auto 8px"><i class="fas fa-heart" style="color:#fd79a8;font-size:18px"></i></div>
        <span style="font-size:13px;font-weight:500">পছন্দ তালিকা</span>
      </div>
      <div class="panel-glass" style="cursor:pointer;text-align:center;padding:18px 12px;margin-bottom:0" onclick="showPage('profile')">
        <div style="width:40px;height:40px;border-radius:12px;background:rgba(253,203,110,.15);display:flex;align-items:center;justify-content:center;margin:0 auto 8px"><i class="fas fa-user" style="color:#fdcb6e;font-size:18px"></i></div>
        <span style="font-size:13px;font-weight:500">প্রোফাইল</span>
      </div>
    </div>

    ${myF.length ? `
    <div class="panel-glass" style="margin-bottom:0">
      <h3 style="margin-bottom:10px">⭐ পছন্দের রুট</h3>
      ${myF.map(r => `
        <div class="route-card" onclick="showRoute('${r._id}')" style="margin-bottom:6px">
          <div class="route-top"><span class="route-name">${r.name}</span><span class="route-badge ${r.category}">${catLabel(r.category)}</span></div>
          <div class="route-path"><span class="dot green"></span><span class="label">${r.from}</span><span class="line"></span><span class="dot red"></span><span class="label">${r.to}</span></div>
        </div>`).join('')}
    </div>` : ''}

    <div class="panel-glass" style="margin-bottom:0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <h3 style="margin-bottom:0">🚌 জনপ্রিয় রুট</h3>
        <button class="view-all" onclick="showPage('routes')">সব দেখুন <i class="fas fa-arrow-right"></i></button>
      </div>
      <div class="route-list" id="dash-routes"></div>
    </div>
    <div style="text-align:center;padding:20px 0;opacity:0.25;font-size:11px;letter-spacing:2px">DEVELOPED BY SAMS ALIF</div>
  </div>`;
  const dr = $('dash-routes');
  if (dr) renderRoutes(routes.slice(0,5), dr);
}

async function showDashboardWithNotifs() {
  await fetchNotifications();
  showDashboard();
}

// ================ SEARCH ================
function bindSearch() {
  el.from = $('from-input'); el.to = $('to-input'); el.search = $('search-btn'); el.swap = $('swap-btn');
  el.routes = $('popular-routes'); el.buses = $('bus-grid'); el.ann = $('ann-section');
  el.search?.addEventListener('click', searchRoute);
  el.swap?.addEventListener('click', () => { if (el.from && el.to) { [el.from.value, el.to.value] = [el.to.value, el.from.value]; } });
  el.from?.addEventListener('input', debounce(e => acSuggest(e, 'from'), 200));
  el.to?.addEventListener('input', debounce(e => acSuggest(e, 'to'), 200));
  el.from?.addEventListener('keydown', e => { if (e.key === 'Enter') searchRoute(); });
  el.to?.addEventListener('keydown', e => { if (e.key === 'Enter') searchRoute(); });
}

function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

async function acSuggest(e, field) {
  const v = e.target.value.trim();
  const dd = e.target.parentElement.querySelector('.autocomplete-dropdown');
  if (dd) dd.remove();
  if (v.length < 1) return;
  try {
    const r = await fetch(`${API}/routes/suggest/stops?q=${encodeURIComponent(v)}`);
    const d = await r.json();
    if (d.success && d.suggestions.length) {
      const drop = document.createElement('div'); drop.className = 'autocomplete-dropdown';
      drop.innerHTML = d.suggestions.map(s =>
        `<div class="autocomplete-item" onclick="selectSuggestion(this,'${field}')">
          <i class="fas fa-map-marker-alt"></i> ${s}
        </div>`
      ).join('');
      e.target.parentElement.style.position = 'relative';
      e.target.parentElement.appendChild(drop);
    }
  } catch(e) {}
}

window.selectSuggestion = function(el2, field) {
  const input = el2.parentElement.parentElement.querySelector('input');
  if (input) { input.value = el2.textContent.trim(); }
  el2.parentElement.remove();
  if (field === 'from' && el.to?.value) searchRoute();
};

async function searchRoute() {
  const f = el.from?.value?.trim(), t = el.to?.value?.trim();
  if (!f || !t) return showToast('উভয় স্থান নির্বাচন করুন', 'warning');
  showSkels();
  try {
    const r = await fetch(`${API}/routes/search/from/${encodeURIComponent(f)}/to/${encodeURIComponent(t)}`);
    const d = await r.json();
    if (d.success) {
      if (d.hasDirect && d.routes.length) {
        renderRoutes(d.routes);
        showToast(`${d.routes.length}টি সরাসরি রুট পাওয়া গেছে`, 'success');
        const modalHtml = `<div class="detail-card">
          <h3 style="margin-bottom:12px"><i class="fas fa-check-circle" style="color:var(--g)"></i> ${d.routes.length}টি সরাসরি রুট পাওয়া গেছে</h3>
          ${d.routes.map(rt => `<div class="route-card" onclick="showRoute('${rt._id}')" style="margin-bottom:8px">
            <div class="route-top"><span class="route-name">${rt.name}</span><span class="route-badge ${rt.category}">${catLabel(rt.category)}</span></div>
            <div class="route-path"><span class="label">${rt.from}</span><span class="line"></span><span class="label">${rt.to}</span></div>
            <div class="route-meta"><span>${rt.distance} কি.মি</span><span>${rt.estimatedTime} মিনিট</span><span class="traffic-badge ${rt.trafficStatus||'low'}">${rt.trafficStatus==='high'?'🔴':rt.trafficStatus==='medium'?'🟡':'🟢'}</span></div>
          </div>`).join('')}
        </div>`;
        showModal(modalHtml);
        const dirRoutes = $('all-routes');
        if (dirRoutes) renderRoutes(d.routes, dirRoutes);
      } else if (d.transits && d.transits.length) {
        showToast('সরাসরি রুট নেই, ট্রানজিট সুপারিশ দেখুন', 'warning');
        const transitHtml = `<div class="detail-card">
          <h3 style="margin-bottom:12px"><i class="fas fa-exchange-alt" style="color:var(--w)"></i> সরাসরি রুট নেই — ট্রানজিট সুপারিশ</h3>
          ${d.transits.map(tr => `<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <span style="font-size:12px;padding:2px 8px;background:rgba(108,92,231,0.15);border-radius:8px;font-weight:600">প্রথম</span>
              <span style="font-weight:600;font-size:14px">${tr.firstRoute.name}</span>
            </div>
            <div style="font-size:12px;opacity:0.6;margin-bottom:8px">${tr.firstRoute.from} → ${tr.firstRoute.to}</div>
            <div style="text-align:center;padding:6px;background:rgba(253,203,110,0.1);border-radius:8px;margin-bottom:6px">
              <i class="fas fa-right-left"></i> <strong>${tr.interchangeStop}</strong>-এ নামুন
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <span style="font-size:12px;padding:2px 8px;background:rgba(0,206,201,0.15);border-radius:8px;font-weight:600">পরে</span>
              <span style="font-weight:600;font-size:14px">${tr.secondRoute.name}</span>
            </div>
            <div style="font-size:12px;opacity:0.6;margin-bottom:6px">${tr.secondRoute.from} → ${tr.secondRoute.to}</div>
            <div style="display:flex;gap:10px;font-size:12px;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
              <span><i class="fas fa-road"></i> মোট ${tr.totalDistance} কি.মি</span>
              <span><i class="fas fa-clock"></i> মোট ${tr.totalTime} মিনিট</span>
            </div>
          </div>`).join('')}
        </div>`;
        showModal(transitHtml);
      } else {
        showToast(`${f} → ${t} এর জন্য কোনো রুট নেই`, 'warning');
        showModal(`<div class="detail-card" style="text-align:center;padding:30px">
          <i class="fas fa-search" style="font-size:50px;margin-bottom:14px;opacity:0.4"></i>
          <h3 style="margin-bottom:6px">কোনো রুট পাওয়া যায়নি</h3>
          <p style="opacity:0.5">${f} → ${t}</p>
        </div>`);
        fetchRoutes(); fetchBuses();
      }
      if (user) {
        const tk = localStorage.getItem('gbd_token');
        fetch(`${API}/users/search-history`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tk}`},body:JSON.stringify({from:f,to:t})}).catch(()=>{});
      }
    }
  } catch(e) { showToast('সার্চ করতে ত্রুটি হয়েছে', 'error'); }
}

// ================ ROUTE & BUS DETAIL ================
async function showRoute(id) {
  try {
    const r = await fetch(`${API}/routes/${id}`); const d = await r.json();
    if (!d.success) return;
    const rt = d.route; const isFav = favs.includes(id);
    const trafficDot = rt.trafficStatus==='high'?'🔴':rt.trafficStatus==='medium'?'🟡':'🟢';
    const trafficLabel = rt.trafficStatus==='high'?'উচ্চ':rt.trafficStatus==='medium'?'মাঝারি':'কম';
    showModal(`<div class="detail-card">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
        <div><div class="detail-title">${rt.name}</div><div class="detail-sub">${rt.from} → ${rt.to}</div></div>
        <button onclick="toggleFav('${rt._id}',this)" style="width:38px;height:38px;border-radius:12px;border:1px solid ${isFav?'var(--a)':'var(--border)'};background:${isFav?'rgba(253,121,168,0.2)':'var(--card-bg)'};cursor:pointer;flex-shrink:0"><i class="fas fa-heart" style="color:${isFav?'var(--a)':''}"></i></button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">
        <div style="background:var(--card-bg);border-radius:12px;padding:12px;text-align:center"><div style="font-size:18px;font-weight:700;color:var(--s)">${rt.distance} <span style="font-size:11px;opacity:0.5">কি.মি</span></div></div>
        <div style="background:var(--card-bg);border-radius:12px;padding:12px;text-align:center"><div style="font-size:18px;font-weight:700;color:var(--s)">${rt.estimatedTime} <span style="font-size:11px;opacity:0.5">মিনিট</span></div></div>
        <div style="background:var(--card-bg);border-radius:12px;padding:12px;text-align:center"><div style="font-size:16px;font-weight:700">${trafficDot} <span style="font-size:11px;opacity:0.5">${trafficLabel}</span></div></div>
      </div>
      ${rt.fareRange ? `<div style="background:rgba(0,206,201,0.06);border:1px solid rgba(0,206,201,0.12);border-radius:12px;padding:10px 14px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px"><i class="fas fa-money-bill-wave" style="color:var(--s)"></i> ভাড়া</span>
        <span style="font-size:16px;font-weight:700;color:var(--s)">৳${rt.fareRange.min} - ৳${rt.fareRange.max}</span>
      </div>` : ''}
      ${rt.busStops?.length ? `<div style="margin-bottom:16px">
        <h4 style="font-size:14px;margin-bottom:10px"><i class="fas fa-map-marker-alt" style="color:var(--p)"></i> স্টপেজ (${rt.busStops.length})</h4>
        <div class="stops-timeline">${rt.busStops.map(s => `<div class="stop-item"><div class="stop-name">${s.name}</div><div class="stop-dist">${s.distance} কি.মি</div></div>`).join('')}</div>
      </div>` : ''}
      ${rt.description ? `<div style="margin-bottom:12px;padding:10px;background:var(--card-bg);border-radius:10px;font-size:12px;opacity:0.7">${rt.description}</div>` : ''}
      ${rt.buses?.length ? `<h4 style="font-size:14px;margin-bottom:10px"><i class="fas fa-bus" style="color:var(--s)"></i> বাস (${rt.buses.length})</h4>
        ${rt.buses.map(b => {
          const opName = getOperatorName(b.operator);
          return `<div onclick="showBus('${b._id}')" style="padding:12px;background:var(--card-bg);border:1px solid var(--border);border-radius:12px;margin-bottom:8px;cursor:pointer;display:flex;justify-content:space-between;align-items:center">
            <div><div style="font-weight:600;font-size:13px">${b.name}</div><div style="font-size:11px;opacity:0.5">${opName||b.operator||''}</div></div>
            <div style="text-align:right"><div style="font-weight:700;color:var(--s)">৳${b.fare}</div><span class="bus-badge ${b.type}" style="font-size:8px">${b.type.replace('_',' ')}</span></div>
          </div>`;
        }).join('')}` : ''}
      <button onclick="calcFare('${rt._id}')" style="width:100%;margin-top:16px;padding:14px;border:none;border-radius:14px;background:var(--gr);color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit"><i class="fas fa-calculator"></i> ভাড়া ক্যালকুলেট করুন</button>
    </div>`);
  } catch(e) {}
}

async function showBus(id) {
  try {
    const r = await fetch(`${API}/buses/${id}`); const d = await r.json();
    if (!d.success) return; const b = d.bus;
    const opName = getOperatorName(b.operator);
    const route = b.route;
    const routeStops = route?.busStops || [];
    const depTime = b.departureTime || route?.estimatedTime || '';
    const fromName = route?.from || '';
    const toName = route?.to || '';
    showModal(`<div class="detail-card">
      <span class="bus-badge ${b.type}" style="display:inline-block;margin-bottom:8px;font-size:11px">${b.type.replace('_',' ').toUpperCase()}</span>
      ${b.image ? `<div style="width:100%;height:160px;border-radius:14px;overflow:hidden;margin-bottom:14px;background:var(--card-bg)"><img src="${b.image}" alt="${b.name}" style="width:100%;height:100%;object-fit:cover"></div>` : ''}
      <div class="detail-title" style="font-size:22px">${b.name}</div>
      <div class="detail-sub">${opName||b.operator||'অপারেটর'}</div>
      ${fromName && toName ? `<div style="text-align:center;padding:10px;background:rgba(74,140,255,.08);border-radius:12px;margin:10px 0;font-size:14px;font-weight:600">${fromName} <i class="fas fa-arrow-right" style="color:var(--s);font-size:12px"></i> ${toName}</div>` : ''}
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0">
        <div style="background:var(--card-bg);border-radius:12px;padding:12px;text-align:center"><div style="font-size:20px;font-weight:700;color:var(--s)">৳${b.fare}</div><div style="font-size:11px;opacity:0.5">ভাড়া</div></div>
        <div style="background:var(--card-bg);border-radius:12px;padding:12px;text-align:center"><div style="font-size:20px;font-weight:700">${b.seatCapacity||40}</div><div style="font-size:11px;opacity:0.5">আসন</div></div>
        <div style="background:var(--card-bg);border-radius:12px;padding:12px;text-align:center"><div style="font-size:14px;font-weight:700">${depTime||'N/A'}</div><div style="font-size:11px;opacity:0.5">সময়</div></div>
      </div>
      ${routeStops.length ? `<div style="margin:12px 0">
        <h4 style="font-size:13px;margin-bottom:8px;display:flex;align-items:center;gap:6px"><i class="fas fa-map-marker-alt" style="color:#4a8cff"></i> ${fromName||'ছাড়ে'} → ${toName||'পৌঁছে'} (${routeStops.length}টি স্টপেজ)</h4>
        <div style="max-height:180px;overflow-y:auto;padding-right:4px">
          ${routeStops.map((s, i) => `
          <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04)">
            <div style="width:20px;height:20px;border-radius:50%;background:${i===0?'rgba(0,184,148,.2)':i===routeStops.length-1?'rgba(225,112,85,.2)':'rgba(74,140,255,.15)'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <div style="width:6px;height:6px;border-radius:50%;background:${i===0?'var(--g)':i===routeStops.length-1?'var(--d)':'#4a8cff'}"></div>
            </div>
            <span style="font-size:12px;flex:1">${s.name}</span>
            <span style="font-size:11px;opacity:.5">${s.distance} কি.মি</span>
          </div>`).join('')}
        </div>
      </div>` : ''}
      ${b.amenities?.length ? `<div style="margin:12px 0"><h4 style="font-size:13px;margin-bottom:8px"><i class="fas fa-gem" style="color:var(--w)"></i> সুবিধা</h4><div style="display:flex;flex-wrap:wrap;gap:6px">${b.amenities.map(a => `<span style="padding:5px 10px;background:rgba(108,92,231,0.1);border-radius:20px;font-size:11px">${a}</span>`).join('')}</div></div>` : ''}
      ${route ? `<button onclick="showRoute('${route._id||b.route}')" style="width:100%;margin-top:12px;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,#4a8cff,#7ab8ff);color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit"><i class="fas fa-route"></i> সম্পূর্ণ রুট দেখুন</button>` : ''}
    </div>`);
  } catch(e) {}
}

async function calcFare(id) {
  const rt = routes.find(r => r._id === id); if (!rt) return;
  try {
    const r = await fetch(`${API}/fares/calculate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({distance:rt.distance,category:rt.category,busType:'non_ac'})});
    const d = await r.json(); if (!d.success) return;
    const c = document.querySelector('.detail-card'); if (!c) return;
    const b = d.breakdown;
    c.insertAdjacentHTML('beforeend', `<div class="fare-box"><h4><i class="fas fa-calculator"></i> ভাড়া</h4>
      <div class="fare-row"><span>দূরত্ব</span><span>${rt.distance} কি.মি</span></div>
      <div class="fare-row"><span>রেট</span><span>৳${b.baseRate}/কি.মি</span></div>
      <div class="fare-row"><span>দূরত্ব ভাড়া</span><span>৳${b.distanceCharge}</span></div>
      ${b.peakHourCharge>0?`<div class="fare-row"><span>পিক আওয়ার</span><span>+ ৳${b.peakHourCharge}</span></div>`:''}
      <div class="fare-row"><span>মোট</span><span>৳${d.fare}</span></div>
      ${d.isPeakHour?'<div style="margin-top:8px;padding:6px 10px;background:rgba(253,203,110,0.1);border-radius:8px;font-size:11px;color:#fdcb6e;text-align:center">🔴 পিক আওয়ার — ভাড়া বেশি লাগতে পারে</div>':''}
    </div>`);
  } catch(e) {}
}

async function toggleFav(id, btn) {
  if (!user) return showAuth();
  const tk = localStorage.getItem('gbd_token');
  const isFav = favs.includes(id);
  try {
    const r = await fetch(`${API}/users/favorites/${id}`,{method:isFav?'DELETE':'POST',headers:{Authorization:`Bearer ${tk}`}});
    const d = await r.json();
    if (d.success) {
      if (isFav) { favs = favs.filter(f => f !== id); btn.style.background = ''; btn.style.borderColor = ''; btn.querySelector('i').style.color = ''; showToast('পছন্দ থেকে সরানো হয়েছে', 'info'); }
      else { favs.push(id); btn.style.background = 'rgba(253,121,168,0.2)'; btn.style.borderColor = 'var(--a)'; btn.querySelector('i').style.color = 'var(--a)'; showToast('পছন্দে যুক্ত হয়েছে', 'success'); }
    }
  } catch(e) {}
}

// ================ PAGES ================
function showPage(page) {
  document.body.classList.remove('landing-active');
  qsa('.nav-item').forEach(b => b.classList.remove('active'));
  qs(`.nav-item[data-page="${page}"]`)?.classList.add('active');
  cacheEl();

  if (page === 'home') {
    if (user) {
      showDashboard();
      setTimeout(() => fetchNotifications().then(() => {
        const urgentNotifs = _cachedNotifs.filter(n => n.type === 'urgent');
        if (urgentNotifs.length) showDashboard();
      }).catch(()=>{}), 100);
      return;
    }
    else { showLanding(); return; }
  }

  let html = '';

  if (page === 'routes') {
    html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 style="font-size:17px;font-weight:600">সকল রুট (${routes.length})</h3></div>
      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
        ${['dhaka_city','intercity','long_route'].map(c =>
          `<button onclick="filterCat('${c}')" class="route-badge ${c}" style="cursor:pointer;padding:6px 14px;font-size:12px;background:var(--card-bg);border:1px solid var(--border)">${catLabel(c)}</button>`
        ).join('')}
        <button onclick="filterCat('all')" class="route-badge" style="cursor:pointer;padding:6px 14px;font-size:12px;background:var(--card-bg);border:1px solid var(--border)">সব</button>
      </div>
      <div class="route-list" id="all-routes"></div>`;
  } else if (page === 'buses') {
    const busTypes = [...new Set(buses.map(b => b.type))];
    html = `<div style="padding-top:0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 style="font-size:17px;font-weight:600">সকল বাস (${buses.length})</h3></div>
      <div style="margin-bottom:14px;position:relative">
        <input type="text" id="bus-search" placeholder="🔍 বাসের নাম লিখুন..." oninput="debounceBusSearch(this.value)" style="width:100%;padding:12px 16px;border-radius:14px;border:1px solid var(--border);background:var(--card-bg);color:var(--text);font-size:14px;font-family:inherit;outline:none">
      </div>
      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
        <button onclick="filterBusType('all')" class="route-badge" style="cursor:pointer;padding:6px 14px;font-size:12px;background:var(--card-bg);border:1px solid var(--border)">সব</button>
        ${busTypes.map(t => `<button onclick="filterBusType('${t}')" class="route-badge ${t}" style="cursor:pointer;padding:6px 14px;font-size:12px;background:var(--card-bg);border:1px solid var(--border);text-transform:capitalize">${t.replace(/_/g,' ')}</button>`).join('')}
      </div>
      <div class="bus-grid" id="all-buses"></div>
    </div>`;
  } else if (page === 'calculator') {
    html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 style="font-size:17px;font-weight:600">ভাড়া ক্যালকুলেটর</h3></div>
      <div class="panel-glass">
        <div class="landing-input-group"><label>দূরত্ব (কি.মি)</label><input class="panel-input" type="number" id="cal-dist" placeholder="যেমন: ২৫"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="landing-input-group"><label>রুট টাইপ</label><select id="cal-cat" class="panel-select"><option value="dhaka_city">ঢাকা/চট্টগ্রাম সিটি</option><option value="dtca">ডিটিসিএ এলাকা</option><option value="intercity">ইন্টারসিটি</option><option value="long_route">লং রুট</option></select></div>
          <div class="landing-input-group"><label>বাস টাইপ</label><select id="cal-type" class="panel-select"><option value="non_ac">নন এসি</option><option value="ac">এসি</option><option value="sleeper">স্লিপার</option></select></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="landing-input-group"><label>আসন সংখ্যা</label><input class="panel-input" type="number" id="cal-seats" value="52" placeholder="৫২"></div>
          <div class="landing-input-group"><label>টোল (টাকা)</label><input class="panel-input" type="number" id="cal-toll" value="0" placeholder="০"></div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px">
          <label style="font-size:13px;color:#b8c0d3;cursor:pointer;display:flex;align-items:center;gap:6px"><input type="checkbox" id="cal-student"> ছাত্র/ছাত্রী (৫০% ছাড়)</label>
        </div>
        <button class="panel-btn" onclick="calcManual()"><i class="fas fa-calculator"></i> ক্যালকুলেট করুন</button>
      </div>
      <div id="cal-result" style="margin-top:16px"></div>`;
  } else if (page === 'favorites') {
    if (!user) {
      html = `<div style="text-align:center;padding:50px 20px;opacity:0.7"><i class="fas fa-user-lock" style="font-size:50px;margin-bottom:14px"></i><h3 style="font-size:18px">লগিন করুন</h3><button onclick="showAuth()" style="margin-top:16px;padding:14px 30px;border:none;border-radius:14px;background:var(--gr);color:#fff;font-weight:600;cursor:pointer;font-family:inherit">লগিন</button></div>`;
    } else {
      const fr = routes.filter(r => favs.includes(r._id));
      html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 style="font-size:17px;font-weight:600">⭐ পছন্দের রুট (${fr.length})</h3></div>${
        fr.length ? `<div class="route-list">${fr.map(r => `<div class="route-card" onclick="showRoute('${r._id}')"><div class="route-top"><span class="route-name">${r.name}</span><span class="route-badge ${r.category}">${catLabel(r.category)}</span></div><div class="route-path"><span class="label">${r.from}</span><span class="line"></span><span class="label">${r.to}</span></div></div>`).join('')}</div>`
        : `<div style="text-align:center;padding:50px 20px;opacity:0.5"><i class="fas fa-heart-broken" style="font-size:50px;margin-bottom:14px"></i><h3>পছন্দের তালিকা খালি</h3><p style="margin-top:6px">রুটের ❤️ আইকনে ক্লিক করে পছন্দ করুন</p></div>`
      }`;
    }
  } else if (page === 'profile') {
    if (!user) {
      html = `<div style="text-align:center;padding:50px 20px;opacity:0.7"><i class="fas fa-user-lock" style="font-size:50px;margin-bottom:14px"></i><h3 style="font-size:18px">লগিন করুন</h3><button onclick="showAuth()" style="margin-top:16px;padding:14px 30px;border:none;border-radius:14px;background:var(--gr);color:#fff;font-weight:600;cursor:pointer;font-family:inherit">লগিন</button></div>`;
    } else {
      const myFavs = routes.filter(r => favs.includes(r._id)).length;
      html = `<div style="text-align:center;padding:32px 20px;background:var(--card-bg);border:1px solid var(--border);border-radius:24px;margin-bottom:20px">
        <div style="width:80px;height:80px;border-radius:50%;background:var(--gr);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:32px;color:#fff">${(user.name||user.username).charAt(0).toUpperCase()}</div>
        <div style="font-size:20px;font-weight:700">${user.name||user.username}</div>
        <div style="font-size:12px;opacity:0.5">@${user.username} ${user.role==='admin'?'👑 অ্যাডমিন':'• যাত্রী'}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
        <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:14px;padding:16px;text-align:center"><div style="font-size:22px;font-weight:700;color:var(--s)">${myFavs}</div><div style="font-size:11px;opacity:0.5">পছন্দের রুট</div></div>
        <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:14px;padding:16px;text-align:center"><div style="font-size:22px;font-weight:700;color:var(--w)">${user.searchHistory?.length||0}</div><div style="font-size:11px;opacity:0.5">সার্চ</div></div>
      </div>
      <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:18px;padding:8px">
        <div onclick="showPage('favorites')" style="display:flex;align-items:center;gap:14px;padding:14px;border-radius:12px;cursor:pointer"><i style="width:20px;color:var(--p)" class="fas fa-heart"></i><span style="flex:1;font-size:14px">পছন্দের রুট</span><i class="fas fa-chevron-right" style="opacity:0.3;font-size:12px"></i></div>
        ${user.role==='admin'?`<div onclick="showPage('admin')" style="display:flex;align-items:center;gap:14px;padding:14px;border-radius:12px;cursor:pointer"><i style="width:20px;color:var(--p)" class="fas fa-shield-alt"></i><span style="flex:1;font-size:14px">অ্যাডমিন প্যানেল</span><i class="fas fa-chevron-right" style="opacity:0.3;font-size:12px"></i></div>`:''}
        <div onclick="logout()" style="display:flex;align-items:center;gap:14px;padding:14px;border-radius:12px;cursor:pointer"><i style="width:20px;color:var(--d)" class="fas fa-sign-out-alt"></i><span style="flex:1;font-size:14px;color:var(--d)">লগ আউট</span><i class="fas fa-chevron-right" style="opacity:0.3;font-size:12px"></i></div>
      </div>
      <div style="text-align:center;padding:20px 0;opacity:0.25;font-size:11px;letter-spacing:2px">DEVELOPED BY SAMS ALIF</div>`;
    }
  } else if (page === 'admin' && user?.role === 'admin') {
    html = `<div style="padding-top:0" id="admin-panel-root">লোড হচ্ছে...</div>`;
    setTimeout(() => renderAdminPanel(), 50);
  }

  el.main.innerHTML = `<div style="padding-top:12px">${html}</div>`;

  if (page === 'routes') {
    const cr = $('all-routes');
    if (cr) renderRoutes(routes, cr);
  }
  if (page === 'buses') renderAllBuses();
}

function showModal(h) { cacheEl(); if (el.mcont) el.mcont.innerHTML = h; if (el.modal) el.modal.classList.add('active'); }

function renderAllBuses() {
  const c = $('all-buses');
  if (!c) return;
  c.innerHTML = buses.map(b => {
    const route = routes.find(r => r._id === b.route);
    const fromTo = route ? `${route.from} → ${route.to}` : '';
    return `<div class="bus-card" onclick="showBusDetail('${b._id}')" data-en="${(b.en||'').replace(/"/g,'&quot;')}">
      <span class="bus-badge ${b.type}" style="display:inline-block;margin-bottom:4px">${b.type.replace(/_/g,' ').toUpperCase()}</span>
      <div class="bus-name" style="font-size:14px">${b.name}</div>
      <div class="bus-op" style="font-size:11px">${b.operator||''}</div>
      ${fromTo ? `<div style="font-size:11px;opacity:.7;margin:4px 0">${fromTo}</div>` : ''}
      <div class="bus-fare" style="font-size:16px">৳${b.fare} <small>থেকে</small></div>
    </div>`;
  }).join('');
}

let _busSearchTimer = null;
window.debounceBusSearch = function(val) {
  clearTimeout(_busSearchTimer);
  _busSearchTimer = setTimeout(() => filterBusName(val), 250);
};

window.filterBusName = function(val) {
  const cards = qsa('.bus-card');
  const q = val.trim().toLowerCase();
  cards.forEach(c => {
    const name = c.querySelector('.bus-name')?.textContent?.toLowerCase() || '';
    const en = c.dataset?.en?.toLowerCase() || '';
    c.style.display = !q || name.includes(q) || en.includes(q) ? '' : 'none';
  });
};

window.showBusDetail = async function(id) {
  await showBus(id);
};

window.filterBusType = function(type) {
  const cards = qsa('.bus-card');
  cards.forEach(c => {
    const badge = c.querySelector('.bus-badge');
    if (type === 'all') { c.style.display = ''; return; }
    c.style.display = badge && badge.classList.contains(type) ? '' : 'none';
  });
};

window.filterCat = function(cat) {
  const list = $('all-routes'); if (!list) return;
  qsa('.route-card', list).forEach(c => {
    const b = c.querySelector('.route-badge');
    c.style.display = (!b || cat === 'all' || b.classList.contains(cat)) ? '' : 'none';
  });
};

async function calcManual() {
  const d = $('cal-dist')?.value; if (!d || d <= 0) return showToast('দূরত্ব লিখুন', 'warning');
  const cat = $('cal-cat')?.value || 'dhaka_city';
  const type = $('cal-type')?.value || 'non_ac';
  const seats = parseInt($('cal-seats')?.value) || 52;
  const toll = parseFloat($('cal-toll')?.value) || 0;
  const isStudent = $('cal-student')?.checked || false;
  try {
    const r = await fetch(`${API}/fares/calculate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({distance:parseFloat(d),category:cat,busType:type,seatCount:seats,toll,isStudent})});
    const res = await r.json();
    if (res.success) {
      const b = res.breakdown;
      const el2 = $('cal-result');
      if (el2) el2.innerHTML = `<div class="panel-glass">
        <h4 style="margin-bottom:12px"><i class="fas fa-calculator"></i> আপনার ভাড়া</h4>
        <div class="fare-row"><span>দূরত্ব</span><span>${d} কি.মি</span></div>
        <div class="fare-row"><span>আসন</span><span>${seats}টি</span></div>
        <div class="fare-row"><span>রেট</span><span>৳${b.baseRate}/কি.মি</span></div>
        <div class="fare-row"><span>দূরত্ব ভাড়া</span><span>৳${b.distanceCharge}</span></div>
        ${b.seatAdjustment > 0 ? `<div class="fare-row"><span>আসন সমন্বয় (x${b.seatMultiplier})</span><span>+ ৳${b.seatAdjustment}</span></div>` : ''}
        ${b.studentDiscount > 0 ? `<div class="fare-row"><span>ছাত্র ডিস্কাউন্ট (-৫০%)</span><span style="color:var(--g)">- ৳${b.studentDiscount}</span></div>` : ''}
        ${b.tollAmount > 0 ? `<div class="fare-row"><span>টোল</span><span>+ ৳${b.tollAmount}</span></div>` : ''}
        ${b.peakHourCharge > 0 ? `<div class="fare-row"><span>পিক আওয়ার</span><span>+ ৳${b.peakHourCharge}</span></div>` : ''}
        <div class="fare-row" style="border-top:1px solid rgba(255,255,255,.08);margin-top:6px;padding-top:10px"><span>মোট ভাড়া</span><span style="font-size:22px;font-weight:700;color:var(--s)">৳${res.fare}</span></div>
        ${res.isPeakHour ? '<div style="margin-top:8px;padding:6px 10px;background:rgba(253,203,110,0.1);border-radius:8px;font-size:11px;color:#fdcb6e;text-align:center">🔴 পিক আওয়ার — ভাড়া বেশি লাগতে পারে</div>' : ''}
        ${res.minFare ? `<div style="margin-top:6px;font-size:11px;opacity:.5;text-align:center">সর্বনিম্ন ভাড়া: ৳${res.minFare}</div>` : ''}
      </div>`;
      showToast('ভাড়া ক্যালকুলেট করা হয়েছে', 'success');
    }
  } catch(e) { showToast('ক্যালকুলেশন ত্রুটি', 'error'); }
}

function logout() {
  localStorage.removeItem('gbd_token'); user = null; favs = [];
  updateUI(); showPage('home');
  showToast('লগ আউট করা হয়েছে', 'info');
}

window.addRoute = async function(e) {
  e.preventDefault();
  const fd = new FormData(e.target); const tk = localStorage.getItem('gbd_token');
  try {
    const r = await fetch(`${API}/routes`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tk}`},body:JSON.stringify(Object.fromEntries(fd))});
    const d = await r.json();
    if (d.success) { showToast('✅ রুট যোগ হয়েছে!', 'success'); e.target.reset(); fetchRoutes(); }
  } catch(e) {}
};

window.addBus = async function(e) {
  e.preventDefault();
  const fd = new FormData(e.target); const tk = localStorage.getItem('gbd_token');
  try {
    const r = await fetch(`${API}/buses`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tk}`},body:JSON.stringify(Object.fromEntries(fd))});
    const d = await r.json();
    if (d.success) { showToast('✅ বাস যোগ হয়েছে!', 'success'); e.target.reset(); fetchBuses(); }
  } catch(e) {}
};

window.updateBusImage = async function(e) {
  e.preventDefault();
  const busId = $('bus-select')?.value;
  const imageUrl = $('bus-image-url')?.value;
  if (!busId) return showToast('বাস নির্বাচন করুন', 'warning');
  const tk = localStorage.getItem('gbd_token');
  try {
    const r = await fetch(`${API}/admin/buses/${busId}/image`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tk}`},body:JSON.stringify({image:imageUrl})});
    const d = await r.json();
    if (d.success) showToast('✅ ইমেজ আপডেট হয়েছে!', 'success');
  } catch(e) { showToast('ইমেজ আপডেট ত্রুটি', 'error'); }
};

window.addTrafficAlert = async function(e) {
  e.preventDefault();
  const fd = new FormData(e.target); const tk = localStorage.getItem('gbd_token');
  try {
    const r = await fetch(`${API}/admin/traffic`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tk}`},body:JSON.stringify(Object.fromEntries(fd))});
    const d = await r.json();
    if (d.success) { showToast('✅ ট্রাফিক এলার্ট যোগ হয়েছে!', 'success'); e.target.reset(); }
  } catch(e) {}
};

window.addAnnouncement = async function(e) {
  e.preventDefault();
  const fd = new FormData(e.target); const tk = localStorage.getItem('gbd_token');
  try {
    const data = Object.fromEntries(fd);
    data.title = data.type === 'traffic' ? '🚦 ' + data.title : data.title;
    const r = await fetch(`${API}/admin/announcements`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tk}`},body:JSON.stringify(data)});
    const d = await r.json();
    if (d.success) { showToast('✅ বিজ্ঞপ্তি যোগ হয়েছে!', 'success'); e.target.reset(); fetchAnns(); }
  } catch(e) {}
};

let _adminNotifs = [];

async function renderAdminPanel() {
  const root = $('admin-panel-root');
  if (!root) return;
  try {
    const tk = localStorage.getItem('gbd_token');
    const r = await fetch(`${API}/admin/notifications`, { headers: { Authorization: `Bearer ${tk}` } });
    const d = await r.json();
    if (d.success) _adminNotifs = d.notifications;
  } catch(e) { _adminNotifs = []; }
  root.innerHTML = `
    <div class="panel-stat-grid">
      <div class="panel-stat"><div class="num">${routes.length}</div><div class="lbl">মোট রুট</div></div>
      <div class="panel-stat"><div class="num">${buses.length}</div><div class="lbl">মোট বাস</div></div>
      <div class="panel-stat"><div class="num">${operators.length}</div><div class="lbl">অপারেটর</div></div>
      <div class="panel-stat"><div class="num">${anns.length}</div><div class="lbl">বিজ্ঞপ্তি</div></div>
    </div>
    <div class="panel-glass">
      <h3><i class="fas fa-bullhorn"></i> জরুরি নোটিফিকেশন পাঠান</h3>
      <form onsubmit="sendNotification(event)">
        <input class="panel-input" name="title" placeholder="শিরোনাম (যেমন: জরুরি বিজ্ঞপ্তি)">
        <textarea class="panel-input" name="message" placeholder="বার্তা" required style="height:60px;padding:12px 16px;resize:none"></textarea>
        <button class="panel-btn" type="submit"><i class="fas fa-paper-plane"></i> সব ইউজারকে পাঠান</button>
      </form>
    </div>
    <div class="panel-glass">
      <h3><i class="fas fa-plus-circle"></i> নতুন রুট</h3>
      <form onsubmit="addRoute(event)">
        <input class="panel-input" name="name" placeholder="রুট নাম" required>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <input class="panel-input" name="from" placeholder="কোথা থেকে" required>
          <input class="panel-input" name="to" placeholder="কোথায়" required>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <input class="panel-input" type="number" name="distance" placeholder="দূরত্ব (কি.মি)" required>
          <select class="panel-select" name="category"><option value="dhaka_city">ঢাকা সিটি</option><option value="intercity">ইন্টারসিটি</option><option value="long_route">লং রুট</option></select>
        </div>
        <button class="panel-btn" type="submit"><i class="fas fa-plus"></i> রুট যোগ করুন</button>
      </form>
    </div>
    <div class="panel-glass">
      <h3><i class="fas fa-bus"></i> নতুন বাস</h3>
      <form onsubmit="addBus(event)">
        <input class="panel-input" name="name" placeholder="বাস নাম" required>
        <input class="panel-input" name="operator" placeholder="অপারেটর (ঐচ্ছিক)">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <select class="panel-select" name="type"><option value="non_ac">নন এসি</option><option value="ac">এসি</option><option value="sleeper">স্লিপার</option></select>
          <input class="panel-input" type="number" name="fare" placeholder="ভাড়া" required>
        </div>
        <button class="panel-btn" type="submit"><i class="fas fa-plus"></i> বাস যোগ করুন</button>
      </form>
    </div>
    <div class="panel-glass">
      <h3><i class="fas fa-image"></i> বাস ইমেজ URL</h3>
      <select id="bus-select" class="panel-select"><option value="">বাস নির্বাচন করুন</option>${buses.map(b => `<option value="${b._id}">${b.name}</option>`).join('')}</select>
      <input class="panel-input" type="url" id="bus-image-url" placeholder="https://example.com/bus.jpg" style="margin-bottom:0">
      <button class="panel-btn" onclick="updateBusImage(event)" style="margin-top:10px"><i class="fas fa-save"></i> ইমেজ সেট করুন</button>
    </div>
    <div class="panel-glass">
      <h3><i class="fas fa-traffic-light"></i> ট্রাফিক এলার্ট</h3>
      <form onsubmit="addTrafficAlert(event)">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <input class="panel-input" name="area" placeholder="এলাকা (যেমন: ফার্মগেট)" required>
          <select class="panel-select" name="morning"><option value="medium">মাঝারি</option><option value="high">উচ্চ</option><option value="low">কম</option></select>
        </div>
        <button class="panel-btn" type="submit"><i class="fas fa-plus"></i> এলার্ট যোগ করুন</button>
      </form>
    </div>
    <div class="panel-glass">
      <h3><i class="fas fa-bullhorn"></i> সাধারণ বিজ্ঞপ্তি</h3>
      <form onsubmit="addAnnouncement(event)">
        <input class="panel-input" name="title" placeholder="শিরোনাম" required>
        <input class="panel-input" name="message" placeholder="বার্তা" required>
        <select class="panel-select" name="type"><option value="general">সাধারণ</option><option value="traffic">ট্রাফিক</option><option value="tips">টিপস</option></select>
        <button class="panel-btn" type="submit"><i class="fas fa-plus"></i> বিজ্ঞপ্তি যোগ করুন</button>
      </form>
    </div>
    <div class="panel-glass">
      <h3 style="display:flex;justify-content:space-between;align-items:center"><span><i class="fas fa-history"></i> পাঠানো নোটিফিকেশন</span></h3>
      <div id="notif-list">${_adminNotifs.length ? _adminNotifs.map(n => `
        <div class="notif-item">
          <div class="notif-text">
            <div class="notif-title">${n.title||'জরুরি বিজ্ঞপ্তি'}</div>
            <div class="notif-msg">${n.message}</div>
            <div class="notif-time">${new Date(n.createdAt).toLocaleDateString('bn-BD',{hour:'2-digit',minute:'2-digit'})}</div>
          </div>
          <button class="panel-btn-sm danger" onclick="deleteNotification('${n._id}')"><i class="fas fa-trash"></i></button>
        </div>`).join('') : '<div style="text-align:center;padding:20px;opacity:.4;font-size:13px">কোনো নোটিফিকেশন নেই</div>'}</div>
    </div>
    <div style="text-align:center;padding:20px 0;opacity:0.25;font-size:11px;letter-spacing:2px">DEVELOPED BY SAMS ALIF</div>`;
}

window.sendNotification = async function(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const title = fd.get('title') || 'জরুরি বিজ্ঞপ্তি';
  const message = fd.get('message');
  if (!message) return showToast('বার্তা লিখুন', 'warning');
  const tk = localStorage.getItem('gbd_token');
  const btn = e.target.querySelector('button');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> পাঠানো হচ্ছে...'; }
  try {
    const r = await fetch(`${API}/admin/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
      body: JSON.stringify({ title, message, type: 'urgent' })
    });
    const d = await r.json();
    if (d.success) {
      showToast('✅ নোটিফিকেশন পাঠানো হয়েছে!', 'success');
      e.target.reset();
      _adminNotifs.unshift(d.notification);
      if (_adminNotifs.length > 20) _adminNotifs.length = 20;
      renderAdminPanel();
    }
  } catch(e) { showToast('নেটওয়ার্ক ত্রুটি', 'error'); }
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> সব ইউজারকে পাঠান'; }
};

window.deleteNotification = async function(id) {
  const tk = localStorage.getItem('gbd_token');
  try {
    const r = await fetch(`${API}/admin/notifications/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tk}` } });
    const d = await r.json();
    if (d.success) {
      _adminNotifs = _adminNotifs.filter(n => n._id !== id);
      renderAdminPanel();
      showToast('নোটিফিকেশন ডিলিট হয়েছে', 'info');
    }
  } catch(e) {}
};

document.addEventListener('keypress', e => {
  if (e.key === 'Enter' && $('from-input')?.value && $('to-input')?.value) searchRoute();
});

document.addEventListener('click', e => {
  qsa('.autocomplete-dropdown').forEach(dd => {
    if (!dd.contains(e.target) && !dd.parentElement?.contains(e.target)) dd.remove();
  });
});

init();
