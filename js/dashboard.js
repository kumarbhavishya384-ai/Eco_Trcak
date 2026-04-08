// Safety fallbacks to prevent dashboard crashes if dependencies fail to load
if (typeof t !== 'function') {
    console.warn("i18n.js not loaded. Using fallback translation function.");
    window.t = (key) => {
        // Fallback: return the key itself or a readable version
        return key.includes('_') ? key.split('_').slice(-1)[0] : key;
    };
}
if (typeof ALL_CHALLENGES === 'undefined') {
    window.ALL_CHALLENGES = [];
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (!user) return;

    // 1. Initial Instant Render with local/empty data to avoid 'Analyzing' hang
    try {
        const localEntries = JSON.parse(localStorage.getItem('ecotrack_entries_cache') || '[]');
        updateLevelProgress(localEntries);
    } catch (e) {}

    try {
        // 2. Background Fetch with Timeout
        const fetchPromise = getUserEntries();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000));
        
        allEntries = await Promise.race([fetchPromise, timeoutPromise]);
        
        // Cache for next fast load
        localStorage.setItem('ecotrack_entries_cache', JSON.stringify(allEntries.slice(0, 50)));

        // 3. Update with real data
        console.log("LOG: Data received, triggering renders...");
        try { updateLevelProgress(allEntries); } catch (e) { console.error("Score Error:", e); }
        try { updateEmissionDisplay(); } catch (e) { console.error("Emissions Error:", e); }
        
        // Safety Delay for Chart.js & Canvas mounting
        setTimeout(() => {
            console.log("LOG: Executing Chart Renders after safety delay...");
            try { renderTrendChart(allEntries, 'week'); } catch (e) { console.error("Chart Error:", e); }
            try { renderDonutChart(allEntries); } catch (e) { console.error("Donut Error:", e); }
        }, 300);

        try { renderDashboardRecs(); } catch (e) { console.error("Recs Error:", e); }
        try { renderRecentActivity(allEntries); } catch (e) { console.error("Activity Error:", e); }
        
        // Ported AI Features
        try { renderAIPredictions(allEntries); } catch (e) { console.error("Prediction Error:", e); }
        try { renderAICoach(); } catch (e) { console.error("Coach Error:", e); }

        try { renderChallengesWithNotifications('dashboardChallenges'); } catch (e) { console.error("Challenges Error:", e); }
        initChallengeNotifications();

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
        // Date set by i18n.js
    }

    // Notifications and challenges initialized via initNotifications() in app.js
});

// â”€â”€ Streak Logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Level / Gamification Logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function updateLevelProgress(entries) {
    const user = getCurrentUser();
    const score = user.ecoScore || (entries.length > 0 ? entries.reduce((s, e) => s + (e.ecoScore || 0), 0) : 0);
    
    let levelName = "Neophyte";
    let levelIcon = "\u{1F331}";
    let nextLevelName = "Intermediate";
    let nextLevelTarget = 1000;
    let progress = 0;

    if (score >= 5000) {
        levelName = "Elite";
        levelIcon = "ðŸ†";
        nextLevelName = "Grandmaster";
        nextLevelTarget = 10000;
        progress = ((score - 5000) / 5000) * 100;
    } else if (score >= 1000) {
        levelName = "Intermediate";
        levelIcon = "\u{1F680}";
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
    const scoreTierBadge = document.getElementById('scoreTierBadge');
    const scoreDesc = document.getElementById('scoreDesc');

    if (badgeText) badgeText.textContent = t("rank_" + levelName.toLowerCase());
    if (badgeIcon) badgeIcon.textContent = levelIcon;
    if (levelProgressFill) {
        setTimeout(() => {
            levelProgressFill.style.width = Math.min(100, Math.max(5, progress)) + '%';
        }, 800);
    }
    if (nextLevelTargetEl) nextLevelTargetEl.textContent = `${Math.max(0, nextLevelTarget - score)} ${t("pts_to_go")}`;
    if (levelNameEl) levelNameEl.innerHTML = `<span tabindex="0" data-i18n="next_rank">${t("next_rank")}</span> <span style="color: #fff;">${t("rank_" + nextLevelName.toLowerCase())}</span>`;

    // Update main score display
    animateNumber('ecoScoreDisplay', 0, score, 2000);

    // Update Status Labels based on score
    if (scoreTierBadge) {
        const ratingKey = score > 1000 ? "perf_exc" : (score > 500 ? "perf_good" : "perf_neo");
        const ratingIcon = score > 1000 ? "\u{1F3C6}" : (score > 500 ? "\u{1F680}" : "\u{1F331}");
        scoreTierBadge.textContent = t(ratingKey) + " " + ratingIcon;
        if (score > 0) scoreTierBadge.style.background = 'rgba(0, 212, 170, 0.15)';
    }
    if (scoreDesc) {
        scoreDesc.textContent = score > 0 
            ? `${t("earned_pts_1")} ${score} ${t("earned_pts_2")}` 
            : t("complete_first_act", "Complete your first activity to see your environmental impact score.");
    }

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

// â”€â”€ Emissions Breakdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderEmissionBreakdown(entries) {
    updateEmissionDisplay(entries);
}

function updateEmissionDisplay(entriesOverride) {
    const user = getCurrentUser();
    const entries = entriesOverride || allEntries;
    const period = document.getElementById('emissionPeriod')?.value || 'month';

    const now = new Date();
    // Normalize 'now' to start of today for safer day-diffs
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const filtered = entries.filter(e => {
        const entryDate = new Date(e.date + 'T00:00:00'); // Force local time
        const diffTime = todayMidnight - entryDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (period === 'today') return diffDays === 0;
        if (period === 'week') return diffDays < 7;
        return diffDays < 30; // 'month'
    });

    const totals = { transport: 0, electricity: 0, food: 0 };

    // Transport & food are daily values â€” sum them normally
    filtered.forEach(e => {
        totals.transport += (+e.transport || 0);
        totals.food += (+e.food || 0);
    });

    // Electricity logic
    const latestElecEntry = [...entries]
        .filter(e => (+e.electricity || 0) > 0)
        .sort((a, b) => b.date.localeCompare(a.date))[0];

    const monthlyElecKg = latestElecEntry ? +latestElecEntry.electricity : 0;
    const dailyElecKg = monthlyElecKg / 30;

    if (period === 'today') {
        totals.electricity = dailyElecKg;
    } else if (period === 'week') {
        totals.electricity = dailyElecKg * 7;
    } else {
        totals.electricity = monthlyElecKg;
    }

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
    const entriesLast30 = allEntries.filter(e => {
        const entryDate = new Date(e.date);
        const diffDays = Math.floor(Math.abs(now - entryDate) / (1000 * 60 * 60 * 24));
        return diffDays < 30;
    });

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

// â”€â”€ Trend Chart â€“ Enhanced Premium â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderTrendChart(entries, period = 'week') {
    console.log("LOG: Rendering Trend Chart for period:", period, "| Entries count:", (entries ? entries.length : 0));
    const container = document.querySelector('.chart-wrapper');
    if (!container || typeof Chart === 'undefined') {
        console.warn("Chart.js missing or container not found");
        return;
    }

    // Hard reset canvas to avoid context issues
    let ctx = document.getElementById('trendChart');
    if (ctx) {
        if (trendChartInstance) trendChartInstance.destroy();
        const parent = ctx.parentNode;
        parent.removeChild(ctx);
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'trendChart';
        parent.prepend(newCanvas);
        ctx = newCanvas;
    } else {
        return;
    }

    let labels = [];
    let values = [];
    const now = new Date();
    const L = localStorage.getItem('ecotrack_lang') || 'en';
    const localeCode = L === 'hi' ? 'hi-IN' : (L === 'bn' ? 'bn-IN' : (L === 'ta' ? 'ta-IN' : 'en-US'));

    if (period === 'week') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now); d.setDate(now.getDate() - i);
            const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            labels.push(d.toLocaleDateString(localeCode, { weekday: 'short' }));
            const entry = entries.find(e => e.date === ds);
            values.push(entry ? +entry.total.toFixed(2) : 0);
        }
    } else if (period === 'month') {
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now); d.setDate(now.getDate() - i);
            const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            labels.push(d.getDate() + '/' + (d.getMonth() + 1));
            const entry = entries.find(e => e.date === ds);
            values.push(entry ? +entry.total.toFixed(2) : 0);
        }
    } else {
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now); d.setMonth(now.getMonth() - i);
            const monthStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            labels.push(d.toLocaleDateString(localeCode, { month: 'short' }));
            const monthEntries = entries.filter(e => e.date.startsWith(monthStr));
            const avg = monthEntries.length > 0 ? monthEntries.reduce((s, e) => s + e.total, 0) / monthEntries.length : 0;
            values.push(+avg.toFixed(2));
        }
    }

    const chartEmptyState = document.getElementById('chartEmptyState');
    const hasData = values.some(v => v > 0);
    if (chartEmptyState) chartEmptyState.style.display = (hasData || entries.length > 0) ? 'none' : 'flex';

    if (!hasData && entries.length === 0) return;

    const canvasCtx = ctx.getContext('2d');
    const gradient = canvasCtx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 212, 170, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 212, 170, 0)');

    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: t('emissions_label', 'Emissions'),
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
                    callbacks: { label: ctx => `${ctx.parsed.y.toFixed(2)} ${t('kg_co2e', 'kg CO2e')}` }
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
    if (btn) {
        document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    // Refresh global entries
    allEntries = await getUserEntries();
    renderTrendChart(allEntries, period);
}

// â”€â”€ Donut Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderDonutChart(entries) {
    console.log("LOG: Rendering Donut Chart | Entries count:", (entries ? entries.length : 0));
    const container = document.querySelector('.chart-wrapper-small');
    if (!container || typeof Chart === 'undefined') return;

    // Hard reset canvas to avoid context issues
    let ctx = document.getElementById('donutChart');
    if (ctx) {
        if (donutChartInstance) donutChartInstance.destroy();
        const parent = ctx.parentNode;
        parent.removeChild(ctx);
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'donutChart';
        parent.appendChild(newCanvas);
        ctx = newCanvas;
    } else {
        return;
    }

    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    const filtered = entries.filter(e => new Date(e.date) >= cutoff);

    const totals = {
        Transport: filtered.reduce((s, e) => s + (e.transport || 0), 0),
        Electricity: filtered.reduce((s, e) => s + (e.electricity || 0), 0),
        Food: filtered.reduce((s, e) => s + (e.food || 0), 0)
    };

    const labels = [
        t('transport', 'Transport'),
        t('electricity', 'Electricity'),
        t('food', 'Food')
    ];

    const colors = ['#3B82F6', '#FBBF24', '#10B981'];

    donutChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
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
                <span style="flex:1">${t(name.toLowerCase())}</span>
                <span style="color:var(--text-primary); font-weight:700;">${((val / total) * 100).toFixed(0)}%</span>
            </div>`
        ).join('');
    }
}

// â”€â”€ Quick Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            recentEl.textContent = (pct >= 0 ? 'â†“' : 'â†‘') + Math.abs(pct).toFixed(0) + '%';
            recentEl.style.color = pct >= 0 ? 'var(--primary)' : 'var(--danger)';
        }
    } else {
        if (recentEl) recentEl.textContent = 'N/A';
    }
}

// â”€â”€ Recommendations Preview â€“ Enhanced â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
                <div class="rec-title" style="font-weight:700; margin-bottom:0.4rem; font-size:0.9rem;">${t('rec_title_' + r.id.trim())}</div>
                <div class="rec-desc" style="font-size:0.78rem; color:var(--text-secondary); line-height:1.4; margin-bottom:0.75rem;">${t('rec_desc_' + r.id.trim())}</div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="rec-impact" style="font-size:0.72rem; font-weight:700; color:var(--primary); background:rgba(0,212,170,0.1); padding:0.2rem 0.6rem; border-radius:50px;">${t('save')} ${r.impact}kg</span>
                    <span style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">${t(r.cat + '_label')}</span>
                </div>
            </div>
        `).join('');
    } catch (err) {
        el.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:1rem; color:var(--text-muted)">Syncing with AI Engines...</div>';
    }
}

// â”€â”€ Recent Activity â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          <div style="width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,0.04); display:flex; align-items:center; justify-content:center; font-size:1.1rem;">\u{1F4CA}</div>
          <div>
            <div style="font-size:0.875rem; font-weight:600;">${t('log_data')}</div>
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

// â”€â”€ Number animation helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
// â”€â”€ Challenges handled by app.js notification system â”€