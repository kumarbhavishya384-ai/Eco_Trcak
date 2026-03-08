/* ===================================================
   EcoTrack AI – Core App Logic (app.js)
   Shared utilities, API integration, and auth
   =================================================== */

// ── Constants ─────────────────────────────────────────
const API_BASE = window.location.port === '8080' ? 'http://localhost:5050/api' : 'https://ecotrackai-production.up.railway.app/api';
const STORAGE_KEYS = {
  TOKEN: 'ecotrack_token',
  USER: 'ecotrack_user'
};

// ── EmailJS Configuration ─────────────────────────────
const EMAILJS_PUBLIC_KEY   = 'grdE8hvT9O25mIPm0';
const EMAILJS_SERVICE_ID   = 'ecotrack_service';
const EMAILJS_OTP_TEMPLATE = 'template_u2x005o';
const EMAILJS_WELCOME_TEMPLATE = 'template_gunv9po';

// ── EmailJS Init (moved here so it works on ALL pages) ─
(function initEmailJS() {
  if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    console.log('EmailJS initialized ✅');
  } else {
    // Retry once after scripts load
    window.addEventListener('load', function () {
      if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
        console.log('EmailJS initialized ✅ (on load)');
      }
    });
  }
})();


// ── Federated Learning Simulation ─────────────────────
// Research goal: Improve local predictions without sharing raw data.
async function runFederatedTraining() {
  const user = getCurrentUser();
  if (!user) return;

  console.log("🧬 Starting Federated Learning training cycle...");

  // Simulate local model updates based on recent activity
  const entries = await getUserEntries();
  if (entries.length < 3) return;

  // Local "gradient" calculation
  const total = entries.reduce((s, e) => s + e.total, 0);
  const bias = (total / entries.length) > 5.2 ? 0.05 : -0.05;

  // Send ONLY the encrypted gradient update, not the raw entries
  setTimeout(() => {
    console.log(`📡 Federated Update Sent: [Bias: ${bias.toFixed(4)}]`);
    showGlobalToast("Privacy-Safe AI Model Updated! 🧬");
  }, 3000);
}

// India-specific emission factors (Shared with frontend for UI calcs)
const EMISSION_FACTORS = {
  transport: {
    petrol: 2.31, diesel: 2.68, cng: 2.66, electric: 0.82,
    auto: 0.15, bus: 0.08, metro: 0.03, // kg per km per person
    flightEconomy: 0.158, flightBusiness: 0.428, flightFirst: 0.591
  },
  electricity: {
    gridFactor: 0.82,
    lpgCylinder: 42.5, // Standard 14.2kg cylinder ~42.5kg CO2
    pngCubicM: 2.05,
    ac: 1.5, pc: 0.2, tv: 0.1, washer: 0.5 // kWh per hour of use
  },
  food: {
    dietBase: {
      vegan: 0,
      'pure-veg': 0,
      'egg-veg': 0,
      omnivore: 0,
      'heavy-meat': 0
    },
    // Proteins
    beef: 9.0, lamb: 8.5, pork: 2.1, chicken: 1.3, fish: 1.1,
    // Plant Proteins
    pulses: 0.15, tofu: 0.18, nuts: 0.2,
    // Dairy & Eggs
    milk: 0.6, cheese: 1.8, eggs: 0.4,
    // Grains & Produce
    rice: 0.6, grains: 0.25, veggies: 0.15, imports: 0.8,
    // Waste
    waste: 2.5      // per kg
  },
  // NEW: CO2 per bowl (~250-300ml serving)
  // NEW: Categorized dish dictionary
  dishes: {
    vegan: {
      'Dal Tadka': 0.8, 'Mixed Veg': 0.6, 'Rajma Chawal': 0.8, 'Khichdi': 0.7,
      'Vegetable Biryani': 0.9, 'Idli Sambhar': 0.5, 'Poha': 0.4, 'Gobi Manchurian': 0.7,
      'Baingan Bharta': 0.6, 'Bhindi Masala': 0.5, 'Pasta Arabiata': 0.8, 'Salad Bowl': 0.3,
      'Veg Noodles': 0.9, 'Veg Fried Rice': 1.0, 'Sada Dosa': 0.6
    },
    vegetarian: {
      'Dal Makhani': 1.2, 'Paneer Butter Masala': 2.5, 'Palak Paneer': 2.3,
      'Chole Bhature': 1.3, 'Aloo Paratha': 1.0, 'Matar Paneer': 2.4,
      'Malai Kofta': 2.6, 'Handi Paneer': 2.4, 'Margherita Pizza': 1.0,
      'Veg Burger': 1.5, 'Sandwich': 0.9, 'Masala Dosa': 1.7
    },
    egg: {
      'Egg Curry': 1.1, 'Egg Biryani': 1.3, 'Omelette': 0.8, 'Boiled Eggs': 0.5
    },
    meat: {
      'Butter Chicken': 3.0, 'Chicken Biryani': 2.5, 'Mutton Curry': 6.0, 'Fish Curry': 2.2,
      'Chicken Tikka': 2.3, 'Mutton Biryani': 6.5, 'Chicken Korma': 3.2, 'Fish Fry': 2.4,
      'Prawns Masala': 3.5, 'Keema Matar': 5.5, 'Chicken Curry': 2.8, 'Chicken Pizza': 3.0,
      'Chicken Burger': 2.7, 'Chicken Noodles': 2.6, 'Chicken Fried Rice': 2.8
    }
  }
};

// ── API Helpers ───────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth')) {
        logout();
      }
      throw new Error(data.message || 'API request failed');
    }
    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      const msg = " Backend Error: The server on port 5050 is not responding. Please run 'Launch_EcoTrack_AI.bat' and ensure you have MongoDB installed locally.";
      console.warn(msg);
      throw new Error(msg);
    }
    console.error(`API Error (${endpoint}):`, err);
    throw err;
  }
}

// ── Auth Functions ────────────────────────────────────
function getCurrentUser() {
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  return userStr ? JSON.parse(userStr) : null;
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = e.target.querySelector('button');
  const errEl = document.getElementById('loginError');

  try {
    btn.disabled = true;
    btn.textContent = 'Logging in...';

    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));

    // ✅ FIX: Removed welcome email from login — it only belongs in handleRegister

    if (data.user.role === 'admin' || email === 'admin@ecotrack.ai' || email === 'kumarbhavishya384@gmail.com') {
      window.location.href = 'admin_dashboard.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Login to EcoTrack';
  }
}

async function handleForgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById('resetEmail').value.trim();
  const btn = e.target.querySelector('button');
  const statusEl = document.getElementById('resetStatus');

  try {
    btn.disabled = true;
    btn.textContent = 'Sending...';

    const data = await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    statusEl.innerHTML = `<strong>Code Dispatched!</strong> ${data.message}<br><br><a href="#" onclick="switchModal('forgotPasswordModal','resetPasswordModal'); document.getElementById('finalResetEmail').value='${email}'" style="color:var(--primary); font-weight:700;">Proceed to Reset →</a>`;
    statusEl.style.display = 'block';
    btn.textContent = 'Check Email ✔️';
  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.style.display = 'block';
    statusEl.style.background = 'rgba(239, 68, 68, 0.1)';
    statusEl.style.borderColor = 'rgba(239, 68, 68, 0.2)';
    statusEl.style.color = '#ef4444';
    btn.disabled = false;
    btn.textContent = 'Try Again 📧';
  }
}

async function handleFinalReset(e) {
  e.preventDefault();
  const email = document.getElementById('finalResetEmail').value.trim();
  const token = document.getElementById('resetToken').value.trim().toUpperCase();
  const newPassword = document.getElementById('newPassword').value;
  const btn = e.target.querySelector('button');
  const statusEl = document.getElementById('finalResetStatus');

  try {
    btn.disabled = true;
    btn.textContent = 'Updating...';

    const data = await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, newPassword })
    });

    showGlobalToast("Password Reset Successful! Logging you in...");

    // Auto-login after reset
    const loginData = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: newPassword })
    });

    localStorage.setItem(STORAGE_KEYS.TOKEN, loginData.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(loginData.user));
    window.location.href = 'dashboard.html';

  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Update Password';
  }
}

async function sendOTP() {
  const email = document.getElementById('regEmail').value.trim();
  const firstName = document.getElementById('regFirstName')?.value.trim() || 'User';

  if (!email) {
    showGlobalToast("Please enter your email address first.");
    return;
  }

  const btn = document.getElementById('sendOTPBtn');
  btn.disabled = true;
  btn.textContent = "Sending...";

  try {
    // Step 1: Ask backend to generate & store OTP in MongoDB
    const data = await apiFetch('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    if (!data.success) {
      throw new Error(data.message || 'Backend failed to generate OTP');
    }

    const otpCode = data.otp;
    if (!otpCode) {
      throw new Error('No OTP received from server');
    }

    console.log('OTP received from backend:', otpCode);

    // Step 2: Send email via EmailJS with the real OTP
    if (typeof emailjs === 'undefined') {
      throw new Error('EmailJS SDK not loaded. Please refresh and try again.');
    }

    // ✅ Always re-init right before sending — fixes Netlify timing issues
    emailjs.init(EMAILJS_PUBLIC_KEY);

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_OTP_TEMPLATE,
      {
        to_email: email,
        to_name: firstName,
        otp: otpCode,
        email: email
      },
      EMAILJS_PUBLIC_KEY
    );

    console.log('EmailJS result:', result);

    // Step 3: Show OTP field
    document.getElementById('otpGroup').style.display = 'flex';
    btn.textContent = "Resend OTP";
    showGlobalToast("✅ OTP sent to " + email + " — check your inbox!");

  } catch (err) {
    console.error('sendOTP error:', err);
    showGlobalToast("Error: " + (err.text || err.message || 'Something went wrong'));
    btn.textContent = "Send OTP";
  } finally {
    btn.disabled = false;
  }
}


async function handleRegister(e) {
  e.preventDefault();
  const firstName = document.getElementById('regFirstName').value.trim();
  const lastName = document.getElementById('regLastName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const location = document.getElementById('regLocation').value;
  const phone = document.getElementById('regPhone').value.trim();
  const otpInput = document.getElementById('regOTP').value.trim();
  const btn = e.target.querySelector('button');
  const errEl = document.getElementById('regError');

  try {
    btn.disabled = true;
    btn.textContent = 'Verifying OTP...';

    // 1. Verify OTP via email
    const verifyRes = await apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp: otpInput })
    });

    if (!verifyRes.success) {
      throw new Error(verifyRes.message || "OTP verification failed");
    }

    btn.textContent = 'Creating Account...';

    // 2. Proceed with registration if OTP is valid
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName, lastName, email, phone, password, location
      })
    });

    localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));

    // ✅ FIX: Send welcome email only on new registration, using correct firstName variable
    if (typeof emailjs !== 'undefined') {
      emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_WELCOME_TEMPLATE,
        {
          to_email: email,
          first_name: firstName,   // ✅ firstName is properly defined in this scope
          email: email
        }
      ).catch(e => console.warn('Welcome email failed:', e));
    }

    if (data.user.role === 'admin' || email === 'admin@ecotrack.ai' || email === 'kumarbhavishya384@gmail.com') {
      window.location.href = 'admin_dashboard.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Create My Account 🚀';
  }
}

function logout() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  window.location.href = 'index.html';
}

function requireAuth() {
  const user = getCurrentUser();
  if (!user || !localStorage.getItem(STORAGE_KEYS.TOKEN)) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

// ── Sidebar & UI ──────────────────────────────────────
function populateSidebar(user) {
  const avatarEl = document.getElementById('sidebarAvatar');
  const nameEl = document.getElementById('sidebarName');
  const scoreEl = document.getElementById('sidebarScore');
  if (avatarEl) avatarEl.textContent = (user.firstName[0] + (user.lastName ? user.lastName[0] : '')).toUpperCase();
  if (nameEl) nameEl.textContent = `${user.firstName} ${user.lastName || ''}`;
  if (scoreEl) scoreEl.textContent = `EcoScore: ${user.ecoScore || '--'}`;
}

// ── Data Handlers (Now async/API based) ───────────────
async function getUserEntries() {
  const data = await apiFetch('/entries');
  return data.entries || [];
}

async function saveUserEntry(entry) {
  const data = await apiFetch('/entries', {
    method: 'POST',
    body: JSON.stringify(entry)
  });
  // Update local user score
  const user = getCurrentUser();
  if (user) {
    user.ecoScore = data.userEcoScore;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    populateSidebar(user);
  }
  return data;
}

async function deleteUserEntry(date) {
  return await apiFetch(`/entries/${date}`, { method: 'DELETE' });
}

// ── Date & Formatting Utils ───────────────────────────
function getTodayDateStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCO2(val) {
  return Number(val).toFixed(2);
}

function getScoreTier(score) {
  // Ultra-lenient thresholds as per user request: 50+ is Good
  if (score >= 50) return { tier: 'Good Carbon 🟢', color: '#22c55e', bgColor: 'rgba(34,197,94,0.15)' };
  if (score >= 20) return { tier: 'Average Usage 🟡', color: '#eab308', bgColor: 'rgba(234,179,8,0.15)' };
  return { tier: 'High Usage 🔴', color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)' };
}

// ── Modal & UI Controls ───────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

function closeModalOutside(event, id) {
  if (event.target.id === id) closeModal(id);
}

function switchModal(fromId, toId) {
  closeModal(fromId);
  setTimeout(() => openModal(toId), 150);
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
}

// ── Check auth on all app pages ───────────────────────
(async function autoAuthCheck() {
  const appPages = ['dashboard.html', 'calculator.html', 'history.html', 'recommendations.html', 'leaderboard.html', 'offset.html'];
  const pathParts = window.location.pathname.split('/');
  const currentPage = pathParts[pathParts.length - 1];

  if (appPages.includes(currentPage)) {
    const user = requireAuth();
    if (user) {
      populateSidebar(user);
      const dateEl = document.getElementById('currentDate');
      if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      }

      // Sync with backend to get latest profile/score
      try {
        const data = await apiFetch('/auth/me');
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
        populateSidebar(data.user);

        // Initial Notification Check
        initNotifications();
        checkDailyReminder();
      } catch (e) { console.log("Profile sync failed", e); }
    }
  }
})();

// ═══════════════════════════════════════════════════════════════════
//  EcoTrack AI – Daily Reminder + Challenge Notification System
// ═══════════════════════════════════════════════════════════════════

// ─── DAILY REMINDER ──────────────────────────────────────────────

const REMINDER_KEY      = 'ecotrack_reminder_settings';
const REMINDER_LAST_KEY = 'ecotrack_last_reminder';
const REMINDER_DEFAULTS = { enabled: false, time: '20:00', message: "Don't forget to log your carbon footprint today! 🌍", permission: 'default' };

function getReminderSettings() {
  try { const s = localStorage.getItem(REMINDER_KEY); return s ? {...REMINDER_DEFAULTS, ...JSON.parse(s)} : {...REMINDER_DEFAULTS}; }
  catch { return {...REMINDER_DEFAULTS}; }
}
function saveReminderSettings(s) { localStorage.setItem(REMINDER_KEY, JSON.stringify(s)); }

function formatTime12h(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return (h % 12 || 12) + ':' + m.toString().padStart(2,'0') + (h >= 12 ? ' PM' : ' AM');
}

async function enableDailyReminder(time, message) {
  const s = getReminderSettings();
  s.time = time || s.time;
  s.message = message || s.message;
  if (!('Notification' in window)) { showGlobalToast('Your browser does not support notifications.'); return false; }
  let perm = Notification.permission;
  if (perm === 'default') perm = await Notification.requestPermission();
  s.permission = perm;
  if (perm === 'granted') {
    s.enabled = true; saveReminderSettings(s); scheduleReminderLoop();
    showGlobalToast('🔔 Daily reminder set for ' + formatTime12h(s.time) + '!'); return true;
  } else if (perm === 'denied') {
    s.enabled = false; saveReminderSettings(s);
    showGlobalToast('❌ Notifications blocked. Allow them in browser settings.'); return false;
  }
  return false;
}

function disableDailyReminder() {
  const s = getReminderSettings(); s.enabled = false; saveReminderSettings(s);
  showGlobalToast('🔕 Daily reminder disabled.');
}

let _reminderInterval = null;
function scheduleReminderLoop() {
  if (_reminderInterval) clearInterval(_reminderInterval);
  _reminderInterval = setInterval(async () => {
    const s = getReminderSettings();
    if (!s.enabled || Notification.permission !== 'granted') return;
    const now = new Date();
    const hhmm = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
    const today = getTodayDateStr();
    if (hhmm !== s.time) return;
    if (localStorage.getItem(REMINDER_LAST_KEY) === today) return;
    try {
      const entries = await getUserEntries();
      if (!entries.some(e => e.date === today)) fireReminder(s);
      else localStorage.setItem(REMINDER_LAST_KEY, today);
    } catch { fireReminder(s); }
  }, 60000);
}

function fireReminder(settings) {
  localStorage.setItem(REMINDER_LAST_KEY, getTodayDateStr());
  const msgs = [
    '🌱 Time to log your carbon footprint! Every entry helps the planet.',
    '🌍 Daily check-in: How was your footprint today? Log it now!',
    '♻️ Small steps matter! Log today\'s emissions and track your progress.',
    '🌿 Your EcoScore is waiting! Log today\'s activities.',
    '📊 Keep your streak alive — log your carbon footprint for today!'
  ];
  const body = settings.message || msgs[Math.floor(Math.random() * msgs.length)];
  sendPushOrNotification('EcoTrack AI 🌿', body, 'ecotrack-daily-reminder');
  if (window.location.pathname.includes('dashboard')) showReminderBanner(body);
}

function showReminderBanner(message) {
  const ex = document.getElementById('ecoReminderBanner'); if (ex) ex.remove();
  const b = document.createElement('div'); b.id = 'ecoReminderBanner';
  b.innerHTML = `<div style="position:fixed;top:80px;right:1.5rem;z-index:9999;background:linear-gradient(135deg,rgba(0,212,170,0.15),rgba(10,15,30,0.95));border:1px solid rgba(0,212,170,0.4);border-radius:16px;padding:1rem 1.25rem;max-width:320px;width:calc(100vw - 3rem);box-shadow:0 8px 40px rgba(0,0,0,0.5);backdrop-filter:blur(20px);animation:slideInRight 0.4s ease;font-family:'Inter',sans-serif;"><div style="display:flex;align-items:flex-start;gap:.75rem;"><span style="font-size:1.6rem;flex-shrink:0;">🔔</span><div style="flex:1;min-width:0;"><div style="font-weight:700;font-size:.9rem;color:#F0F6FF;margin-bottom:.3rem;">Daily Reminder</div><div style="font-size:.82rem;color:#8B9BB4;line-height:1.5;">${message}</div><div style="display:flex;gap:.5rem;margin-top:.75rem;flex-wrap:wrap;"><button onclick="window.location.href='calculator.html'" style="background:linear-gradient(135deg,var(--primary),var(--secondary));border:none;color:#fff;padding:.4rem .9rem;border-radius:8px;font-size:.78rem;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;">📊 Log Now</button><button onclick="document.getElementById('ecoReminderBanner').remove()" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#8B9BB4;padding:.4rem .9rem;border-radius:8px;font-size:.78rem;cursor:pointer;font-family:'Inter',sans-serif;">Later</button></div></div><button onclick="document.getElementById('ecoReminderBanner').remove()" style="background:none;border:none;color:#4A6080;cursor:pointer;font-size:1.2rem;padding:0;line-height:1;flex-shrink:0;">×</button></div></div>`;
  document.body.appendChild(b);
  setTimeout(() => { if (b.parentNode) b.remove(); }, 12000);
}

function openReminderSettings() {
  const ex = document.getElementById('reminderModal'); if (ex) ex.remove();
  const s = getReminderSettings();
  const isEnabled = s.enabled && Notification.permission === 'granted';
  const isDenied  = Notification.permission === 'denied';
  const presets   = [['08:00','Morning ☀️'],['12:00','Noon 🌤️'],['18:00','Evening 🌆'],['20:00','Night 🌙'],['22:00','Late 🌚']];
  const m = document.createElement('div'); m.id = 'reminderModal';
  m.innerHTML = `<div style="position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(16px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeIn .2s ease;" onclick="if(event.target===this)this.remove()"><div style="background:linear-gradient(135deg,rgba(10,20,40,.98),rgba(13,21,38,.98));border:1px solid rgba(0,212,170,.25);border-radius:20px;padding:2rem;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.6);font-family:'Inter',sans-serif;max-height:90vh;overflow-y:auto;"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;"><div style="display:flex;align-items:center;gap:.75rem;"><span style="font-size:1.8rem;">🔔</span><div><h3 style="font-family:'Space Grotesk',sans-serif;font-size:1.2rem;color:#F0F6FF;margin:0;">Daily Reminder</h3><p style="font-size:.78rem;color:#8B9BB4;margin:0;">Get notified to log your footprint</p></div></div><button onclick="document.getElementById('reminderModal').remove()" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#8B9BB4;width:32px;height:32px;border-radius:8px;font-size:1.1rem;cursor:pointer;">×</button></div><div style="background:${isEnabled?'rgba(0,212,170,.08)':'rgba(255,255,255,.04)'};border:1px solid ${isEnabled?'rgba(0,212,170,.3)':'rgba(255,255,255,.08)'};border-radius:12px;padding:.9rem 1rem;margin-bottom:1.25rem;display:flex;align-items:center;gap:.75rem;"><div style="width:10px;height:10px;border-radius:50%;flex-shrink:0;background:${isEnabled?'var(--primary)':'#4A6080'};${isEnabled?'box-shadow:0 0 8px var(--primary);':''}" ></div><span style="font-size:.85rem;color:${isEnabled?'var(--primary)':'#8B9BB4'};font-weight:600;">${isEnabled?'✅ Active — fires at '+formatTime12h(s.time):'⭕ Reminder Disabled'}</span></div>${isDenied?'<div style="background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.3);border-radius:10px;padding:.75rem 1rem;margin-bottom:1.25rem;font-size:.8rem;color:#fca5a5;line-height:1.5;">⚠️ Notifications are <b>blocked</b>. Go to browser Settings → Site Settings → Notifications → Allow.</div>':''}<div style="margin-bottom:1.1rem;"><label style="display:block;font-size:.82rem;font-weight:600;color:#8B9BB4;margin-bottom:.5rem;">REMINDER TIME</label><input type="time" id="reminderTimeInput" value="${s.time}" style="width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#F0F6FF;border-radius:12px;padding:.75rem 1rem;font-size:1rem;font-family:'Inter',sans-serif;outline:none;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='rgba(255,255,255,.1)'"></div><div style="margin-bottom:1rem;"><label style="display:block;font-size:.82rem;font-weight:600;color:#8B9BB4;margin-bottom:.5rem;">CUSTOM MESSAGE (optional)</label><input type="text" id="reminderMsgInput" value="${s.message}" placeholder="Don't forget to log!" style="width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#F0F6FF;border-radius:12px;padding:.75rem 1rem;font-size:.88rem;font-family:'Inter',sans-serif;outline:none;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='rgba(255,255,255,.1)'"></div><div style="margin-bottom:1.5rem;"><label style="display:block;font-size:.82rem;font-weight:600;color:#8B9BB4;margin-bottom:.6rem;">QUICK PRESETS</label><div style="display:flex;gap:.5rem;flex-wrap:wrap;">${presets.map(([t,l])=>`<button onclick="document.getElementById('reminderTimeInput').value='${t}'" style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#8B9BB4;padding:.35rem .75rem;border-radius:8px;font-size:.75rem;cursor:pointer;font-family:'Inter',sans-serif;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='#8B9BB4'">${l}</button>`).join('')}</div></div><div style="display:flex;flex-direction:column;gap:.75rem;"><button onclick="handleSaveReminder()" style="background:linear-gradient(135deg,var(--primary),var(--secondary));border:none;color:#fff;padding:.85rem;border-radius:12px;font-size:.95rem;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;width:100%;">🔔 Enable Daily Reminder</button>${isEnabled?`<button onclick="handleDisableReminder()" style="background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.3);color:rgba(255,107,107,.8);padding:.7rem;border-radius:12px;font-size:.88rem;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;width:100%;">🔕 Disable Reminder</button>`:''}<button onclick="handleTestReminder()" style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#8B9BB4;padding:.7rem;border-radius:12px;font-size:.85rem;cursor:pointer;font-family:'Inter',sans-serif;width:100%;">🧪 Send Test Notification</button></div></div></div>`;
  document.body.appendChild(m);
}

async function handleSaveReminder() {
  const time = document.getElementById('reminderTimeInput').value;
  const msg  = document.getElementById('reminderMsgInput').value.trim();
  if (!time) { showGlobalToast('⚠️ Please select a time.'); return; }
  const ok = await enableDailyReminder(time, msg || REMINDER_DEFAULTS.message);
  if (ok) document.getElementById('reminderModal').remove();
}
function handleDisableReminder() { disableDailyReminder(); document.getElementById('reminderModal').remove(); }
async function handleTestReminder() {
  if (Notification.permission !== 'granted') {
    const p = await Notification.requestPermission();
    if (p !== 'granted') { showGlobalToast('❌ Please allow notifications first.'); return; }
    const s = getReminderSettings(); s.permission = 'granted'; saveReminderSettings(s);
  }
  fireReminder({ ...getReminderSettings(), message: '🧪 Test: This is your EcoTrack daily reminder!' });
  showGlobalToast('✅ Test notification sent!');
}

async function initNotifications() {
  const s = getReminderSettings();
  const btn = document.getElementById('enableNotificationsBtn');
  if (btn) {
    btn.style.display = 'inline-flex';
    btn.title = s.enabled ? 'Reminder: ' + formatTime12h(s.time) : 'Set Daily Reminder';
    btn.style.color = s.enabled ? 'var(--primary)' : '';
    btn.onclick = openReminderSettings;
  }
  if (s.enabled && Notification.permission === 'granted') scheduleReminderLoop();
  else if (s.enabled && Notification.permission === 'denied') {
    s.enabled = false; s.permission = 'denied'; saveReminderSettings(s);
  }
  // Also init challenge reminders
  initChallengeNotifications();
}

async function checkDailyReminder() {
  const s = getReminderSettings();
  if (!s.enabled || Notification.permission !== 'granted') return;
  const today = getTodayDateStr();
  if (localStorage.getItem(REMINDER_LAST_KEY) === today) return;
  try {
    const entries = await getUserEntries();
    if (!entries.some(e => e.date === today) && window.location.pathname.includes('dashboard')) {
      setTimeout(() => showReminderBanner(s.message), 3000);
      localStorage.setItem(REMINDER_LAST_KEY, today);
    }
  } catch(e) { console.warn('checkDailyReminder failed', e); }
}

// ─── SHARED PUSH HELPER ───────────────────────────────────────────

function sendPushOrNotification(title, body, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SHOW_REMINDER', title, body });
  } else {
    try { new Notification(title, { body, icon: '/logo.png', badge: '/logo.png', tag, renotify: true }); }
    catch(e) { console.warn('Notification failed:', e); }
  }
}

// ─── CHALLENGES ───────────────────────────────────────────────────

const CHALLENGES_KEY = 'ecotrack_challenges';

const ALL_CHALLENGES = [
  {
    id: 'plant_based_week', icon: '🥦', title: 'Plant-Based Week',
    desc: 'Eat only plant-based meals for 7 days. Reduces food emissions by up to 50%.',
    category: 'food', difficulty: 'Easy', points: 150, days: 7, co2Saved: 14,
    tips: [
      '🥗 Try dal, sabzi, or tofu stir-fry tonight!',
      '🍎 Fruits make a great snack instead of packaged food.',
      '🌽 Indian cuisine is naturally rich in plant-based options!',
      '🧆 Chana masala is a perfect high-protein plant meal.',
      '🥕 Prep veggies the night before to make cooking easier.',
      '🌾 Try millet or quinoa instead of white rice.',
      '🎉 Final day! You\'ve almost completed the Plant-Based Week!'
    ]
  },
  {
    id: 'public_transport', icon: '🚌', title: 'Public Transport Only',
    desc: 'Use only public transport, cycle or walk for 5 days.',
    category: 'transport', difficulty: 'Medium', points: 200, days: 5, co2Saved: 20,
    tips: [
      '🗺️ Plan your metro/bus route the night before.',
      '🚲 Can you cycle the last mile from the station?',
      '⏰ Leave 10 minutes early to catch the bus comfortably.',
      '📱 Download your city\'s transit app for live updates.',
      '🏆 Last day! You\'ve saved nearly 20 kg CO₂ this week!'
    ]
  },
  {
    id: 'no_ac_week', icon: '🌬️', title: 'AC-Free Week',
    desc: 'Avoid using air conditioning for 7 days. Use fans and natural ventilation.',
    category: 'electricity', difficulty: 'Hard', points: 250, days: 7, co2Saved: 25,
    tips: [
      '🪟 Open windows early morning for cool air.',
      '🌿 Keep curtains closed during peak afternoon heat.',
      '💧 A wet towel on your neck keeps you cool!',
      '🌙 Nights are cooler — use a fan instead of AC.',
      '🏠 Ceiling fans use 90% less electricity than AC.',
      '🌊 Take a cool shower before bed.',
      '🎊 Final day! You completed the AC-Free Week!'
    ]
  },
  {
    id: 'zero_waste', icon: '♻️', title: '3-Day Zero Waste',
    desc: 'Produce zero non-recyclable waste for 3 days.',
    category: 'food', difficulty: 'Easy', points: 100, days: 3, co2Saved: 6,
    tips: [
      '🛍️ Carry a cloth bag today — refuse plastic bags.',
      '💧 Refill your water bottle instead of buying plastic.',
      '🥡 Bring a tiffin box for lunch instead of disposables!'
    ]
  },
  {
    id: 'efficient_cooking', icon: '☀️', title: 'Efficient Cooking Week',
    desc: 'Use pressure cooker or batch-cook to cut kitchen emissions for 5 days.',
    category: 'electricity', difficulty: 'Easy', points: 120, days: 5, co2Saved: 10,
    tips: [
      '🍲 Pressure cookers save 70% energy vs open pots.',
      '♨️ Batch-cook dal or rice for multiple meals.',
      '🌡️ Use lids on pots to retain heat.',
      '⚡ Microwaves use 80% less energy for reheating.',
      '🎉 Challenge complete! Great job reducing kitchen emissions!'
    ]
  }
];

function getJoinedChallenges() {
  try { const s = localStorage.getItem(CHALLENGES_KEY); return s ? JSON.parse(s) : {}; }
  catch { return {}; }
}
function saveJoinedChallenges(d) { localStorage.setItem(CHALLENGES_KEY, JSON.stringify(d)); }

async function joinChallengeWithPermission(id) {
  const challenge = ALL_CHALLENGES.find(c => c.id === id);
  if (!challenge) return;
  const joined = getJoinedChallenges();
  if (joined[id] && !joined[id].completed) { showGlobalToast('✅ Already joined!'); return; }

  if ('Notification' in window && Notification.permission === 'default') {
    showGlobalToast('📬 Allow notifications to get daily challenge tips!');
    await Notification.requestPermission();
  }

  const now = new Date(), end = new Date(now);
  end.setDate(end.getDate() + challenge.days);
  joined[id] = { joinedAt: now.toISOString(), endsAt: end.toISOString(), progress: 0, lastNotified: null, completed: false };
  saveJoinedChallenges(joined);

  showGlobalToast(`🎯 Joined "${challenge.title}"! Daily tips incoming 🔔`);
  _fireChallengeNotif(challenge, joined[id]);
  scheduleChallengeReminders();
  renderChallengesWithNotifications();
}

function leaveChallengeById(id) {
  const joined = getJoinedChallenges(); delete joined[id]; saveJoinedChallenges(joined);
  showGlobalToast('🔕 Left the challenge.');
  renderChallengesWithNotifications();
}

function _fireChallengeNotif(challenge, state) {
  const day  = state.progress;
  const tips = challenge.tips || [];
  const tip  = tips[Math.min(day, tips.length - 1)] || 'Keep going!';
  const left = challenge.days - day;
  const title = day === 0
    ? `🎯 Challenge Started: ${challenge.title}!`
    : left <= 1 ? `🏆 Final Day: ${challenge.title}` : `📅 Day ${day + 1}/${challenge.days}: ${challenge.title}`;
  const body = `${tip} — ${left} day${left !== 1 ? 's' : ''} left, ${challenge.co2Saved}kg CO₂ to save!`;

  sendPushOrNotification(title, body, `challenge-${challenge.id}`);
  _showChallengeBanner(challenge, title, tip, day, challenge.days);
}

function _showChallengeBanner(challenge, title, tip, dayNum, totalDays) {
  const ex = document.getElementById('challengeBanner'); if (ex) ex.remove();
  const topOffset = document.getElementById('ecoReminderBanner') ? '210px' : '80px';
  const pct = Math.round((dayNum / totalDays) * 100);
  const b = document.createElement('div'); b.id = 'challengeBanner';
  b.innerHTML = `<div style="position:fixed;top:${topOffset};right:1.5rem;z-index:9998;background:linear-gradient(135deg,rgba(59,130,246,.15),rgba(10,15,30,.95));border:1px solid rgba(59,130,246,.4);border-radius:16px;padding:1rem 1.25rem;max-width:320px;width:calc(100vw - 3rem);box-shadow:0 8px 40px rgba(0,0,0,.5);backdrop-filter:blur(20px);animation:slideInRight .4s ease;font-family:'Inter',sans-serif;"><div style="display:flex;align-items:flex-start;gap:.75rem;"><span style="font-size:1.5rem;flex-shrink:0;">${challenge.icon}</span><div style="flex:1;min-width:0;"><div style="font-weight:700;font-size:.85rem;color:#F0F6FF;margin-bottom:.2rem;">${title}</div><div style="font-size:.79rem;color:#8B9BB4;line-height:1.5;margin-bottom:.5rem;">${tip}</div><div style="height:4px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;margin-bottom:.35rem;"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#3B82F6,#06FFA5);border-radius:2px;"></div></div><div style="font-size:.7rem;color:#4A6080;margin-bottom:.6rem;">Day ${dayNum}/${totalDays} · ${pct}% complete</div><div style="display:flex;gap:.5rem;"><button onclick="window.location.href='recommendations.html'" style="background:rgba(59,130,246,.2);border:1px solid rgba(59,130,246,.4);color:#93C5FD;padding:.3rem .7rem;border-radius:8px;font-size:.74rem;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;">View Challenge</button><button onclick="document.getElementById('challengeBanner').remove()" style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:#4A6080;padding:.3rem .7rem;border-radius:8px;font-size:.74rem;cursor:pointer;font-family:'Inter',sans-serif;">OK</button></div></div><button onclick="document.getElementById('challengeBanner').remove()" style="background:none;border:none;color:#4A6080;cursor:pointer;font-size:1.1rem;padding:0;flex-shrink:0;">×</button></div></div>`;
  document.body.appendChild(b);
  setTimeout(() => { if (b.parentNode) b.remove(); }, 15000);
}

function _fireChallengeComplete(challenge) {
  sendPushOrNotification(
    `🏆 Challenge Complete: ${challenge.title}!`,
    `Amazing! You saved ${challenge.co2Saved}kg CO₂ and earned +${challenge.points} points! 🎉`,
    `challenge-complete-${challenge.id}`
  );
  const overlay = document.createElement('div');
  overlay.innerHTML = `<div style="position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(12px);z-index:10001;display:flex;align-items:center;justify-content:center;padding:1rem;" onclick="this.remove()"><div style="background:linear-gradient(135deg,rgba(10,20,40,.98),rgba(13,21,38,.98));border:1px solid rgba(0,212,170,.4);border-radius:24px;padding:2rem;max-width:360px;width:calc(100vw - 2rem);box-shadow:0 20px 60px rgba(0,0,0,.7),0 0 40px rgba(0,212,170,.2);text-align:center;font-family:'Inter',sans-serif;animation:fadeIn .3s ease;" onclick="event.stopPropagation()"><div style="font-size:3rem;margin-bottom:.75rem;">🏆</div><h2 style="font-family:'Space Grotesk',sans-serif;color:#F0F6FF;margin-bottom:.5rem;">Challenge Complete!</h2><p style="color:var(--primary);font-size:1.1rem;font-weight:700;margin-bottom:.5rem;">${challenge.icon} ${challenge.title}</p><p style="color:#8B9BB4;font-size:.88rem;margin-bottom:1.25rem;line-height:1.5;">You saved <strong style="color:var(--primary)">${challenge.co2Saved} kg CO₂</strong> and earned <strong style="color:#FBBF24">+${challenge.points} points</strong>!</p><div style="height:2px;background:linear-gradient(90deg,transparent,var(--primary),transparent);margin-bottom:1.25rem;"></div><div style="display:flex;gap:.75rem;justify-content:center;"><button onclick="this.closest('[onclick]').remove()" style="background:linear-gradient(135deg,var(--primary),var(--secondary));border:none;color:#fff;padding:.7rem 1.5rem;border-radius:12px;font-size:.9rem;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;">🎯 Join Another</button><button onclick="this.closest('[onclick]').remove()" style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#8B9BB4;padding:.7rem 1.25rem;border-radius:12px;font-size:.9rem;cursor:pointer;font-family:'Inter',sans-serif;">Close</button></div></div></div>`;
  document.body.appendChild(overlay);
  showGlobalToast(`🏆 ${challenge.title} complete! +${challenge.points} pts`);
}

let _challengeInterval = null;
function scheduleChallengeReminders() {
  if (_challengeInterval) clearInterval(_challengeInterval);
  _challengeInterval = setInterval(checkChallengeProgress, 60000);
}

function checkChallengeProgress() {
  const joined = getJoinedChallenges();
  const today  = getTodayDateStr();
  let updated  = false;
  Object.keys(joined).forEach(id => {
    const state     = joined[id];
    const challenge = ALL_CHALLENGES.find(c => c.id === id);
    if (!challenge || state.completed || state.lastNotified === today) return;
    const daysPassed = Math.floor((Date.now() - new Date(state.joinedAt)) / 86400000);
    state.progress    = Math.min(daysPassed, challenge.days);
    state.lastNotified = today;
    updated = true;
    if (state.progress >= challenge.days) { state.completed = true; _fireChallengeComplete(challenge); }
    else _fireChallengeNotif(challenge, state);
  });
  if (updated) { saveJoinedChallenges(joined); renderChallengesWithNotifications(); }
}

function initChallengeNotifications() {
  const joined = getJoinedChallenges();
  if (Object.values(joined).some(s => !s.completed)) {
    scheduleChallengeReminders();
    setTimeout(checkChallengeProgress, 2500);
  }
}

function renderChallengesWithNotifications(containerId) {
  const grid = document.getElementById(containerId || 'challengesGrid') || document.getElementById('dashboardChallenges');
  if (!grid) return;
  const joined = getJoinedChallenges();
  const diffColor = { Easy:'#00D4AA', Medium:'#FBBF24', Hard:'#FF6B6B' };

  grid.innerHTML = ALL_CHALLENGES.map(ch => {
    const state    = joined[ch.id];
    const isJoined = !!state && !state.completed;
    const isDone   = state && state.completed;
    const progress = state ? state.progress : 0;
    const pct      = Math.round((progress / ch.days) * 100);
    const col      = diffColor[ch.difficulty] || '#8B9BB4';
    return `
      <div class="challenge-card" style="background:rgba(255,255,255,.04);border:1px solid ${isJoined?'rgba(0,212,170,.3)':'var(--border)'};border-radius:var(--radius);padding:1.25rem;transition:var(--transition);${isJoined?'box-shadow:0 0 20px rgba(0,212,170,.08);':''}">
        <div style="display:flex;align-items:flex-start;gap:.75rem;margin-bottom:.75rem;">
          <span style="font-size:2rem;flex-shrink:0;">${ch.icon}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:.95rem;color:#F0F6FF;">${ch.title}</div>
            <div style="display:flex;align-items:center;gap:.4rem;margin-top:.2rem;">
              <span style="font-size:.7rem;font-weight:700;color:${col};background:${col}18;padding:.15rem .5rem;border-radius:50px;">${ch.difficulty}</span>
              <span style="font-size:.7rem;color:#4A6080;">· ${ch.days} days · ${ch.co2Saved}kg CO₂</span>
            </div>
          </div>
          ${isDone ? '<span style="font-size:1.2rem;" title="Completed">🏆</span>' : ''}
        </div>
        <p style="font-size:.8rem;color:#8B9BB4;line-height:1.5;margin-bottom:.75rem;">${ch.desc}</p>
        ${isJoined ? `
          <div style="margin-bottom:.75rem;">
            <div style="display:flex;justify-content:space-between;font-size:.72rem;color:#4A6080;margin-bottom:.3rem;"><span>Day ${progress}/${ch.days}</span><span>${pct}%</span></div>
            <div style="height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--primary),#06FFA5);border-radius:3px;transition:width .5s;"></div>
            </div>
          </div>` : ''}
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem;">
          <span style="font-size:.75rem;color:#FBBF24;font-weight:600;">🌟 +${ch.points} pts</span>
          <span style="font-size:.75rem;color:#4A6080;">·</span>
          <span style="font-size:.75rem;color:var(--primary);font-weight:600;">🌍 ${ch.co2Saved}kg saved</span>
        </div>
        ${isDone
          ? `<div style="background:rgba(0,212,170,.1);border:1px solid rgba(0,212,170,.2);border-radius:10px;padding:.5rem;text-align:center;font-size:.8rem;font-weight:700;color:var(--primary);">✅ Completed!</div>`
          : isJoined
            ? `<div style="display:flex;gap:.5rem;">
                <div style="flex:1;background:rgba(0,212,170,.1);border:1px solid rgba(0,212,170,.2);border-radius:10px;padding:.5rem;text-align:center;font-size:.8rem;font-weight:700;color:var(--primary);">🔔 Active</div>
                <button onclick="leaveChallengeById('${ch.id}')" style="background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.2);border-radius:10px;padding:.5rem .75rem;font-size:.78rem;color:rgba(255,107,107,.7);cursor:pointer;font-family:'Inter',sans-serif;">Leave</button>
              </div>`
            : `<button onclick="joinChallengeWithPermission('${ch.id}')" style="width:100%;background:linear-gradient(135deg,var(--primary),var(--secondary));border:none;color:#fff;padding:.6rem;border-radius:10px;font-size:.85rem;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;box-shadow:0 4px 15px rgba(0,212,170,.2);" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">🎯 Join Challenge</button>`}
      </div>`;
  }).join('');
}

// Legacy wrapper
function joinChallenge(btn) {
  const item = btn ? btn.closest('.challenge-item') : null;
  if (item) { item.classList.add('joined'); btn.textContent = '✅ Joined'; btn.disabled = true; }
  showGlobalToast('🎯 Challenge joined! Daily tips incoming 🔔');
}


// ── Floating Scroll Logic ─────────────────────────────
function scrollMainTo(dir) {
  const main = document.querySelector('.main-content');
  if (!main) return;
  if (dir === 'top') {
    main.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    main.scrollBy({ top: main.clientHeight * 0.85, behavior: 'smooth' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('.main-content');
  const topBtn = document.getElementById('scrollTopBtn');
  const downBtn = document.getElementById('scrollDownBtn');
  if (!main || !topBtn || !downBtn) return;

  main.addEventListener('scroll', () => {
    const scrollTop = main.scrollTop;
    const scrollMax = main.scrollHeight - main.clientHeight;
    const nearBottom = scrollTop >= scrollMax - 80;
    if (scrollTop > 200) { topBtn.style.display = 'flex'; } else { topBtn.style.display = 'none'; }
    if (nearBottom) { downBtn.style.opacity = '0.3'; } else { downBtn.style.opacity = '1'; }
  });
});

function showGlobalToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `<span style="font-size:1.2rem">🌿</span><span style="font-size:0.9rem">${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
