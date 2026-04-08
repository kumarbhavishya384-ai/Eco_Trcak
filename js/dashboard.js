/* ===================================================
   EcoTrack AI â€“ Dashboard JS (dashboard.js)
   =================================================== */

let trendChartInstance = null;
let donutChartInstance = null;
let allEntries = [];

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (!user) return;

    try {
        allEntries = await getUserEntries();

        // Initial renders (Wrapped in try-catch to prevent cascading failures)
        try { updateLevelProgress(allEntries); } catch (e) { console.error("Score Error:", e); }
        try { updateEmissionDisplay(); } catch (e) { console.error("Emissions Error:", e); }
        try { renderTrendChart(allEntries, 'week'); } catch (e) { console.error("Chart Error:", e); }
        try { renderDonutChart(allEntries); } catch (e) { console.error("Donut Error:", e); }
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
        dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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
    let levelIcon = "ðŸŒ±";
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
        levelIcon = "ðŸš€";
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

    // Update Status Labels based on score
    if (scoreTierBadge) {
        const scoreRating = score > 1000 ? "Excellent Performance ðŸŒ¿" : (score > 500 ? "Good Progress ðŸš€" : "Sustainability Neophyte ðŸŒ±");
        scoreTierBadge.textContent = scoreRating;
        if (score > 0) scoreTierBadge.style.background = 'rgba(0, 212, 170, 0.15)';
    }
    if (scoreDesc) {
        scoreDesc.textContent = score > 0 
            ? `You have earned ${score} EcoPoints! Keep logging daily activities to climb the ranks.` 
            : "Complete your first activity to see your environmental impact score.";
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
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    let labels = [];
    let values = [];
    const now = new Date();

    if (period === 'week') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now); d.setDate(now.getDate() - i);
            const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
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
                    callbacks: { label: ctx => `${ctx.parsed.y.toFixed(2)} kg COâ‚‚e` }
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

// â”€â”€ Donut Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          <div style="width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,0.04); display:flex; align-items:center; justify-content:center; font-size:1.1rem;">ðŸ“</div>
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
/ *   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
       E c o T r a c k   A I   â ¬    R e c o m m e n d a t i o n s   J S   ( r e c o m m e n d a t i o n s . j s )  
       = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =   * /  
  
 l e t   a l l R e c s   =   [ ] ;  
 l e t   p r e d i c t i o n C h a r t I n s t a n c e   =   n u l l ;  
  
 d o c u m e n t . a d d E v e n t L i s t e n e r ( ' D O M C o n t e n t L o a d e d ' ,   a s y n c   ( )   = >   {  
         i f   ( ! g e t C u r r e n t U s e r ( ) )   r e t u r n ;  
  
         c o n s t   g r i d   =   d o c u m e n t . g e t E l e m e n t B y I d ( ' r e c s F u l l G r i d ' ) ;  
         i f   ( g r i d )   g r i d . i n n e r H T M L   =   ' < d i v   s t y l e = " g r i d - c o l u m n :   1   /   - 1 ;   t e x t - a l i g n :   c e n t e r ;   p a d d i n g :   3 r e m ; " > < d i v   c l a s s = " l o a d i n g - s p i n n e r " > < / d i v > < p   s t y l e = " m a r g i n - t o p : 1 r e m ;   c o l o r : v a r ( - - t e x t - s e c o n d a r y ) " > A I   R e c o m m e n d e r   i s   a n a l y z i n g   y o u r   p a t t e r n s   l i v e . . . < / p > < / d i v > ' ;  
  
         t r y   {  
                 c o n s t   e n t r i e s   =   a w a i t   g e t U s e r E n t r i e s ( ) ;  
                 c o n s t   d a t a   =   a w a i t   a p i F e t c h ( ' / r e c o m m e n d a t i o n s ' ) ;  
                 a l l R e c s   =   d a t a . r e c o m m e n d a t i o n s   | |   [ ] ;  
  
                 r e n d e r A I P r e d i c t i o n s ( e n t r i e s ) ;  
                 r e n d e r A I C o a c h ( ) ;   / /   N E W :   R e a l   L L M   I n t e g r a t i o n  
                 r e n d e r R e c s G r i d ( a l l R e c s ,   d a t a . s t a t e ) ;  
                 r e n d e r P a t t e r n s ( e n t r i e s ) ;  
                 r e n d e r C h a l l e n g e s ( ) ;  
  
                 c o n s t   r e c C o u n t   =   d o c u m e n t . g e t E l e m e n t B y I d ( ' r e c C o u n t ' ) ;  
                 i f   ( r e c C o u n t )   {  
                         r e c C o u n t . t e x t C o n t e n t   =   e n t r i e s . l e n g t h   >   0  
                                 ?   a l l R e c s . l e n g t h   +   '   D a t a - D r i v e n   I n s i g h t s '  
                                 :   ' W a i t i n g   f o r   i n i t i a l   a c t i v i t y . . . ' ;  
                 }  
         }   c a t c h   ( e r r )   {  
                 s h o w G l o b a l T o a s t ( " L i v e   R e c o m m e n d e r   E r r o r :   C h e c k   A P I " ) ;  
         }  
 } ) ;  
  
 / /   â  ¬ â  ¬   A I   P r e d i c t i o n s   â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬  
 a s y n c   f u n c t i o n   r e n d e r A I P r e d i c t i o n s ( e n t r i e s )   {  
         c o n s t   e l s   =   [ ' p r e d C u r r e n t M o n t h ' ,   ' p r e d N e x t M o n t h ' ,   ' p r e d S a v i n g s ' ] ;  
         c o n s t   c l e a r L o a d i n g   =   ( )   = >   e l s . f o r E a c h ( i d   = >   {    
                 c o n s t   e l   =   d o c u m e n t . g e t E l e m e n t B y I d ( i d ) ;  
                 i f   ( e l   & &   e l . t e x t C o n t e n t   = = =   ' L o a d i n g . . . ' )   e l . t e x t C o n t e n t   =   ' - - ' ;    
         } ) ;  
  
         i f   ( ! e n t r i e s   | |   e n t r i e s . l e n g t h   = = =   0 )   {  
                 e l s . f o r E a c h ( i d   = >   {   i f   ( d o c u m e n t . g e t E l e m e n t B y I d ( i d ) )   d o c u m e n t . g e t E l e m e n t B y I d ( i d ) . t e x t C o n t e n t   =   ' - - ' ;   } ) ;  
                 r e t u r n ;  
         }  
  
         t r y   {  
                 c o n s t   m l D a t a   =   a w a i t   a p i F e t c h ( ' / a i / p r e d i c t ' ) ;  
  
                 i f   ( m l D a t a . s u c c e s s )   {  
                         i f   ( d o c u m e n t . g e t E l e m e n t B y I d ( ' p r e d N e x t M o n t h ' ) )   {  
                                 d o c u m e n t . g e t E l e m e n t B y I d ( ' p r e d N e x t M o n t h ' ) . i n n e r H T M L   =   ` $ { m l D a t a . p r e d i c t i o n }   < s m a l l   s t y l e = " f o n t - s i z e : 0 . 7 r e m ;   c o l o r : v a r ( - - p r i m a r y ) " > ( $ { m l D a t a . c o n f i d e n c e } %   C o n f i d e n c e ) < / s m a l l > ` ;  
                         }  
                         i f   ( d o c u m e n t . g e t E l e m e n t B y I d ( ' p r e d C u r r e n t M o n t h ' ) )   {  
                                 c o n s t   r e c e n t   =   e n t r i e s . s l i c e ( 0 ,   3 0 ) ;  
                                 c o n s t   c u r r e n t M o n t h E s t   =   + ( r e c e n t . r e d u c e ( ( s ,   e )   = >   s   +   e . t o t a l ,   0 )   /   M a t h . m a x ( r e c e n t . l e n g t h ,   1 )   *   3 0 ) . t o F i x e d ( 1 ) ;  
                                 d o c u m e n t . g e t E l e m e n t B y I d ( ' p r e d C u r r e n t M o n t h ' ) . t e x t C o n t e n t   =   c u r r e n t M o n t h E s t ;  
  
                                 i f   ( d o c u m e n t . g e t E l e m e n t B y I d ( ' p r e d S a v i n g s ' ) )   {  
                                         c o n s t   s a v i n g s   =   + ( c u r r e n t M o n t h E s t   -   m l D a t a . p r e d i c t i o n ) ;  
                                         d o c u m e n t . g e t E l e m e n t B y I d ( ' p r e d S a v i n g s ' ) . t e x t C o n t e n t   =   s a v i n g s   >   0   ?   s a v i n g s . t o F i x e d ( 1 )   :   " O p t i m i z e d " ;  
                                 }  
  
                                 r e n d e r P r e d i c t i o n C h a r t ( e n t r i e s ,   c u r r e n t M o n t h E s t ,   m l D a t a . p r e d i c t i o n ) ;  
                         }  
                 }   e l s e   {  
                         t h r o w   n e w   E r r o r ( " A P I   u n s u c c e s s f u l " ) ;  
                 }  
         }   c a t c h   ( e r r )   {  
                 c o n s o l e . w a r n ( " M L   P r e d i c t i o n   f a i l e d ,   u s i n g   b a s i c   t r e n d   f a l l b a c k " ,   e r r ) ;  
                 c l e a r L o a d i n g ( ) ;  
                 / /   F a l l b a c k   t o   b a s i c   l o g i c   i f   s e r v e r - s i d e   M L   f a i l s  
                 c o n s t   r e c e n t   =   e n t r i e s . s l i c e ( 0 ,   3 0 ) ;  
                 c o n s t   a v g D a i l y   =   r e c e n t . l e n g t h   >   0   ?   r e c e n t . r e d u c e ( ( s ,   e )   = >   s   +   e . t o t a l ,   0 )   /   r e c e n t . l e n g t h   :   0 ;  
                 c o n s t   c u r r e n t M o n t h E s t   =   + ( a v g D a i l y   *   3 0 ) . t o F i x e d ( 1 ) ;  
                 c o n s t   r e c e n t 7   =   e n t r i e s . s l i c e ( 0 ,   7 ) . r e d u c e ( ( s ,   e )   = >   s   +   e . t o t a l ,   0 )   /   M a t h . m a x ( e n t r i e s . s l i c e ( 0 ,   7 ) . l e n g t h ,   1 ) ;  
                 c o n s t   o l d e r 7   =   e n t r i e s . s l i c e ( 7 ,   1 4 ) . r e d u c e ( ( s ,   e )   = >   s   +   e . t o t a l ,   0 )   /   M a t h . m a x ( e n t r i e s . s l i c e ( 7 ,   1 4 ) . l e n g t h ,   1 ) ;  
                 c o n s t   t r e n d   =   o l d e r 7   >   0   ?   ( r e c e n t 7   -   o l d e r 7 )   /   o l d e r 7   :   0 ;  
                 c o n s t   n e x t M o n t h P r e d   =   + ( c u r r e n t M o n t h E s t   *   ( 1   +   t r e n d   *   0 . 5 ) ) . t o F i x e d ( 1 ) ;  
  
                 i f   ( d o c u m e n t . g e t E l e m e n t B y I d ( ' p r e d C u r r e n t M o n t h ' ) )   d o c u m e n t . g e t E l e m e n t B y I d ( ' p r e d C u r r e n t M o n t h ' ) . t e x t C o n t e n t   =   c u r r e n t M o n t h E s t ;  
                 i f   ( d o c u m e n t . g e t E l e m e n t B y I d ( ' p r e d N e x t M o n t h ' ) )   d o c u m e n t . g e t E l e m e n t B y I d ( ' p r e d N e x t M o n t h ' ) . t e x t C o n t e n t   =   n e x t M o n t h P r e d ;  
                 i f   ( d o c u m e n t . g e t E l e m e n t B y I d ( ' p r e d S a v i n g s ' ) )   d o c u m e n t . g e t E l e m e n t B y I d ( ' p r e d S a v i n g s ' ) . t e x t C o n t e n t   =   ( c u r r e n t M o n t h E s t   *   0 . 1 5 ) . t o F i x e d ( 1 ) ;  
  
                 r e n d e r P r e d i c t i o n C h a r t ( e n t r i e s ,   c u r r e n t M o n t h E s t ,   n e x t M o n t h P r e d ) ;  
         }  
 }  
  
 f u n c t i o n   r e n d e r P r e d i c t i o n C h a r t ( e n t r i e s ,   c u r r e n t E s t ,   n e x t P r e d )   {  
         c o n s t   c t x   =   d o c u m e n t . g e t E l e m e n t B y I d ( ' p r e d i c t i o n C h a r t ' ) ;  
         i f   ( ! c t x )   r e t u r n ;  
         c o n s t   n o w   =   n e w   D a t e ( ) ;  
         c o n s t   l a b e l s   =   [ ] ;  
         c o n s t   a c t u a l s   =   [ ] ;  
         c o n s t   p r e d i c t i o n s   =   [ ] ;  
  
         f o r   ( l e t   i   =   5 ;   i   > =   0 ;   i - - )   {  
                 c o n s t   d   =   n e w   D a t e ( n o w ) ;   d . s e t M o n t h ( d . g e t M o n t h ( )   -   i ) ;  
                 l a b e l s . p u s h ( d . t o L o c a l e D a t e S t r i n g ( ' e n - I N ' ,   {   m o n t h :   ' s h o r t '   } ) ) ;  
                 a c t u a l s . p u s h ( n u l l ) ;   / /   S i m p l e   m o c k   f o r   c h a r t   v i s i b i l i t y  
                 p r e d i c t i o n s . p u s h ( n u l l ) ;  
         }  
         l a b e l s . p u s h ( ' N o w ' ,   ' M o n t h   1 ' ,   ' M o n t h   2 ' ) ;  
         a c t u a l s . p u s h ( c u r r e n t E s t ,   n u l l ,   n u l l ) ;  
         p r e d i c t i o n s . p u s h ( c u r r e n t E s t ,   n e x t P r e d ,   n e x t P r e d   *   0 . 9 ) ;  
  
         i f   ( p r e d i c t i o n C h a r t I n s t a n c e )   p r e d i c t i o n C h a r t I n s t a n c e . d e s t r o y ( ) ;  
         p r e d i c t i o n C h a r t I n s t a n c e   =   n e w   C h a r t ( c t x ,   {  
                 t y p e :   ' l i n e ' ,  
                 d a t a :   {  
                         l a b e l s ,  
                         d a t a s e t s :   [  
                                 {   l a b e l :   ' A c t u a l ' ,   d a t a :   a c t u a l s ,   b o r d e r C o l o r :   ' # 2 2 c 5 5 e ' ,   f i l l :   t r u e   } ,  
                                 {   l a b e l :   ' A I   P r e d i c t i o n ' ,   d a t a :   p r e d i c t i o n s ,   b o r d e r C o l o r :   ' # 3 b 8 2 f 6 ' ,   b o r d e r D a s h :   [ 5 ,   5 ]   }  
                         ]  
                 } ,  
                 o p t i o n s :   {   r e s p o n s i v e :   t r u e ,   m a i n t a i n A s p e c t R a t i o :   f a l s e   }  
         } ) ;  
 }  
  
 / /   â  ¬ â  ¬   R e c s   G r i d   â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬ â  ¬  
 f u n c t i o n   r e n d e r R e c s G r i d ( r e c s ,   s t a t e   =   ' a c t i v e ' )   {  
         c o n s t   g r i d   =   d o c u m e n t . g e t E l e m e n t B y I d ( ' r e c s F u l l G r i d ' ) ;  
         i f   ( ! g r i d )   r e t u r n ;  
  
         i f   ( r e c s . l e n g t h   = = =   0 )   {  
                 i f   ( s t a t e   = = =   ' h e r o ' )   {  
                         g r i d . i n n e r H T M L   =   `  
                                 < d i v   c l a s s = " h e r o - s t a t e "   s t y l e = " g r i d - c o l u m n :   1   /   - 1 ;   p a d d i n g :   4 r e m ;   t e x t - a l i g n :   c e n t e r ;   b a c k g r o u n d :   l i n e a r - g r a d i e n t ( 1 3 5 d e g ,   r g b a ( 3 4 , 1 9 7 , 9 4 , 0 . 0 5 ) ,   r g b a ( 6 , 1 8 2 , 2 1 2 , 0 . 0 5 ) ) ;   b o r d e r - r a d i u s :   2 4 p x ;   b o r d e r :   1 p x   s o l i d   r g b a ( 3 4 , 1 9 7 , 9 4 , 0 . 1 5 ) ; " >  
                                         < d i v   s t y l e = " f o n t - s i z e :   4 r e m ;   m a r g i n - b o t t o m :   1 . 5 r e m ; " > ð xR¿ ð x & < / d i v >  
                                         < h 2   s t y l e = " c o l o r :   # 2 2 c 5 5 e ;   m a r g i n - b o t t o m :   1 r e m ; " > E l i t e   E c o - C h a m p i o n < / h 2 >  
                                         < p   s t y l e = " c o l o r :   v a r ( - - t e x t - s e c o n d a r y ) ;   m a x - w i d t h :   5 0 0 p x ;   m a r g i n :   0   a u t o ;   l i n e - h e i g h t :   1 . 6 ; " > O u r   A I   h a s   a n a l y z e d   y o u r   c o n s u m p t i o n   a n d   f o u n d   y o u   a r e   a l r e a d y   p e r f o r m i n g   a t   p e a k   s u s t a i n a b i l i t y   l e v e l s !   T h e r e   a r e   n o   r e c o m m e n d a t i o n s   b e c a u s e   y o u r   f o o t p r i n t   i n   a l l   c a t e g o r i e s   i s   r e m a r k a b l y   l o w .   E x c e l l e n t   w o r k ! < / p >  
                                 < / d i v >  
                         ` ;  
                 }   e l s e   {  
                         g r i d . i n n e r H T M L   =   `  
                                 < d i v   c l a s s = " e m p t y - s t a t e "   s t y l e = " g r i d - c o l u m n :   1   /   - 1 ;   p a d d i n g :   3 r e m ;   t e x t - a l i g n :   c e n t e r ;   b a c k g r o u n d :   r g b a ( 2 5 5 , 2 5 5 , 2 5 5 , 0 . 0 2 ) ;   b o r d e r - r a d i u s :   1 6 p x ;   b o r d e r :   1 p x   d a s h e d   r g b a ( 2 5 5 , 2 5 5 , 2 5 5 , 0 . 1 ) ; " >  
                                         < d i v   s t y l e = " f o n t - s i z e :   3 r e m ;   m a r g i n - b o t t o m :   1 r e m ; " > ð x ¡ < / d i v >  
                                         < h 3   s t y l e = " c o l o r :   w h i t e ;   m a r g i n - b o t t o m :   0 . 5 r e m ; " > N o   P e r s o n a l i z e d   I n s i g h t s   A v a i l a b l e < / h 3 >  
                                         < p   s t y l e = " c o l o r :   v a r ( - - t e x t - s e c o n d a r y ) ;   m a x - w i d t h :   4 0 0 p x ;   m a r g i n :   0   a u t o   1 . 5 r e m   a u t o ;   f o n t - s i z e :   0 . 9 r e m ; " > W e   n e e d   s o m e   d a t a   a b o u t   y o u r   l i f e s t y l e   t o   p r o v i d e   s m a r t   r e c o m m e n d a t i o n s .   P l e a s e   u s e   t h e   c a l c u l a t o r   t o   l o g   y o u r   d a i l y   a c t i v i t i e s . < / p >  
                                         < b u t t o n   c l a s s = " b t n - p r i m a r y "   o n c l i c k = " w i n d o w . l o c a t i o n . h r e f = ' c a l c u l a t o r . h t m l ' "   s t y l e = " p a d d i n g :   0 . 7 5 r e m   1 . 5 r e m ;   b a c k g r o u n d :   v a r ( - - a c c e n t - p r i m a r y ) ;   b o r d e r :   n o n e ;   b o r d e r - r a d i u s :   8 p x ;   c o l o r :   w h i t e ;   f o n t - w e i g h t :   6 0 0 ;   c u r s o r :   p o i n t e r ; " > G e t   S t a r t e d   N o w < / b u t t o n >  
                                 < / d i v >  
                         ` ;  
                 }  
                 r e t u r n ;  
         }  
  
         g r i d . i n n e r H T M L   =   r e c s . m a p ( r   = >   `  
             < d i v   c l a s s = " r e c - f u l l - c a r d   $ { r . h i g h I m p a c t   ?   ' r e c - h i g h - i m p a c t '   :   ' ' } " >  
                 < d i v   c l a s s = " r e c - f u l l - h e a d e r " >  
                     < s p a n   s t y l e = " f o n t - s i z e : 1 . 5 r e m " > $ { r . i c o n } < / s p a n >  
                     < d i v >  
                         < d i v   s t y l e = " f o n t - w e i g h t : 7 0 0 " > $ { r . t i t l e } < / d i v >  
                         < d i v   s t y l e = " f o n t - s i z e : 0 . 7 5 r e m ; c o l o r : v a r ( - - t e x t - m u t e d ) " > $ { r . c a t e g o r y } < / d i v >  
                     < / d i v >  
                 < / d i v >  
                 < d i v   s t y l e = " m a r g i n : 0 . 7 5 r e m   0 ; f o n t - s i z e : 0 . 8 5 r e m " > $ { r . d e s c } < / d i v >  
                 < d i v   s t y l e = " c o l o r : # 2 2 c 5 5 e ; f o n t - w e i g h t : 6 0 0 ; f o n t - s i z e : 0 . 8 r e m " > P o t e n t i a l   S a v e :   $ { r . i m p a c t }   k g   C O â   < / d i v >  
             < / d i v >  
         ` ) . j o i n ( ' ' ) ;  
 }  
  
 f u n c t i o n   r e n d e r P a t t e r n s ( e n t r i e s )   {  
         c o n s t   g r i d   =   d o c u m e n t . g e t E l e m e n t B y I d ( ' p a t t e r n s G r i d ' ) ;  
         i f   ( ! g r i d )   r e t u r n ;  
         c o n s t   c o u n t   =   e n t r i e s . l e n g t h ;  
         g r i d . i n n e r H T M L   =   `  
                 < d i v   c l a s s = " p a t t e r n - c a r d " > < h 4 > R e c o r d s < / h 4 > < p > $ { c o u n t }   d a y s < / p > < / d i v >  
                 < d i v   c l a s s = " p a t t e r n - c a r d " > < h 4 > A v g   D a i l y < / h 4 > < p > $ { c o u n t   >   0   ?   ( e n t r i e s . r e d u c e ( ( s ,   e )   = >   s   +   e . t o t a l ,   0 )   /   c o u n t ) . t o F i x e d ( 2 )   :   ' - - ' }   k g < / p > < / d i v >  
                 < d i v   c l a s s = " p a t t e r n - c a r d " > < h 4 > D a t a   S o u r c e < / h 4 > < p > M o n g o D B   C l o u d < / p > < / d i v >  
         ` ;  
 }  
  
 a s y n c   f u n c t i o n   r e n d e r A I C o a c h ( )   {  
         c o n s t   e l   =   d o c u m e n t . g e t E l e m e n t B y I d ( ' a i C o a c h C o n t e n t ' ) ;  
         i f   ( ! e l )   r e t u r n ;  
  
         t r y   {  
                 c o n s t   d a t a   =   a w a i t   a p i F e t c h ( ' / a i / c o a c h ' ) ;  
                 i f   ( d a t a . s u c c e s s )   {  
                         e l . i n n e r H T M L   =   d a t a . a d v i c e ;  
                 }   e l s e   {  
                         t h r o w   n e w   E r r o r ( d a t a . m e s s a g e ) ;  
                 }  
         }   c a t c h   ( e r r )   {  
                 e l . i n n e r H T M L   =   ` < p   s t y l e = " c o l o r : v a r ( - - d a n g e r ) " > â a  ï ¸    F a i l e d   t o   s y n c   w i t h   E c o C o a c h   A I .   $ { e r r . m e s s a g e } < / p > ` ;  
         }  
 }  
  
 f u n c t i o n   r e n d e r C h a l l e n g e s ( )   {  
         i f   ( t y p e o f   r e n d e r C h a l l e n g e s W i t h N o t i f i c a t i o n s   = = =   ' f u n c t i o n ' )   {  
                 r e n d e r C h a l l e n g e s W i t h N o t i f i c a t i o n s ( ' c h a l l e n g e s G r i d ' ) ;  
                 i n i t C h a l l e n g e N o t i f i c a t i o n s ( ) ;  
         }  
 }  
  
 f u n c t i o n   f i l t e r R e c s ( c a t ,   b t n )   {  
         d o c u m e n t . q u e r y S e l e c t o r A l l ( ' . r e c - f i l t e r - b t n ' ) . f o r E a c h ( b   = >   b . c l a s s L i s t . r e m o v e ( ' a c t i v e ' ) ) ;  
         b t n . c l a s s L i s t . a d d ( ' a c t i v e ' ) ;  
  
         i f   ( a l l R e c s . l e n g t h   = = =   0 )   r e t u r n ;  
  
         l e t   f i l t e r e d   =   a l l R e c s ;  
         i f   ( c a t   ! = =   ' a l l ' )   {  
                 i f   ( c a t   = = =   ' h i g h - i m p a c t ' )   {  
                         f i l t e r e d   =   a l l R e c s . f i l t e r ( r   = >   r . h i g h I m p a c t ) ;  
                 }   e l s e   {  
                         f i l t e r e d   =   a l l R e c s . f i l t e r ( r   = >   r . c a t   = = =   c a t ) ;  
                 }  
         }  
         r e n d e r R e c s G r i d ( f i l t e r e d ) ;  
 }  
  
 / /   D E P R E C A T E D :   M o v e d   t o   B a c k e n d   A I   S e r v i c e  
 