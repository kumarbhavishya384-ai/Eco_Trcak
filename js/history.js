/* ===================================================
   EcoTrack AI – History JS (history.js)
   =================================================== */

let historyChartInstance = null;
let allEntries = [];

document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (!user) return;

    try {
        allEntries = await getUserEntries();
        renderHistoryStats(allEntries);
        updateHistoryChart();
        renderHistoryTable(allEntries);
    } catch (err) {
        showGlobalToast("Failed to fetch history from MongoDB");
    }
});

// ── Summary Stats ─────────────────────────────────────
function renderHistoryStats(entries) {
    if (document.getElementById('hst-total')) document.getElementById('hst-total').textContent = entries.length;

    const totalCO2 = entries.reduce((s, e) => s + (e.total || 0), 0);
    const co2El = document.getElementById('hst-co2');
    if (co2El) animateCounterHistory(co2El, 0, totalCO2, 1200, 1);

    if (entries.length > 0) {
        const best = [...entries].sort((a, b) => a.total - b.total)[0];
        if (document.getElementById('hst-best')) document.getElementById('hst-best').textContent = best.total.toFixed(2) + ' kg';
    }

    // Streak and other stats handled by backend ideally, but we calculate locally fromfetched list
    const streak = calculateStreak(entries);
    if (document.getElementById('hst-streak')) document.getElementById('hst-streak').textContent = streak + ' days';
}

function calculateStreak(entries) {
    if (entries.length === 0) return 0;
    let streak = 0;
    let checkDate = new Date();
    // Correct local date string formatting
    const toDS = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    for (let i = 0; i < 365; i++) {
        const ds = toDS(checkDate);
        if (entries.some(e => e.date === ds)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }
        else if (i === 0) {
            // Allow skipping today if not logged yet, but check yesterday
            checkDate.setDate(checkDate.getDate() - 1);
        }
        else break;
    }
    return streak;
}

// ── Search & Filter ────────────────────────────────────
function filterHistory() {
    const searchTerm = document.getElementById('historySearch').value.toLowerCase();
    const catFilter = document.getElementById('histCategoryFilter').value;

    const filtered = allEntries.filter(e => {
        const matchesSearch = e.date.includes(searchTerm) || formatDate(e.date).toLowerCase().includes(searchTerm);
        let matchesCat = true;
        if (catFilter !== 'all') {
            matchesCat = e[catFilter] > 0;
        }
        return matchesSearch && matchesCat;
    });

    renderHistoryTable(filtered);
}

// ── Export CSV ────────────────────────────────────────
function exportHistory() {
    if (allEntries.length === 0) {
        showGlobalToast("No data to export");
        return;
    }

    const headers = ["Date", "Transport (kg)", "Electricity (kg)", "Food (kg)", "Total (kg)", "EcoScore"];
    const rows = allEntries.map(e => [
        e.date,
        e.transport.toFixed(2),
        e.electricity.toFixed(2),
        e.food.toFixed(2),
        e.total.toFixed(2),
        e.ecoScore
    ]);

    let csvContent = "data:text/csv;charset=utf-8,"
        + headers.join(",") + "\n"
        + rows.map(r => r.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EcoTrack_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showGlobalToast("History exported as CSV 📄");
}

// ── History Chart ─────────────────────────────────────
function updateHistoryChart() {
    const ctx = document.getElementById('historyChart');
    if (!ctx) return;

    const days = parseInt(document.getElementById('histPeriod')?.value || '30');
    const now = new Date();
    const labels = [];
    const datasets = [
        { label: 'Transport', data: [], backgroundColor: 'rgba(59,130,246,0.7)' },
        { label: 'Electricity', data: [], backgroundColor: 'rgba(234,179,8,0.7)' },
        { label: 'Food', data: [], backgroundColor: 'rgba(34,197,94,0.7)' }
    ];

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        const entry = allEntries.find(e => e.date === ds);
        labels.push(d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
        datasets[0].data.push(entry ? entry.transport : 0);
        datasets[1].data.push(entry ? entry.electricity : 0);
        datasets[2].data.push(entry ? entry.food : 0);
    }

    if (historyChartInstance) historyChartInstance.destroy();
    historyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { x: { stacked: true }, y: { stacked: true } },
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// ── History Table ─────────────────────────────────────
function renderHistoryTable(entries) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    if (entries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8">No records found in MongoDB.</td></tr>`;
        return;
    }

    tbody.innerHTML = entries.map(e => {
        const tier = getScoreTier(e.ecoScore || 0);
        return `
      <tr>
        <td><strong>${formatDate(e.date)}</strong></td>
        <td>${e.transport?.toFixed(2)} kg</td>
        <td>${e.electricity?.toFixed(2)} kg</td>
        <td>${e.food?.toFixed(2)} kg</td>
        <td><strong>${e.total?.toFixed(2)} kg</strong></td>
        <td><span style="color:${tier.color}">${e.ecoScore}</span></td>
        <td><button class="btn-delete-row" onclick="confirmDeleteEntry('${e.date}')">🗑 Delete</button></td>
      </tr>
    `;
    }).join('');
}

async function confirmDeleteEntry(date) {
    if (!confirm(`Delete entry for ${formatDate(date)} from MongoDB?`)) return;
    try {
        await deleteUserEntry(date);
        allEntries = await getUserEntries();
        renderHistoryStats(allEntries);
        updateHistoryChart();
        renderHistoryTable(allEntries);
        showGlobalToast("Entry deleted from cloud");
    } catch (e) {
        showGlobalToast("Delete failed: " + e.message);
    }
}

function animateCounterHistory(el, from, to, duration, decimals = 0) {
    const startTime = performance.now();
    function update(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const val = from + (to - from) * (1 - Math.pow(1 - progress, 3));
        el.textContent = val.toFixed(decimals);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}
