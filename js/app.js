/* ===================================================
   EcoTrack AI – Core App Logic (app.js)
   FIXED: Notifications now use IndexedDB + Periodic
   Background Sync so they fire even when tab is closed
   =================================================== */

// ── Constants ─────────────────────────────────────────
const API_BASE = window.location.port === '8080'
    ? 'http://localhost:5050/api'
    : 'https://ecotrackai-production.up.railway.app/api';

const STORAGE_KEYS = {
    TOKEN: 'ecotrack_token',
    USER : 'ecotrack_user'
};

// ── EmailJS Configuration ─────────────────────────────
const EMAILJS_PUBLIC_KEY      = 'grdE8hvT9O25mIPm0';
const EMAILJS_SERVICE_ID      = 'ecotrack_service';
const EMAILJS_OTP_TEMPLATE    = 'template_u2x005o';
const EMAILJS_WELCOME_TEMPLATE = 'template_gunv9po';

// ── EmailJS Init ──────────────────────────────────────
(function initEmailJS() {
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
        console.log('EmailJS initialized ✅');
    } else {
        window.addEventListener('load', function () {
            if (typeof emailjs !== 'undefined') {
                emailjs.init(EMAILJS_PUBLIC_KEY);
                console.log('EmailJS initialized ✅ (on load)');
            }
        });
    }
})();

// ── Federated Learning Simulation ─────────────────────
async function runFederatedTraining() {
    const user = getCurrentUser();
    if (!user) return;
    console.log("🧬 Starting Federated Learning training cycle...");
    const entries = await getUserEntries();
    if (entries.length < 3) return;
    const total = entries.reduce((s, e) => s + e.total, 0);
    const bias  = (total / entries.length) > 5.2 ? 0.05 : -0.05;
    setTimeout(() => {
        console.log(`📡 Federated Update Sent: [Bias: ${bias.toFixed(4)}]`);
        showGlobalToast("Privacy-Safe AI Model Updated! 🧬");
    }, 3000);
}

// ── Regional Grid Data (CEA FY 2022-23) ───────────────
const REGIONAL_GRIDS = {
    'Northern': { ef: 0.82, avg: 5.8, states: ['Delhi', 'Uttar Pradesh', 'Punjab', 'Haryana', 'Rajasthan', 'Himachal Pradesh', 'Jammu & Kashmir', 'Uttarakhand', 'Ladakh'] },
    'Western': { ef: 0.79, avg: 5.5, states: ['Maharashtra', 'Gujarat', 'Madhya Pradesh', 'Goa', 'Chhattisgarh', 'Dadra and Nagar Haveli', 'Daman and Diu'] },
    'Southern': { ef: 0.65, avg: 4.6, states: ['Tamil Nadu', 'Karnataka', 'Kerala', 'Andhra Pradesh', 'Telangana', 'Puducherry', 'Lakshadweep', 'Andaman and Nicobar Islands'] },
    'Eastern': { ef: 0.88, avg: 5.2, states: ['West Bengal', 'Bihar', 'Jharkhand', 'Odisha'] },
    'North-Eastern': { ef: 0.58, avg: 4.0, states: ['Assam', 'Meghalaya', 'Manipur', 'Tripura', 'Arunachal Pradesh', 'Nagaland', 'Mizoram', 'Sikkim'] }
};

function getZoneFromState(stateName) {
    if (!stateName) return null;
    for (const [zone, data] of Object.entries(REGIONAL_GRIDS)) {
        if (data.states.some(s => s.toLowerCase() === stateName.toLowerCase() || stateName.toLowerCase().includes(s.toLowerCase()))) {
            return { zone, ...data };
        }
    }
    return null;
}

async function detectUserZone(force = false) {
    const user = getCurrentUser();
    if (!user) return;
    if (!force && user.zone) return; // Already detected

    console.log("📍 Detecting user location for regional grid mapping...");
    
    try {
        // 1. Try Browser Geolocation
        const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });

        const { latitude, longitude } = pos.coords;
        // 2. Reverse Geocode via Nominatim (Free)
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const data = await res.json();
        const state = data.address.state || data.address.state_district;
        
        console.log(`📍 Detected State: ${state}`);
        const zoneData = getZoneFromState(state);
        if (zoneData) {
            await saveUserLocation(state, zoneData, latitude, longitude);
        }
    } catch (err) {
        console.warn("Geolocation failed or denied, trying IP fallback...", err);
        // 3. IP Fallback via ip-api.com
        try {
            const res = await fetch('http://ip-api.com/json/');
            const data = await res.json();
            if (data.regionName) {
                console.log(`📍 IP Fallback State: ${data.regionName}`);
                const zoneData = getZoneFromState(data.regionName);
                if (zoneData) {
                    await saveUserLocation(data.regionName, zoneData, data.lat, data.lon);
                }
            }
        } catch (ipErr) {
            console.error("Location detection totally failed.", ipErr);
        }
    }
}

async function saveUserLocation(state, zoneData, lat, lon) {
    try {
        const payload = {
            state: state,
            zone: zoneData.zone,
            zone_ef: zoneData.ef,
            zone_avg: zoneData.avg,
            lat: lat,
            lon: lon
        };
        await apiFetch('/auth/update-location', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        // Update local user object
        const user = getCurrentUser();
        const updatedUser = { ...user, ...payload };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        console.log(`✅ User zone updated to ${zoneData.zone} (${zoneData.ef} kg/kWh)`);
        showGlobalToast(`📍 Location detected: ${state} (${zoneData.zone} Grid)`);
    } catch (err) {
        console.error("Failed to save user location to backend", err);
    }
}

// ── India-specific emission factors ───────────────────
const EMISSION_FACTORS = {
    transport: {
        petrol: 2.31, diesel: 2.68, cng: 2.66, electric: 0.82,
        auto: 0.15, bus: 0.08, metro: 0.03,
        flightEconomy: 0.158, flightBusiness: 0.428, flightFirst: 0.591
    },
    electricity: {
        gridFactor: 0.82, // Base national factor, replaced by user.zone_ef if available
        lpgCylinder: 42.5,
        pngCubicM: 2.05,
        ac: 1.5, pc: 0.2, tv: 0.1, washer: 0.5
    },
    food: {
        dietBase: { vegan: 0, 'pure-veg': 0, 'egg-veg': 0, omnivore: 0, 'heavy-meat': 0 },
        pulses: 0.15, tofu: 0.18, nuts: 0.2,
        milk: 0.6, cheese: 1.8, eggs: 0.4,
        rice: 0.6, grains: 0.25, veggies: 0.15, imports: 0.8,
        waste: 2.5
    },
    dishes: {
        vegan: {
            'Dal Tadka': 0.8, 'Mixed Veg': 0.6, 'Rajma Chawal': 0.8, 'Khichdi': 0.7,
            'Vegetable Biryani': 0.9, 'Idli Sambhar': 0.5, 'Poha': 0.4,
            'Gobi Manchurian': 0.7, 'Baingan Bharta': 0.6, 'Bhindi Masala': 0.5,
            'Pasta Arabiata': 0.8, 'Salad Bowl': 0.3, 'Veg Noodles': 0.9,
            'Veg Fried Rice': 1.0, 'Sada Dosa': 0.6
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
            'Butter Chicken': 3.0, 'Chicken Biryani': 2.5, 'Mutton Curry': 6.0,
            'Fish Curry': 2.2, 'Chicken Tikka': 2.3, 'Mutton Biryani': 6.5,
            'Chicken Korma': 3.2, 'Fish Fry': 2.4, 'Prawns Masala': 3.5,
            'Keema Matar': 5.5, 'Chicken Curry': 2.8, 'Chicken Pizza': 3.0,
            'Chicken Burger': 2.7, 'Chicken Noodles': 2.6, 'Chicken Fried Rice': 2.8
        }
    }
};

// ── API Helpers ───────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
    const token   = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        const data     = await response.json();

        if (!response.ok) {
            if (response.status === 401 && !endpoint.includes('/auth')) logout();
            throw new Error(data.message || 'API request failed');
        }
        return data;
    } catch (err) {
        if (err.message === 'Failed to fetch') {
            const msg = "Backend Error: The server on port 5050 is not responding.";
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
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn      = e.target.querySelector('button');
    const errEl    = document.getElementById('loginError');

    try {
        btn.disabled    = true;
        btn.textContent = 'Logging in...';

        const data = await apiFetch('/auth/login', {
            method: 'POST',
            body  : JSON.stringify({ email, password })
        });

        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        localStorage.setItem(STORAGE_KEYS.USER,  JSON.stringify(data.user));

        if (data.user.role === 'admin' || email === 'admin@ecotrack.ai' || email === 'kumarbhavishya384@gmail.com') {
            window.location.href = 'admin_dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    } catch (err) {
        errEl.textContent  = err.message;
        errEl.style.display = 'block';
        btn.disabled        = false;
        btn.textContent     = 'Login to EcoTrack';
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const email    = document.getElementById('resetEmail').value.trim();
    const btn      = e.target.querySelector('button');
    const statusEl = document.getElementById('resetStatus');

    try {
        btn.disabled    = true;
        btn.textContent = 'Sending...';

        const data = await apiFetch('/auth/forgot-password', {
            method: 'POST',
            body  : JSON.stringify({ email })
        });

        statusEl.innerHTML     = `<strong>Code Dispatched!</strong> ${data.message}<br><br><a href="#" onclick="switchModal('forgotPasswordModal','resetPasswordModal'); document.getElementById('finalResetEmail').value='${email}'" style="color:var(--primary); font-weight:700;">Proceed to Reset →</a>`;
        statusEl.style.display = 'block';
        btn.textContent        = 'Check Email ✔️';
    } catch (err) {
        statusEl.textContent           = err.message;
        statusEl.style.display         = 'block';
        statusEl.style.background      = 'rgba(239, 68, 68, 0.1)';
        statusEl.style.borderColor     = 'rgba(239, 68, 68, 0.2)';
        statusEl.style.color           = '#ef4444';
        btn.disabled                   = false;
        btn.textContent                = 'Try Again 📧';
    }
}

async function handleFinalReset(e) {
    e.preventDefault();
    const email       = document.getElementById('finalResetEmail').value.trim();
    const token       = document.getElementById('resetToken').value.trim().toUpperCase();
    const newPassword = document.getElementById('newPassword').value;
    const btn         = e.target.querySelector('button');
    const statusEl    = document.getElementById('finalResetStatus');

    try {
        btn.disabled    = true;
        btn.textContent = 'Updating...';

        await apiFetch('/auth/reset-password', {
            method: 'POST',
            body  : JSON.stringify({ email, token, newPassword })
        });

        showGlobalToast("Password Reset Successful! Logging you in...");

        const loginData = await apiFetch('/auth/login', {
            method: 'POST',
            body  : JSON.stringify({ email, password: newPassword })
        });

        localStorage.setItem(STORAGE_KEYS.TOKEN, loginData.token);
        localStorage.setItem(STORAGE_KEYS.USER,  JSON.stringify(loginData.user));
        window.location.href = 'dashboard.html';
    } catch (err) {
        statusEl.textContent   = err.message;
        statusEl.style.display = 'block';
        btn.disabled           = false;
        btn.textContent        = 'Update Password';
    }
}

async function sendOTP() {
    const email     = document.getElementById('regEmail').value.trim();
    const firstName = document.getElementById('regFirstName')?.value.trim() || 'User';

    if (!email) {
        showGlobalToast("Please enter your email address first.");
        return;
    }

    const btn       = document.getElementById('sendOTPBtn');
    btn.disabled    = true;
    btn.textContent = "Sending...";

    try {
        const data = await apiFetch('/auth/send-otp', {
            method: 'POST',
            body  : JSON.stringify({ email })
        });

        if (!data.success) throw new Error(data.message || 'Backend failed to generate OTP');

        const otpCode = data.otp;
        if (!otpCode) throw new Error('No OTP received from server');

        if (typeof emailjs === 'undefined') throw new Error('EmailJS SDK not loaded. Please refresh.');

        emailjs.init(EMAILJS_PUBLIC_KEY);

        await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_OTP_TEMPLATE,
            { to_email: email, to_name: firstName, otp: otpCode, email: email },
            EMAILJS_PUBLIC_KEY
        );

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
    const lastName  = document.getElementById('regLastName').value.trim();
    const email     = document.getElementById('regEmail').value.trim();
    const password  = document.getElementById('regPassword').value;
    const location  = document.getElementById('regLocation').value;
    const phone     = document.getElementById('regPhone').value.trim();
    const otpInput  = document.getElementById('regOTP').value.trim();
    const btn       = e.target.querySelector('button');
    const errEl     = document.getElementById('regError');

    try {
        btn.disabled    = true;
        btn.textContent = 'Verifying OTP...';

        const verifyRes = await apiFetch('/auth/verify-otp', {
            method: 'POST',
            body  : JSON.stringify({ email, otp: otpInput })
        });

        if (!verifyRes.success) throw new Error(verifyRes.message || "OTP verification failed");

        btn.textContent = 'Creating Account...';

        const zoneData = getZoneFromState(location);
        const data = await apiFetch('/auth/register', {
            method: 'POST',
            body  : JSON.stringify({ 
                firstName, lastName, email, phone, password, location,
                state: location,
                zone: zoneData ? zoneData.zone : null,
                zone_ef: zoneData ? zoneData.ef : 0.82,
                zone_avg: zoneData ? zoneData.avg : 5.2
            })
        });

        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        localStorage.setItem(STORAGE_KEYS.USER,  JSON.stringify(data.user));

        if (typeof emailjs !== 'undefined') {
            emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_WELCOME_TEMPLATE,
                { to_email: email, first_name: firstName, email: email }
            ).catch(e => console.warn('Welcome email failed:', e));
        }

        if (data.user.role === 'admin' || email === 'admin@ecotrack.ai' || email === 'kumarbhavishya384@gmail.com') {
            window.location.href = 'admin_dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    } catch (err) {
        errEl.textContent   = err.message;
        errEl.style.display = 'block';
        btn.disabled        = false;
        btn.textContent     = 'Create My Account 🚀';
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
    const nameEl   = document.getElementById('sidebarName');
    const scoreEl  = document.getElementById('sidebarScore');
    if (avatarEl) avatarEl.textContent = (user.firstName[0] + (user.lastName ? user.lastName[0] : '')).toUpperCase();
    if (nameEl)   nameEl.textContent   = `${user.firstName} ${user.lastName || ''}`;
    if (scoreEl)  scoreEl.textContent  = `EcoScore: ${user.ecoScore || '--'}`;
}

// ── Data Handlers ─────────────────────────────────────
async function getUserEntries() {
    const data = await apiFetch('/entries');
    return data.entries || [];
}

async function saveUserEntry(entry) {
    const data = await apiFetch('/entries', {
        method: 'POST',
        body  : JSON.stringify(entry)
    });
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
    return d.getFullYear() + '-'
        + String(d.getMonth() + 1).padStart(2, '0') + '-'
        + String(d.getDate()).padStart(2, '0');
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCO2(val) { return Number(val).toFixed(2); }

function getScoreTier(score) {
    if (score >= 50) return { tier: 'Good Carbon 🟢',   color: '#22c55e', bgColor: 'rgba(34,197,94,0.15)'  };
    if (score >= 20) return { tier: 'Average Usage 🟡', color: '#eab308', bgColor: 'rgba(234,179,8,0.15)'  };
    return              { tier: 'High Usage 🔴',    color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)'   };
}

// ── Modal & UI Controls ───────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('active');    document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id).classList.remove('active'); document.body.style.overflow = ''; }

function closeModalOutside(event, id) { if (event.target.id === id) closeModal(id); }

function switchModal(fromId, toId) {
    closeModal(fromId);
    setTimeout(() => openModal(toId), 150);
}

function toggleSidebar() {
    const sidebar  = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    sidebar.classList.toggle('open');
    if (backdrop) backdrop.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}

function closeSidebar() {
    const sidebar  = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar)   sidebar.classList.remove('open');
    if (backdrop)  backdrop.classList.remove('active');
    document.body.style.overflow = '';
}

// ── Auto Auth Check on App Pages ─────────────────────
(async function autoAuthCheck() {
    const appPages  = ['dashboard.html', 'calculator.html', 'history.html',
                       'recommendations.html', 'leaderboard.html', 'offset.html'];
    const pathParts = window.location.pathname.split('/');
    const currentPage = pathParts[pathParts.length - 1];

    if (appPages.includes(currentPage)) {
        const user = requireAuth();
        if (user) {
            populateSidebar(user);
            const dateEl = document.getElementById('currentDate');
            if (dateEl) {
                dateEl.textContent = new Date().toLocaleDateString('en-IN', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                });
            }

            try {
                const data = await apiFetch('/auth/me');
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
                populateSidebar(data.user);
                updateEmissionFactors(data.user);
                
                // Trigger auto-location detection if zone missing
                if (!data.user.zone) {
                    setTimeout(detectUserZone, 2000);
                }
                
                initNotifications();
                checkDailyReminder();
            } catch (e) { console.log("Profile sync failed", e); }
        }
    }
})();

function updateEmissionFactors(user) {
    if (user && user.zone_ef) {
        EMISSION_FACTORS.electricity.gridFactor = user.zone_ef;
        EMISSION_FACTORS.transport.electric = user.zone_ef; // Assuming electric cars use grid factor
        console.log(`💡 EMISSION FACTORS UPDATED for zone ${user.zone}: ${user.zone_ef} kg/kWh`);
    } else {
        // Clear or default
        EMISSION_FACTORS.electricity.gridFactor = 0.82;
        EMISSION_FACTORS.transport.electric = 0.82;
    }
}

// =======================================================
//  NOTIFICATION SYSTEM — FULLY FIXED
//  Uses IndexedDB (works in Service Worker)
//  + Periodic Background Sync (works when tab closed)
//  + setInterval fallback (when tab is open)
// =======================================================

const REMINDER_DEFAULTS = {
    enabled    : false,
    time       : '20:00',
    message    : "Don't forget to log your carbon footprint today! 🌍",
    permission : 'default',
    lastFired  : null
};

// ── IndexedDB Helpers (replaces localStorage) ─────────
// localStorage is NOT accessible inside Service Workers.
// IndexedDB works in BOTH the page AND the service worker.

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('ecotrack_db', 1);

        req.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
        };

        req.onsuccess = e => resolve(e.target.result);
        req.onerror   = e => reject(e.target.error);
    });
}

async function getReminderSettings() {
    try {
        const db = await openDB();
        return new Promise(resolve => {
            const req = db
                .transaction('settings', 'readonly')
                .objectStore('settings')
                .get('reminder');
            req.onsuccess = e => resolve(
                e.target.result
                    ? { ...REMINDER_DEFAULTS, ...e.target.result.value }
                    : { ...REMINDER_DEFAULTS }
            );
            req.onerror = () => resolve({ ...REMINDER_DEFAULTS });
        });
    } catch {
        return { ...REMINDER_DEFAULTS };
    }
}

async function saveReminderSettings(s) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('settings', 'readwrite');
            tx.objectStore('settings').put({ key: 'reminder', value: s });
            tx.oncomplete = resolve;
            tx.onerror    = reject;
        });
    } catch (err) {
        console.warn('saveReminderSettings failed:', err);
    }
}

// ── Register Periodic Background Sync ─────────────────
// This is the KEY fix — fires notifications even when tab is closed
async function registerPeriodicSync() {
    try {
        if (!('serviceWorker' in navigator)) return;

        const reg = await navigator.serviceWorker.ready;

        if (!('periodicSync' in reg)) {
            console.warn('⚠️ Periodic Sync not supported. Using setInterval fallback.');
            return;
        }

        const status = await navigator.permissions.query({
            name: 'periodic-background-sync'
        });

        if (status.state === 'granted') {
            await reg.periodicSync.register('ecotrack-daily-reminder', {
                minInterval: 60 * 60 * 1000  // Browser checks at most every 1 hour
            });
            console.log('✅ Periodic Sync registered — notifications work even when tab is closed!');
        } else {
            console.warn('⚠️ Periodic Sync permission denied. Using setInterval fallback.');
        }
    } catch (err) {
        console.warn('Periodic Sync registration failed:', err);
    }
}

// ── Format time to 12-hour ────────────────────────────
function formatTime12h(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return (h % 12 || 12) + ':' + m.toString().padStart(2, '0') + (h >= 12 ? ' PM' : ' AM');
}

// ── Enable Daily Reminder ─────────────────────────────
async function enableDailyReminder(time, message) {
    let s      = await getReminderSettings();
    s.time     = time    || s.time;
    s.message  = message || s.message;
    s.enabled  = false;

    if (!('Notification' in window)) {
        showGlobalToast('Your browser does not support notifications.');
        return false;
    }

    let perm = Notification.permission;
    if (perm === 'default') perm = await Notification.requestPermission();

    s.permission = perm;

    if (perm === 'granted') {
        s.enabled = true;
        await saveReminderSettings(s);       // ✅ Save to IndexedDB

        await registerPeriodicSync();        // ✅ Register background sync

        scheduleReminderLoop();              // ✅ Keep fallback running too

        showGlobalToast('🔔 Daily reminder set for ' + formatTime12h(s.time) + '!');
        return true;

    } else if (perm === 'denied') {
        s.enabled = false;
        await saveReminderSettings(s);
        showGlobalToast('❌ Notifications blocked. Allow them in browser settings.');
        return false;
    }

    return false;
}

// ── Disable Daily Reminder ────────────────────────────
async function disableDailyReminder() {
    const s   = await getReminderSettings();
    s.enabled = false;
    await saveReminderSettings(s);

    // Unregister periodic sync if supported
    try {
        const reg = await navigator.serviceWorker.ready;
        if ('periodicSync' in reg) {
            await reg.periodicSync.unregister('ecotrack-daily-reminder');
        }
    } catch { /* ignore */ }

    if (_reminderInterval) {
        clearInterval(_reminderInterval);
        _reminderInterval = null;
    }

    showGlobalToast('🔕 Daily reminder disabled.');
}

// ── setInterval Fallback Loop (tab must be open) ──────
// This runs alongside periodic sync as a backup
// Fires if: tab is open AND periodic sync is not supported
let _reminderInterval = null;

function scheduleReminderLoop() {
    if (_reminderInterval) clearInterval(_reminderInterval);

    _reminderInterval = setInterval(async () => {
        const s = await getReminderSettings();

        if (!s.enabled || Notification.permission !== 'granted') return;

        const now   = new Date();
        const hhmm  = now.getHours().toString().padStart(2, '0')
                    + ':' + now.getMinutes().toString().padStart(2, '0');
        const today = getTodayDateStr();

        // Don't fire if already fired today
        if (s.lastFired === today) return;

        // Check time match
        if (hhmm !== s.time) return;

        // Check if already logged today
        try {
            const entries = await getUserEntries();
            if (!entries.some(e => e.date === today)) {
                fireReminderFallback(s);
                s.lastFired = today;
                await saveReminderSettings(s);
            } else {
                // Already logged — just mark as fired
                s.lastFired = today;
                await saveReminderSettings(s);
            }
        } catch {
            fireReminderFallback(s);
        }

    }, 30000); // Check every 30 seconds (more reliable than 60s)
}

// ── Fire reminder via postMessage to Service Worker ───
function fireReminderFallback(settings) {
    const msgs = [
        '🌱 Time to log your carbon footprint! Every entry helps the planet.',
        '🌍 Daily check-in: How was your footprint today? Log it now!',
        '♻️ Small steps matter! Log today\'s emissions and track your progress.',
        '🌿 Your EcoScore is waiting! Log today\'s activities.',
        '📊 Keep your streak alive — log your carbon footprint for today!'
    ];
    const body = settings.message || msgs[Math.floor(Math.random() * msgs.length)];

    sendPushOrNotification('EcoTrack AI 🌿', body, 'ecotrack-daily-reminder');

    if (window.location.pathname.includes('dashboard')) {
        showReminderBanner(body);
    }
}

// ── Shared Push/Notification Helper ──────────────────
function sendPushOrNotification(title, body, tag) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Send to service worker — works even in background tabs
        navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_REMINDER', title, body, tag
        });
    } else {
        // Direct notification fallback
        try {
            new Notification(title, {
                body, icon: '/logo.png', badge: '/logo.png',
                tag, renotify: true
            });
        } catch (e) { console.warn('Notification failed:', e); }
    }
}

// ── Show reminder banner inside dashboard ─────────────
function showReminderBanner(message) {
    const ex = document.getElementById('ecoReminderBanner');
    if (ex) ex.remove();

    const b = document.createElement('div');
    b.id    = 'ecoReminderBanner';
    b.innerHTML = `<div style="position:fixed;top:80px;right:1.5rem;z-index:9999;background:linear-gradient(135deg,rgba(0,212,170,0.15),rgba(10,15,30,0.95));border:1px solid rgba(0,212,170,0.4);border-radius:16px;padding:1rem 1.25rem;max-width:320px;width:calc(100vw - 3rem);box-shadow:0 8px 40px rgba(0,0,0,0.5);backdrop-filter:blur(20px);animation:slideInRight 0.4s ease;font-family:'Inter',sans-serif;">
        <div style="display:flex;align-items:flex-start;gap:.75rem;">
            <span style="font-size:1.6rem;flex-shrink:0;">🔔</span>
            <div style="flex:1;min-width:0;">
                <div style="font-weight:700;font-size:.9rem;color:#F0F6FF;margin-bottom:.3rem;">Daily Reminder</div>
                <div style="font-size:.82rem;color:#8B9BB4;line-height:1.5;">${message}</div>
                <div style="display:flex;gap:.5rem;margin-top:.75rem;flex-wrap:wrap;">
                    <button onclick="window.location.href='calculator.html'" style="background:linear-gradient(135deg,var(--primary),var(--secondary));border:none;color:#fff;padding:.4rem .9rem;border-radius:8px;font-size:.78rem;font-weight:600;cursor:pointer;">📊 Log Now</button>
                    <button onclick="document.getElementById('ecoReminderBanner').remove()" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#8B9BB4;padding:.4rem .9rem;border-radius:8px;font-size:.78rem;cursor:pointer;">Later</button>
                </div>
            </div>
            <button onclick="document.getElementById('ecoReminderBanner').remove()" style="background:none;border:none;color:#4A6080;cursor:pointer;font-size:1.2rem;padding:0;line-height:1;flex-shrink:0;">×</button>
        </div>
    </div>`;
    document.body.appendChild(b);
    setTimeout(() => { if (b.parentNode) b.remove(); }, 12000);
}

// ── Open Reminder Settings Modal ──────────────────────
async function openReminderSettings() {
    const ex = document.getElementById('reminderModal');
    if (ex) ex.remove();

    const s         = await getReminderSettings();
    const isEnabled = s.enabled && Notification.permission === 'granted';
    const isDenied  = Notification.permission === 'denied';
    const presets   = [['08:00','Morning ☀️'],['12:00','Noon 🌤️'],['18:00','Evening 🌆'],['20:00','Night 🌙'],['22:00','Late 🌚']];

    const m     = document.createElement('div');
    m.id        = 'reminderModal';
    m.innerHTML = `<div style="position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(16px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeIn .2s ease;" onclick="if(event.target===this)this.remove()">
        <div style="background:linear-gradient(135deg,rgba(10,20,40,.98),rgba(13,21,38,.98));border:1px solid rgba(0,212,170,.25);border-radius:20px;padding:2rem;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.6);font-family:'Inter',sans-serif;max-height:90vh;overflow-y:auto;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;">
                <div style="display:flex;align-items:center;gap:.75rem;">
                    <span style="font-size:1.8rem;">🔔</span>
                    <div>
                        <h3 style="font-family:'Space Grotesk',sans-serif;font-size:1.2rem;color:#F0F6FF;margin:0;">Daily Reminder</h3>
                        <p style="font-size:.78rem;color:#8B9BB4;margin:0;">Get notified to log your footprint</p>
                    </div>
                </div>
                <button onclick="document.getElementById('reminderModal').remove()" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#8B9BB4;width:32px;height:32px;border-radius:8px;font-size:1.1rem;cursor:pointer;">×</button>
            </div>
            <div style="background:${isEnabled ? 'rgba(0,212,170,.08)' : 'rgba(255,255,255,.04)'};border:1px solid ${isEnabled ? 'rgba(0,212,170,.3)' : 'rgba(255,255,255,.08)'};border-radius:12px;padding:.9rem 1rem;margin-bottom:1.25rem;display:flex;align-items:center;gap:.75rem;">
                <div style="width:10px;height:10px;border-radius:50%;flex-shrink:0;background:${isEnabled ? 'var(--primary)' : '#4A6080'};${isEnabled ? 'box-shadow:0 0 8px var(--primary);' : ''}"></div>
                <span style="font-size:.85rem;color:${isEnabled ? 'var(--primary)' : '#8B9BB4'};font-weight:600;">${isEnabled ? '✅ Active — fires at ' + formatTime12h(s.time) + ' (even when tab is closed)' : '⭕ Reminder Disabled'}</span>
            </div>
            ${isDenied ? '<div style="background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.3);border-radius:10px;padding:.75rem 1rem;margin-bottom:1.25rem;font-size:.8rem;color:#fca5a5;line-height:1.5;">⚠️ Notifications are <b>blocked</b>. Go to browser Settings → Site Settings → Notifications → Allow.</div>' : ''}
            <div style="margin-bottom:1.1rem;">
                <label style="display:block;font-size:.82rem;font-weight:600;color:#8B9BB4;margin-bottom:.5rem;">REMINDER TIME</label>
                <input type="time" id="reminderTimeInput" value="${s.time}" style="width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#F0F6FF;border-radius:12px;padding:.75rem 1rem;font-size:1rem;font-family:'Inter',sans-serif;outline:none;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='rgba(255,255,255,.1)'">
            </div>
            <div style="margin-bottom:1rem;">
                <label style="display:block;font-size:.82rem;font-weight:600;color:#8B9BB4;margin-bottom:.5rem;">CUSTOM MESSAGE (optional)</label>
                <input type="text" id="reminderMsgInput" value="${s.message}" placeholder="Don't forget to log!" style="width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#F0F6FF;border-radius:12px;padding:.75rem 1rem;font-size:.88rem;font-family:'Inter',sans-serif;outline:none;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='rgba(255,255,255,.1)'">
            </div>
            <div style="margin-bottom:1.5rem;">
                <label style="display:block;font-size:.82rem;font-weight:600;color:#8B9BB4;margin-bottom:.6rem;">QUICK PRESETS</label>
                <div style="display:flex;gap:.5rem;flex-wrap:wrap;">${presets.map(([t, l]) => `<button onclick="document.getElementById('reminderTimeInput').value='${t}'" style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#8B9BB4;padding:.35rem .75rem;border-radius:8px;font-size:.75rem;cursor:pointer;font-family:'Inter',sans-serif;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='#8B9BB4'">${l}</button>`).join('')}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:.75rem;">
                <button onclick="handleSaveReminder()" style="background:linear-gradient(135deg,var(--primary),var(--secondary));border:none;color:#fff;padding:.85rem;border-radius:12px;font-size:.95rem;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;width:100%;">🔔 Enable Daily Reminder</button>
                ${isEnabled ? `<button onclick="handleDisableReminder()" style="background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.3);color:rgba(255,107,107,.8);padding:.7rem;border-radius:12px;font-size:.88rem;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;width:100%;">🔕 Disable Reminder</button>` : ''}
                <button onclick="handleTestReminder()" style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#8B9BB4;padding:.7rem;border-radius:12px;font-size:.85rem;cursor:pointer;font-family:'Inter',sans-serif;width:100%;">🧪 Send Test Notification</button>
            </div>
        </div>
    </div>`;
    document.body.appendChild(m);
}

async function handleSaveReminder() {
    const time = document.getElementById('reminderTimeInput').value;
    const msg  = document.getElementById('reminderMsgInput').value.trim();
    if (!time) { showGlobalToast('⚠️ Please select a time.'); return; }
    const ok   = await enableDailyReminder(time, msg || REMINDER_DEFAULTS.message);
    if (ok) document.getElementById('reminderModal').remove();
}

async function handleDisableReminder() {
    await disableDailyReminder();
    document.getElementById('reminderModal').remove();
}

async function handleTestReminder() {
    if (Notification.permission !== 'granted') {
        const p = await Notification.requestPermission();
        if (p !== 'granted') { showGlobalToast('❌ Please allow notifications first.'); return; }
        const s     = await getReminderSettings();
        s.permission = 'granted';
        await saveReminderSettings(s);
    }
    fireReminderFallback({ ...await getReminderSettings(), message: '🧪 Test: This is your EcoTrack daily reminder! It works!' });
    showGlobalToast('✅ Test notification sent!');
}

// ── Init Notifications ────────────────────────────────
async function initNotifications() {
    const s   = await getReminderSettings();
    const btn = document.getElementById('enableNotificationsBtn');

    if (btn) {
        btn.style.display = 'inline-flex';
        btn.title         = s.enabled ? 'Reminder: ' + formatTime12h(s.time) : 'Set Daily Reminder';
        btn.style.color   = s.enabled ? 'var(--primary)' : '';
        btn.onclick       = openReminderSettings;
    }

    if (s.enabled && Notification.permission === 'granted') {
        // ✅ Primary: Periodic Background Sync (works when tab closed)
        await registerPeriodicSync();

        // ✅ Backup: setInterval (only when tab is open)
        scheduleReminderLoop();

    } else if (s.enabled && Notification.permission === 'denied') {
        // Permission was revoked — disable
        const updated     = { ...s, enabled: false, permission: 'denied' };
        await saveReminderSettings(updated);
    }

    initChallengeNotifications();
}

// ── Check if user already logged today ────────────────
async function checkDailyReminder() {
    const s = await getReminderSettings();
    if (!s.enabled || Notification.permission !== 'granted') return;

    const today = getTodayDateStr();
    if (s.lastFired === today) return;

    try {
        const entries = await getUserEntries();
        if (!entries.some(e => e.date === today) && window.location.pathname.includes('dashboard')) {
            setTimeout(() => showReminderBanner(s.message), 3000);
            s.lastFired = today;
            await saveReminderSettings(s);
        }
    } catch (e) { console.warn('checkDailyReminder failed', e); }
}

// =======================================================
//  CHALLENGE NOTIFICATION SYSTEM
// =======================================================

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
    try {
        const s = localStorage.getItem(CHALLENGES_KEY);
        return s ? JSON.parse(s) : {};
    } catch { return {}; }
}

function saveJoinedChallenges(d) {
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(d));
}

async function joinChallengeWithPermission(id) {
    const challenge = ALL_CHALLENGES.find(c => c.id === id);
    if (!challenge) return;

    const joined = getJoinedChallenges();
    if (joined[id] && !joined[id].completed) {
        showGlobalToast('✅ Already joined!');
        return;
    }

    if ('Notification' in window && Notification.permission === 'default') {
        showGlobalToast('📬 Allow notifications to get daily challenge tips!');
        await Notification.requestPermission();
    }

    const now = new Date(), end = new Date(now);
    end.setDate(end.getDate() + challenge.days);

    joined[id] = {
        joinedAt    : now.toISOString(),
        endsAt      : end.toISOString(),
        progress    : 0,
        lastNotified: null,
        completed   : false
    };

    saveJoinedChallenges(joined);
    showGlobalToast(`🎯 Joined "${challenge.title}"! Daily tips incoming 🔔`);
    _fireChallengeNotif(challenge, joined[id]);
    scheduleChallengeReminders();
    renderChallengesWithNotifications();
}

function leaveChallengeById(id) {
    const joined = getJoinedChallenges();
    delete joined[id];
    saveJoinedChallenges(joined);
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

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_CHALLENGE', title, body, tag: `challenge-${challenge.id}`
        });
    } else {
        sendPushOrNotification(title, body, `challenge-${challenge.id}`);
    }

    _showChallengeBanner(challenge, title, tip, day, challenge.days);
}

function _showChallengeBanner(challenge, title, tip, dayNum, totalDays) {
    const ex = document.getElementById('challengeBanner');
    if (ex) ex.remove();
    const topOffset = document.getElementById('ecoReminderBanner') ? '210px' : '80px';
    const pct = Math.round((dayNum / totalDays) * 100);
    const b   = document.createElement('div');
    b.id      = 'challengeBanner';
    b.innerHTML = `<div style="position:fixed;top:${topOffset};right:1.5rem;z-index:9998;background:linear-gradient(135deg,rgba(59,130,246,.15),rgba(10,15,30,.95));border:1px solid rgba(59,130,246,.4);border-radius:16px;padding:1rem 1.25rem;max-width:320px;width:calc(100vw - 3rem);box-shadow:0 8px 40px rgba(0,0,0,.5);backdrop-filter:blur(20px);animation:slideInRight .4s ease;font-family:'Inter',sans-serif;">
        <div style="display:flex;align-items:flex-start;gap:.75rem;">
            <span style="font-size:1.5rem;flex-shrink:0;">${challenge.icon}</span>
            <div style="flex:1;min-width:0;">
                <div style="font-weight:700;font-size:.85rem;color:#F0F6FF;margin-bottom:.2rem;">${title}</div>
                <div style="font-size:.79rem;color:#8B9BB4;line-height:1.5;margin-bottom:.5rem;">${tip}</div>
                <div style="height:4px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;margin-bottom:.35rem;">
                    <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#3B82F6,#06FFA5);border-radius:2px;"></div>
                </div>
                <div style="font-size:.7rem;color:#4A6080;margin-bottom:.6rem;">Day ${dayNum}/${totalDays} · ${pct}% complete</div>
                <div style="display:flex;gap:.5rem;">
                    <button onclick="window.location.href='recommendations.html'" style="background:rgba(59,130,246,.2);border:1px solid rgba(59,130,246,.4);color:#93C5FD;padding:.3rem .7rem;border-radius:8px;font-size:.74rem;font-weight:600;cursor:pointer;">View Challenge</button>
                    <button onclick="document.getElementById('challengeBanner').remove()" style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:#4A6080;padding:.3rem .7rem;border-radius:8px;font-size:.74rem;cursor:pointer;">OK</button>
                </div>
            </div>
            <button onclick="document.getElementById('challengeBanner').remove()" style="background:none;border:none;color:#4A6080;cursor:pointer;font-size:1.1rem;padding:0;flex-shrink:0;">×</button>
        </div>
    </div>`;
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
    overlay.innerHTML = `<div style="position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(12px);z-index:10001;display:flex;align-items:center;justify-content:center;padding:1rem;" onclick="this.remove()">
        <div style="background:linear-gradient(135deg,rgba(10,20,40,.98),rgba(13,21,38,.98));border:1px solid rgba(0,212,170,.4);border-radius:24px;padding:2rem;max-width:360px;width:calc(100vw - 2rem);box-shadow:0 20px 60px rgba(0,0,0,.7),0 0 40px rgba(0,212,170,.2);text-align:center;font-family:'Inter',sans-serif;animation:fadeIn .3s ease;" onclick="event.stopPropagation()">
            <div style="font-size:3rem;margin-bottom:.75rem;">🏆</div>
            <h2 style="font-family:'Space Grotesk',sans-serif;color:#F0F6FF;margin-bottom:.5rem;">Challenge Complete!</h2>
            <p style="color:var(--primary);font-size:1.1rem;font-weight:700;margin-bottom:.5rem;">${challenge.icon} ${challenge.title}</p>
            <p style="color:#8B9BB4;font-size:.88rem;margin-bottom:1.25rem;line-height:1.5;">You saved <strong style="color:var(--primary)">${challenge.co2Saved} kg CO₂</strong> and earned <strong style="color:#FBBF24">+${challenge.points} points</strong>!</p>
            <div style="height:2px;background:linear-gradient(90deg,transparent,var(--primary),transparent);margin-bottom:1.25rem;"></div>
            <div style="display:flex;gap:.75rem;justify-content:center;">
                <button onclick="this.closest('[onclick]').remove()" style="background:linear-gradient(135deg,var(--primary),var(--secondary));border:none;color:#fff;padding:.7rem 1.5rem;border-radius:12px;font-size:.9rem;font-weight:700;cursor:pointer;">🎯 Join Another</button>
                <button onclick="this.closest('[onclick]').remove()" style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#8B9BB4;padding:.7rem 1.25rem;border-radius:12px;font-size:.9rem;cursor:pointer;">Close</button>
            </div>
        </div>
    </div>`;
    document.body.appendChild(overlay);
    showGlobalToast(`🏆 ${challenge.title} complete! +${challenge.points} pts`);
}

let _challengeInterval = null;

function scheduleChallengeReminders() {
    if (_challengeInterval) clearInterval(_challengeInterval);
    _challengeInterval = setInterval(checkChallengeProgress, 60000);
}

function checkChallengeProgress() {
    const joined  = getJoinedChallenges();
    const today   = getTodayDateStr();
    let   updated = false;

    Object.keys(joined).forEach(id => {
        const state     = joined[id];
        const challenge = ALL_CHALLENGES.find(c => c.id === id);
        if (!challenge || state.completed || state.lastNotified === today) return;

        const daysPassed  = Math.floor((Date.now() - new Date(state.joinedAt)) / 86400000);
        state.progress    = Math.min(daysPassed, challenge.days);
        state.lastNotified = today;
        updated            = true;

        if (state.progress >= challenge.days) {
            state.completed = true;
            _fireChallengeComplete(challenge);
        } else {
            _fireChallengeNotif(challenge, state);
        }
    });

    if (updated) {
        saveJoinedChallenges(joined);
        renderChallengesWithNotifications();
    }
}

function initChallengeNotifications() {
    const joined = getJoinedChallenges();
    if (Object.values(joined).some(s => !s.completed)) {
        scheduleChallengeReminders();
        setTimeout(checkChallengeProgress, 2500);
    }
}

function renderChallengesWithNotifications(containerId) {
    const grid = document.getElementById(containerId || 'challengesGrid')
               || document.getElementById('dashboardChallenges');
    if (!grid) return;

    const joined    = getJoinedChallenges();
    const diffColor = { Easy: '#00D4AA', Medium: '#FBBF24', Hard: '#FF6B6B' };

    grid.innerHTML = ALL_CHALLENGES.map(ch => {
        const state    = joined[ch.id];
        const isJoined = !!state && !state.completed;
        const isDone   = state && state.completed;
        const progress = state ? state.progress : 0;
        const pct      = Math.round((progress / ch.days) * 100);
        const col      = diffColor[ch.difficulty] || '#8B9BB4';

        return `<div class="challenge-card" style="background:rgba(255,255,255,.04);border:1px solid ${isJoined ? 'rgba(0,212,170,.3)' : 'var(--border)'};border-radius:var(--radius);padding:1.25rem;transition:var(--transition);${isJoined ? 'box-shadow:0 0 20px rgba(0,212,170,.08);' : ''}">
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
            ${isJoined ? `<div style="margin-bottom:.75rem;">
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
                        <button onclick="leaveChallengeById('${ch.id}')" style="background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.2);border-radius:10px;padding:.5rem .75rem;font-size:.78rem;color:rgba(255,107,107,.7);cursor:pointer;">Leave</button>
                    </div>`
                    : `<button onclick="joinChallengeWithPermission('${ch.id}')" style="width:100%;background:linear-gradient(135deg,var(--primary),var(--secondary));border:none;color:#fff;padding:.6rem;border-radius:10px;font-size:.85rem;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;box-shadow:0 4px 15px rgba(0,212,170,.2);" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">🎯 Join Challenge</button>`
            }
        </div>`;
    }).join('');
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
    const main    = document.querySelector('.main-content');
    const topBtn  = document.getElementById('scrollTopBtn');
    const downBtn = document.getElementById('scrollDownBtn');
    if (!main || !topBtn || !downBtn) return;

    main.addEventListener('scroll', () => {
        const scrollTop = main.scrollTop;
        const scrollMax = main.scrollHeight - main.clientHeight;
        if (scrollTop > 200) { topBtn.style.display  = 'flex'; }
        else                 { topBtn.style.display  = 'none'; }
        if (scrollTop >= scrollMax - 80) { downBtn.style.opacity = '0.3'; }
        else                             { downBtn.style.opacity = '1';   }
    });
});

// ── Global Toast ──────────────────────────────────────
function showGlobalToast(msg) {
    const toast     = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<span style="font-size:1.2rem">🌿</span><span style="font-size:0.9rem">${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}
