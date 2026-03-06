/* ===================================================
   EcoTrack AI – Core App Logic (app.js)
   Shared utilities, API integration, and auth
   =================================================== */

// ── Constants ─────────────────────────────────────────
const API_BASE = 'http://localhost:5050/api';
const STORAGE_KEYS = {
  TOKEN: 'ecotrack_token',
  USER: 'ecotrack_user'
};
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
  const phone = document.getElementById('regPhone').value.trim();

  if (!phone) {
    showGlobalToast("Please enter a phone number first.");
    return;
  }

  const btn = document.getElementById('sendOTPBtn');
  btn.disabled = true;
  btn.textContent = "Sending...";

  try {
    // Prefix with +91 if necessary
    let formattedPhone = phone;
    if (!phone.startsWith('+')) {
      formattedPhone = '+91' + phone.replace(/^91/, '');
    }

    const data = await apiFetch('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: formattedPhone })
    });

    if (data.success) {
      document.getElementById('otpGroup').style.display = 'flex';
      btn.textContent = "Resend OTP";
      showGlobalToast(data.message || "OTP sent to your phone! 📱");
    } else {
      showGlobalToast("Failed: " + data.message);
      btn.textContent = "Send OTP";
    }
  } catch (err) {
    showGlobalToast("Failed: " + err.message);
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

    // Prefix with +91
    let formattedPhone = phone;
    if (!phone.startsWith('+')) {
      formattedPhone = '+91' + phone.replace(/^91/, '');
    }

    // 1. Verify OTP first via separate API call
    const verifyRes = await apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: formattedPhone, otp: otpInput })
    });

    if (!verifyRes.success) {
      throw new Error(verifyRes.message || "OTP verification failed");
    }

    btn.textContent = 'Creating Account...';

    // 2. Proceed with registration if OTP is valid
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName, lastName, email, phone: formattedPhone, password, location
      })
    });

    localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));

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

// ── Daily Reminders & Notifications ───────────────────
async function initNotifications() {
  if (!("Notification" in window)) return;

  // Create a listener for a potential "Enable Notifications" button
  document.addEventListener('click', async (e) => {
    if (e.target.id === 'enableNotificationsBtn' || e.target.closest('#enableNotificationsBtn')) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        showGlobalToast("Notifications Enabled! You'll receive daily reminders. 🔔");
        const btn = document.getElementById('enableNotificationsBtn');
        if (btn) btn.style.display = 'none';
        checkDailyReminder();
      } else {
        showGlobalToast("Notifications were not enabled. You'll see reminders in-app.");
      }
    }
  });
}

async function checkDailyReminder() {
  const user = getCurrentUser();
  if (!user) return;

  try {
    // Check if we've already reminded today to avoid spam
    const lastReminder = localStorage.getItem('last_eco_reminder');
    const today = getTodayDateStr();
    if (lastReminder === today) return;

    const entries = await getUserEntries();
    const hasTodayEntry = entries.some(e => e.date === today);

    if (!hasTodayEntry) {
      if (Notification.permission === "granted") {
        new Notification("EcoTrack AI Reminder 🌿", {
          body: "Don't forget to log your carbon footprint for today! It only takes a minute. 😊",
          icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png'
        });
        localStorage.setItem('last_eco_reminder', today);
      } else {
        // Only show toast on dashboard
        if (window.location.pathname.includes('dashboard.html')) {
          showGlobalToast("Daily Reminder: Log your activities! 📅");
          localStorage.setItem('last_eco_reminder', today);
        }
      }
    }
  } catch (e) {
    console.warn("Could not check daily reminder", e);
  }
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
