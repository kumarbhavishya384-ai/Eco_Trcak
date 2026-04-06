/* ===================================================
   EcoTrack AI – Dashboard JS (dashboard.js)
   =================================================== */

let trendChartInstance = null;
let donutChartInstance = null;
let allEntries = [];

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (!user) return;

    try {
        allEntries = await getUserEntries();

        // Zero State check
        const onboardingSection = document.getElementById('onboardingSection');
        const chartEmptyState = document.getElementById('chartEmptyState');
        const dashboardGrid = document.querySelector('.dashboard-grid');

        if (!allEntries || allEntries.length === 0) {
            if (onboardingSection) onboardingSection.classList.add('visible');
            if (chartEmptyState) chartEmptyState.style.display = 'flex';
            // Hide some secondary sections if empty to reduce clutter
            const secondaryCards = document.querySelectorAll('.donut-card, .quick-stats-card, .regional-benchmark-card');
            secondaryCards.forEach(c => c.style.opacity = '0.3');
        } else {
            if (onboardingSection) onboardingSection.classList.remove('visible');
            if (chartEmptyState) chartEmptyState.style.display = 'none';
        }

        // Initial renders
        renderEcoScore(allEntries);
        updateEmissionDisplay(); // This now uses allEntries by default
        renderTrendChart(allEntries, 'week');
        renderDonutChart(allEntries);
        // Quick stats will be called inside updateEmissionDisplay for reactivity
        await renderDashboardRecs();
        renderRecentActivity(allEntries);
        renderChallengesWithNotifications('dashboardChallenges');
        initChallengeNotifications();

        // Level System / Gamification
        updateLevelProgress(allEntries);

        // Research: Federated Learning (Privacy-Safe Model Update)
        if (typeof runFederatedTraining === 'function') {
            setTimeout(runFederatedTraining, 2000);
        }

        // Update Streak
        updateStreak(allEntries);

    } catch (err) {
        console.error("Dashboard Load Error:", err);
        showGlobalToast("Failed to load dashboard data");
    }

    // Set date
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    // Notifications and challenges initialized via initNotifications() in app.js
});

// ── Streak Logic ───────────────────────────────────────
function updateStreak(entries) {
    const streakEl = document.querySelector('.streak-count');
    const fillEl = document.querySelector('.streak-fill');
    if (!streakEl || !fillEl) return;

    // Simple streak: number of entries in last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const recentEntries = entries.filter(e => new Date(e.date) >= thirtyDaysAgo);
    const count = recentEntries.length;

    animateNumber('streakCount', 0, count, 1500); // We'll add ID to HTML or use direct text
    streakEl.textContent = count;

    // Progress bar (percentage of month active)
    const pct = (count / 30) * 100;
    setTimeout(() => {
        fillEl.style.width = Math.max(5, pct) + '%';
    }, 500);
}

// ── Level / Gamification Logic ───────────────────────
function updateLevelProgress(entries) {
    const user = getCurrentUser();
    const score = user.ecoScore || (entries.length > 0 ? entries.reduce((s, e) => s + (e.ecoScore || 0), 0) : 0);
    
    let levelName = "Neophyte";
    let levelIcon = "🌱";
    let nextLevelName = "Intermediate";
    let nextLevelTarget = 1000;
    let progress = 0;

    if (score >= 5000) {
        levelName = "Elite";
        levelIcon = "🏆";
        nextLevelName = "Grandmaster";
        nextLevelTarget = 10000;
        progress = ((score - 5000) / 5000) * 100;
    } else if (score >= 1000) {
        levelName = "Intermediate";
        levelIcon = "🚀";
        nextLevelName = "Elite";
        nextLevelTarget = 5000;
        progress = ((score - 1000) / 4000) * 100;
    } else {
        progress = (score / 1000) * 100;
    }

    const badgeText = document.getElementById('levelBadgeText');
    const badgeIcon = document.getElementById('levelBadgeIcon');
    const levelProgressFill = document.getElementById('levelProgressFill');
    const nextLevelTargetEl = document.querySelector('.next-level-target');
    const levelNameEl = document.querySelector('.level-name');

    if (badgeText) badgeText.textContent = levelName;
    if (badgeIcon) badgeIcon.textContent = levelIcon;
    if (levelProgressFill) {
        setTimeout(() => {
            levelProgressFill.style.width = Math.min(100, Math.max(5, progress)) + '%';
        }, 800);
    }
    if (nextLevelTargetEl) nextLevelTargetEl.textContent = `${Math.max(0, nextLevelTarget - score)} pts to go`;
    if (levelNameEl) levelNameEl.innerHTML = `Next Rank: <span style="color: #fff;">${nextLevelName}</span>`;

    // Update main score display
    animateNumber('ecoScoreDisplay', 0, score, 2000);

    // Arc animation
    const circle = document.getElementById('scoreCircle');
    if (circle) {
        const circumference = 339;
        const normalizedScore = Math.min(score, nextLevelTarget);
        const offset = circumference - (normalizedScore / nextLevelTarget) * circumference;
        setTimeout(() => {
            circle.style.strokeDashoffset = offset;
        }, 300);
    }
}

// ── Emissions Breakdown ───────────────────────────────
function renderEmissionBreakdown(entries) {
    updateEmissionDisplay(entries);
}

function updateEmissionDisplay(entriesOverride) {
    const user = getCurrentUser();
    const entries = entriesOverride || allEntries;
    const period = document.getElementById('emissionPeriod')?.value || 'month';

    let filtered;
    const now = new Date();
    const todayStr = getTodayDateStr();

    if (period === 'today') {
        filtered = entries.filter(e => e.date === todayStr);
    } else if (period === 'week') {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        const cutoffStr = cutoff.toISOString().split('T')[0];
        filtered = entries.filter(e => e.date >= cutoffStr);
    } else {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        const cutoffStr = cutoff.toISOString().split('T')[0];
        filtered = entries.filter(e => e.date >= cutoffStr);
    }

    const totals = { transport: 0, electricity: 0, food: 0 };

    // Transport & food are daily values — sum them normally
    filtered.forEach(e => {
        totals.transport += (+e.transport || 0);
        totals.food += (+e.food || 0);
    });

    // Electricity is stored as a MONTHLY total — prorate it into the selected period
    const DAYS_IN_MONTH = 30;
    const daysInPeriod = period === 'today' ? 1
        : period === 'week' ? 7
            : 30;

    // Find the most recent entry that has a monthly electricity value logged
    const latestElecEntry = [...allEntries]
        .filter(e => (+e.electricity || 0) > 0)
        .sort((a, b) => b.date.localeCompare(a.date))[0];

    const monthlyElecKg = latestElecEntry ? +latestElecEntry.electricity : 0;
    const dailyElecKg = monthlyElecKg / DAYS_IN_MONTH;
    totals.electricity = dailyElecKg * daysInPeriod;
    // Update the prorated electricity note for user clarity
    const elecNoteEl = document.getElementById('electricityNote');
    if (elecNoteEl) {
        if (monthlyElecKg > 0) {
            elecNoteEl.style.display = 'block';
            elecNoteEl.textContent =
                `⚡ Monthly electricity ${monthlyElecKg.toFixed(1)} kg ÷ 30 = `
                + `${dailyElecKg.toFixed(2)} kg/day (shown prorated for "${period}" view)`;
        } else {
            elecNoteEl.style.display = 'none';
        }
    }

    // NORMALIZATION: Electricity is logged as monthly, but dashboard filters need spread
    if (period === 'today') {
        totals.electricity = totals.electricity / 30;
    } else if (period === 'week') {
        // Spread the monthly log over 7 days for the weekly view
        totals.electricity = (totals.electricity / 30) * 7;
    }
    // For 'month', we leave totals.electricity as the sum (which is the full bill)

    const total = totals.transport + totals.electricity + totals.food;
    const maxVal = Math.max(...Object.values(totals), 1);

    animateNumber('emissionValue', 0, total, 1500, 1);

    ['transport', 'electric', 'food'].forEach((id, idx) => {
        const cats = ['transport', 'electricity', 'food'];
        const cat = cats[idx];
        const valEl = document.getElementById(id + 'Val');
        const fillEl = document.getElementById(id + 'Fill');
        if (valEl) valEl.textContent = totals[cat].toFixed(1) + ' kg';
        if (fillEl) {
            setTimeout(() => {
                fillEl.style.width = Math.max(4, (totals[cat] / maxVal) * 100) + '%';
            }, 800 + (idx * 100));
        }
    });

    // Update Quick Stats to reflect this period
    renderQuickStats(user, filtered, period);

    // NEW: Regional Grid Comparisons
    renderRegionalBenchmarks(user, filtered);
    initMiniMap(user);
}

let miniMapInstance = null;
function initMiniMap(user) {
    if (!document.getElementById('miniMap')) return;
    if (miniMapInstance) return;

    const lat = user.lat || 20.5937; // Default India center
    const lon = user.lon || 78.9629;

    document.getElementById('miniMap').innerHTML = ''; // Clear spinner

    miniMapInstance = L.map('miniMap', {
        center: [lat, lon],
        zoom: 4,
        zoomControl: false,
        attributionControl: false
    });

    // Dark Premium Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 10
    }).addTo(miniMapInstance);

    // Grid Zone Outlines (Simple visual representation)
    const zoneColors = {
        'Northern': '#ff4d4d', 'Western': '#ffa500', 'Southern': '#22c55e',
        'Eastern': '#3b82f6', 'North-Eastern': '#a855f7'
    };

    const zoneColor = user.zone ? zoneColors[user.zone] : '#00d4aa';

    // Custom Pulsing Dot for user location
    const customIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<div style="width:12px; height:12px; background:${zoneColor}; border:2px solid #fff; border-radius:50%; box-shadow: 0 0 15px ${zoneColor};"></div>`,
        iconSize: [12, 12]
    });

    if (user.lat && user.lon) {
        L.marker([lat, lon], { icon: customIcon }).addTo(miniMapInstance);
        miniMapInstance.setView([lat, lon], 5);

        // Label for detected state
        if (user.state) {
            L.popup({
                closeButton: false,
                autoClose: false,
                className: 'map-label'
            })
                .setLatLng([lat + 0.5, lon])
                .setContent(`<div style="font-size:0.7rem; font-weight:800; color:${zoneColor}">${user.state.toUpperCase()}</div>`)
                .openOn(miniMapInstance);
        }
    }
}

function renderRegionalBenchmarks(user, currentEntries) {
    const nationalAvg = 5.2;
    const zoneAvg = user.zone_avg || 5.2;
    const zoneName = user.zone || 'National';

    // Calculate REAL Daily Average over the last 30 CALENDAR days
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const entriesLast30 = allEntries.filter(e => e.date >= startDateStr);

    // total = sum of transport + sum of food + TOTAL electricity bill for the month
    const totalCO2 = entriesLast30.reduce((s, e) => s + (e.total || 0), 0);
    const userDailyAvg = totalCO2 / 30; // Spread over 30 days

    // Display updates
    const zoneBadge = document.getElementById('userZoneBadge');
    if (zoneBadge) zoneBadge.textContent = zoneName.toUpperCase();

    const zoneLabel = document.getElementById('zoneAvgLabel');
    if (zoneLabel) zoneLabel.textContent = `vs ${zoneName} Avg`;

    const zoneVal = document.getElementById('zoneAvgVal');
    if (zoneVal) zoneVal.textContent = `${zoneAvg} kg/day`;

    // Max for scaling (e.g. 10 kg)
    const scaleMax = Math.max(nationalAvg, zoneAvg, userDailyAvg, 10);

    const nationalFill = document.getElementById('nationalAvgFill');
    if (nationalFill) nationalFill.style.width = (nationalAvg / scaleMax * 100) + '%';

    const zoneFill = document.getElementById('zoneAvgFill');
    if (zoneFill) zoneFill.style.width = (zoneAvg / scaleMax * 100) + '%';

    const natMarker = document.getElementById('userAvgMarkerNational');
    if (natMarker) natMarker.style.left = Math.min((userDailyAvg / scaleMax * 100), 99) + '%';

    const zoneMarker = document.getElementById('userAvgMarkerZone');
    if (zoneMarker) zoneMarker.style.left = Math.min((userDailyAvg / scaleMax * 100), 99) + '%';
}

// ── Trend Chart – Enhanced Premium ────────────────────
function renderTrendChart(entries, period = 'week') {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    let labels = [];
    let values = [];
    const now = new Date();

    if (period === 'week') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now); d.setDate(now.getDate() - i);
            const ds = d.toISOString().split('T')[0];
            labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
            const entry = entries.find(e => e.date === ds);
            values.push(entry ? +entry.total.toFixed(2) : 0);
        }
    } else if (period === 'month') {
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now); d.setDate(now.getDate() - i);
            const ds = d.toISOString().split('T')[0];
            labels.push(d.getDate() + '/' + (d.getMonth() + 1));
            const entry = entries.find(e => e.date === ds);
            values.push(entry ? +entry.total.toFixed(2) : 0);
        }
    } else {
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now); d.setMonth(now.getMonth() - i);
            const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
            const monthEntries = entries.filter(e => e.date.startsWith(monthStr));
            const avg = monthEntries.length > 0 ? monthEntries.reduce((s, e) => s + e.total, 0) / monthEntries.length : 0;
            values.push(+avg.toFixed(2));
        }
    }

    if (trendChartInstance) trendChartInstance.destroy();

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 212, 170, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 212, 170, 0)');

    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Emissions',
                data: values,
                borderColor: '#00D4AA',
                backgroundColor: gradient,
                borderWidth: 3,
                tension: 0.45,
                fill: true,
                pointBackgroundColor: '#00D4AA',
                pointBorderColor: '#080C1C',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointHoverBorderWidth: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0F172A',
                    titleFont: { family: 'Space Grotesk', size: 13 },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: { label: ctx => `${ctx.parsed.y.toFixed(2)} kg CO₂e` }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748B', font: { size: 10, weight: '600' } }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    ticks: { color: '#64748B', font: { size: 10 }, callback: v => v + ' kg' }
                }
            }
        }
    });
}

async function updateChart(period, btn) {
    document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Use and refresh global entries
    allEntries = await getUserEntries();
    renderTrendChart(allEntries, period);
}

// ── Donut Chart ───────────────────────────────────────
function renderDonutChart(entries) {
    const ctx = document.getElementById('donutChart');
    if (!ctx) return;

    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    const filtered = entries.filter(e => new Date(e.date) >= cutoff);

    const totals = {
        Transport: filtered.reduce((s, e) => s + (e.transport || 0), 0),
        Electricity: filtered.reduce((s, e) => s + (e.electricity || 0), 0),
        Food: filtered.reduce((s, e) => s + (e.food || 0), 0)
    };

    const colors = ['#3B82F6', '#FBBF24', '#00D4AA'];

    if (donutChartInstance) donutChartInstance.destroy();

    donutChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(totals),
            datasets: [{
                data: Object.values(totals).map(v => +v.toFixed(2)),
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 12,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '82%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0F172A',
                    callbacks: { label: ctx => `${ctx.label}: ${ctx.raw.toFixed(1)} kg` }
                }
            }
        }
    });

    const legendEl = document.getElementById('donutLegend');
    if (legendEl) {
        const total = Object.values(totals).reduce((s, v) => s + v, 0) || 1;
        legendEl.innerHTML = Object.entries(totals).map(([name, val], i) =>
            `<div class="legend-item" style="display:flex; align-items:center; gap:8px; margin-bottom:6px; font-size:0.8rem; color:var(--text-secondary);">
                <div style="width:10px; height:10px; border-radius:3px; background:${colors[i]}"></div>
                <span style="flex:1">${name}</span>
                <span style="color:var(--text-primary); font-weight:700;">${((val / total) * 100).toFixed(0)}%</span>
            </div>`
        ).join('');
    }
}

// ── Quick Stats ───────────────────────────────────────
async function renderQuickStats(user, entries, period = 'month') {
    const totalCO2 = entries.reduce((s, e) => s + e.total, 0);

    // Normalization factor: if today, multiply by 30 for monthly equivalent trees
    const monthlyEquivalent = period === 'today' ? totalCO2 * 30 : (period === 'week' ? totalCO2 * 4.3 : totalCO2);

    const trees = Math.ceil(monthlyEquivalent / 1.75);
    animateNumber('treesNeeded', 0, trees, 1500);

    const elecTotal = entries.reduce((s, e) => s + (e.electricity || 0), 0);
    const solarPct = Math.min(100, Math.round((elecTotal / (totalCO2 || 1)) * 100));
    animateNumber('solarSavings', 0, solarPct, 1500, 0, '%');

    try {
        const lbData = await apiFetch('/leaderboard');
        const myRank = lbData.myRank || '--';
        const rankEl = document.getElementById('userRank');
        if (rankEl) rankEl.textContent = '#' + myRank;
    } catch (e) { }

    const recentEl = document.getElementById('reductionPct');
    if (allEntries.length >= 14) {
        const lastWeekAvg = allEntries.slice(0, 7).reduce((s, e) => s + e.total, 0) / 7;
        const prevWeekAvg = allEntries.slice(7, 14).reduce((s, e) => s + e.total, 0) / 7;
        const pct = prevWeekAvg > 0 ? ((prevWeekAvg - lastWeekAvg) / prevWeekAvg * 100) : 0;
        if (recentEl) {
            recentEl.textContent = (pct >= 0 ? '↓' : '↑') + Math.abs(pct).toFixed(0) + '%';
            recentEl.style.color = pct >= 0 ? 'var(--primary)' : 'var(--danger)';
        }
    } else {
        if (recentEl) recentEl.textContent = 'N/A';
    }
}

// ── Recommendations Preview – Enhanced ────────────────
async function renderDashboardRecs() {
    const el = document.getElementById('dashboardRecs');
    if (!el) return;

    try {
        const data = await apiFetch('/recommendations');
        const recs = data.recommendations || [];

        if (recs.length === 0) {
            el.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">No AI tips generated yet.</div>`;
            return;
        }

        el.innerHTML = recs.slice(0, 4).map(r => `
            <div class="rec-card" onclick="window.location.href='recommendations.html'" style="cursor:pointer;">
                <div class="rec-icon" style="font-size:1.8rem; margin-bottom:0.75rem;">${r.icon}</div>
                <div class="rec-title" style="font-weight:700; margin-bottom:0.4rem; font-size:0.9rem;">${r.title}</div>
                <div class="rec-desc" style="font-size:0.78rem; color:var(--text-secondary); line-height:1.4; margin-bottom:0.75rem;">${r.desc}</div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="rec-impact" style="font-size:0.72rem; font-weight:700; color:var(--primary); background:rgba(0,212,170,0.1); padding:0.2rem 0.6rem; border-radius:50px;">Save ${r.impact}kg</span>
                    <span style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">${r.category}</span>
                </div>
            </div>
        `).join('');
    } catch (err) {
        el.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:1rem; color:var(--text-muted)">Syncing with AI Engines...</div>';
    }
}

// ── Recent Activity ───────────────────────────────────
function renderRecentActivity(entries) {
    const el = document.getElementById('activityList');
    if (!el) return;

    if (entries.length === 0) {
        el.innerHTML = '<div class="empty-state">No entries yet.</div>';
        return;
    }

    const recent = entries.slice(0, 5);
    el.innerHTML = recent.map(e => `
      <div class="activity-item" style="display:flex; align-items:center; justify-content:space-between; padding:0.85rem 1rem; border-bottom:1px solid rgba(255,255,255,0.03);">
        <div style="display:flex; align-items:center; gap:1rem;">
          <div style="width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,0.04); display:flex; align-items:center; justify-content:center; font-size:1.1rem;">📝</div>
          <div>
            <div style="font-size:0.875rem; font-weight:600;">Data Logged</div>
            <div style="font-size:0.72rem; color:var(--text-muted);">${formatDate(e.date)}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.875rem; font-weight:700; color:var(--text-primary);">${e.total.toFixed(2)} kg</div>
          <div style="font-size:0.7rem; color:var(--primary); font-weight:700;">+${e.ecoScore || 0} PTS</div>
        </div>
      </div>
    `).join('');
}

// ── Number animation helper ───────────────────────────
function animateNumber(id, from, to, duration = 1000, decimals = 0, suffix = '') {
    const el = document.getElementById(id);
    if (!el) return;
    const startTime = performance.now();
    function update(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const val = from + (to - from) * eased;
        el.textContent = (decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString()) + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}
// ── Challenges handled by app.js notification system ─
