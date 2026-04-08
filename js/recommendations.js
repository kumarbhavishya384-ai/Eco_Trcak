/* ===================================================
   EcoTrack AI – Recommendations JS (recommendations.js)
   =================================================== */

let allRecs = [];
let predictionChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!getCurrentUser()) return;

    const grid = document.getElementById('recsFullGrid');
    if (grid) grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem;"><div class="loading-spinner"></div><p style="margin-top:1rem; color:var(--text-secondary)">${t('ai_analyzing')}</p></div>';

    try {
        const entries = await getUserEntries();
        const data = await apiFetch('/recommendations');
        allRecs = data.recommendations || [];

        renderAIPredictions(entries);
        renderAICoach(); // NEW: Real LLM Integration
        renderRecsGrid(allRecs, data.state);
        renderPatterns(entries);
        renderChallenges();

        const recCount = document.getElementById('recCount');
        if (recCount) {
            recCount.textContent = entries.length > 0
                ? allRecs.length + ' Data-Driven Insights'
                : 'Waiting for initial activity...';
        }
    } catch (err) {
        showGlobalToast("Live Recommender Error: Check API");
    }
});

// ── AI Predictions ────────────────────────────────────
async function renderAIPredictions(entries) {
    const els = ['predCurrentMonth', 'predNextMonth', 'predSavings'];
    const clearLoading = () => els.forEach(id => { 
        const el = document.getElementById(id);
        if (el && el.textContent === 'Loading...') el.textContent = '--'; 
    });

    if (!entries || entries.length === 0) {
        els.forEach(id => { if (document.getElementById(id)) document.getElementById(id).textContent = '--'; });
        return;
    }

    try {
        const mlData = await apiFetch('/ai/predict');

        if (mlData.success) {
            if (document.getElementById('predNextMonth')) {
                document.getElementById('predNextMonth').innerHTML = `${mlData.prediction} <small style="font-size:0.7rem; color:var(--primary)">(${mlData.confidence}% Confidence)</small>`;
            }
            if (document.getElementById('predCurrentMonth')) {
                const recent = entries.slice(0, 30);
                const currentMonthEst = +(recent.reduce((s, e) => s + e.total, 0) / Math.max(recent.length, 1) * 30).toFixed(1);
                document.getElementById('predCurrentMonth').textContent = currentMonthEst;

                if (document.getElementById('predSavings')) {
                    const savings = +(currentMonthEst - mlData.prediction);
                    document.getElementById('predSavings').textContent = savings > 0 ? savings.toFixed(1) : "Optimized";
                }

                renderPredictionChart(entries, currentMonthEst, mlData.prediction);
            }
        } else {
            throw new Error("API unsuccessful");
        }
    } catch (err) {
        console.warn("ML Prediction failed, using basic trend fallback", err);
        clearLoading();
        // Fallback to basic logic if server-side ML fails
        const recent = entries.slice(0, 30);
        const avgDaily = recent.length > 0 ? recent.reduce((s, e) => s + e.total, 0) / recent.length : 0;
        const currentMonthEst = +(avgDaily * 30).toFixed(1);
        const recent7 = entries.slice(0, 7).reduce((s, e) => s + e.total, 0) / Math.max(entries.slice(0, 7).length, 1);
        const older7 = entries.slice(7, 14).reduce((s, e) => s + e.total, 0) / Math.max(entries.slice(7, 14).length, 1);
        const trend = older7 > 0 ? (recent7 - older7) / older7 : 0;
        const nextMonthPred = +(currentMonthEst * (1 + trend * 0.5)).toFixed(1);

        if (document.getElementById('predCurrentMonth')) document.getElementById('predCurrentMonth').textContent = currentMonthEst;
        if (document.getElementById('predNextMonth')) document.getElementById('predNextMonth').textContent = nextMonthPred;
        if (document.getElementById('predSavings')) document.getElementById('predSavings').textContent = (currentMonthEst * 0.15).toFixed(1);

        renderPredictionChart(entries, currentMonthEst, nextMonthPred);
    }
}

function renderPredictionChart(entries, currentEst, nextPred) {
    const ctx = document.getElementById('predictionChart');
    if (!ctx) return;
    const now = new Date();
    const labels = [];
    const actuals = [];
    const predictions = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date(now); d.setMonth(d.getMonth() - i);
        labels.push(d.toLocaleDateString('en-IN', { month: 'short' }));
        actuals.push(null); // Simple mock for chart visibility
        predictions.push(null);
    }
    labels.push('Now', 'Month 1', 'Month 2');
    actuals.push(currentEst, null, null);
    predictions.push(currentEst, nextPred, nextPred * 0.9);

    if (predictionChartInstance) predictionChartInstance.destroy();
    predictionChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Actual', data: actuals, borderColor: '#22c55e', fill: true },
                { label: 'AI Prediction', data: predictions, borderColor: '#3b82f6', borderDash: [5, 5] }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// ── Recs Grid ─────────────────────────────────────────
function renderRecsGrid(recs, state = 'active') {
    const grid = document.getElementById('recsFullGrid');
    if (!grid) return;

    if (recs.length === 0) {
        if (state === 'hero') {
            grid.innerHTML = `
                <div class="hero-state" style="grid-column: 1 / -1; padding: 4rem; text-align: center; background: linear-gradient(135deg, rgba(34,197,94,0.05), rgba(6,182,212,0.05)); border-radius: 24px; border: 1px solid rgba(34,197,94,0.15);">
                    <div style="font-size: 4rem; margin-bottom: 1.5rem;">🌿🏅</div>
                    <h2 style="color: #22c55e; margin-bottom: 1rem;">${t('hero_title')}</h2>
                    <p style="color: var(--text-secondary); max-width: 500px; margin: 0 auto; line-height: 1.6;">${t('hero_desc')} There are no recommendations because your footprint in all categories is remarkably low. Excellent work!</p>
                </div>
            `;
        } else {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; padding: 3rem; text-align: center; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.1);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">💡</div>
                    <h3 style="color: white; margin-bottom: 0.5rem;">${t('no_insights_title')}</h3>
                    <p style="color: var(--text-secondary); max-width: 400px; margin: 0 auto 1.5rem auto; font-size: 0.9rem;">${t('no_insights_desc')} Please use the calculator to log your daily activities.</p>
                    <button class="btn-primary" onclick="window.location.href='calculator.html'" style="padding: 0.75rem 1.5rem; background: var(--accent-primary); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer;">Get Started Now</button>
                </div>
            `;
        }
        return;
    }

    grid.innerHTML = recs.map(r => `
      <div class="rec-full-card ${r.highImpact ? 'rec-high-impact' : ''}">
        <div class="rec-full-header">
          <span style="font-size:1.5rem">${r.icon}</span>
          <div>
            <div style="font-weight:700">${t('rec_title_' + r.id.trim())}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${t(r.cat + '_label')}</div>
          </div>
        </div>
        <div style="margin:0.75rem 0;font-size:0.85rem">${t('rec_desc_' + r.id.trim())}</div>
        <div style="color:#22c55e;font-weight:600;font-size:0.8rem">${t('potential_save')}: ${r.impact} kg CO₂</div>
      </div>
    `).join('');
}

function renderPatterns(entries) {
    const grid = document.getElementById('patternsGrid');
    if (!grid) return;
    const count = entries.length;
    grid.innerHTML = `
        <div class="pattern-card"><h4>Records</h4><p>${count} days</p></div>
        <div class="pattern-card"><h4>Avg Daily</h4><p>${count > 0 ? (entries.reduce((s, e) => s + e.total, 0) / count).toFixed(2) : '--'} kg</p></div>
        <div class="pattern-card"><h4>Data Source</h4><p>MongoDB Cloud</p></div>
    `;
}

async function renderAICoach() {
    const el = document.getElementById('aiCoachContent');
    if (!el) return;

    try {
        const data = await apiFetch(`/ai/coach?lang=${currentLang}`);
        if (data.success) {
            el.innerHTML = data.advice;
        } else {
            throw new Error(data.message);
        }
    } catch (err) {
        el.innerHTML = `<p style="color:var(--danger)">⚠️ ${t('coach_error', 'Failed to sync with EcoCoach AI.')} ${err.message}</p>`;
    }
}

function renderChallenges() {
    if (typeof renderChallengesWithNotifications === 'function') {
        renderChallengesWithNotifications('challengesGrid');
        initChallengeNotifications();
    }
}

function filterRecs(cat, btn) {
    document.querySelectorAll('.rec-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (allRecs.length === 0) return;

    let filtered = allRecs;
    if (cat !== 'all') {
        if (cat === 'high-impact') {
            filtered = allRecs.filter(r => r.highImpact);
        } else {
            filtered = allRecs.filter(r => r.cat === cat);
        }
    }
    renderRecsGrid(filtered);
}

// DEPRECATED: Moved to Backend AI Service
