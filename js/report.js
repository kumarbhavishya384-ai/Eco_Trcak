// ECOTRACK AI – Report Dashboard Logic (Comparison with Gov Data)

const GOV_DAILY_LIMIT = 5.2; // 1.9 tonnes / 365 days = 5.2 kg/day (National Average, India)
const GOV_TRANSPORT_TARGET = 1.0; // Daily
const GOV_ELECTRIC_TARGET = 60.0; // Monthly
const GOV_FOOD_TARGET = 1.2;      // Daily

document.addEventListener('DOMContentLoaded', async () => {
    console.log("LOG: Report Dashboard v2 (API Powered) Initializing...");
    try {
        const user = requireAuth();
        if (!user) return;
        populateSidebar(user);
        renderReport();
    } catch (err) {
        console.error("Report Init Error:", err);
    }
});

async function renderReport() {
    try {
        const res = await apiFetch('/report/comparison');

        if (!res.hasData) {
            showNoData();
            return;
        }

        const { data, targets, status } = res;

        // 1. Update Top Banner
        updateStatusBanner(data.normalizedDailyTotal, targets.nationalDailyLimit, status);

        // 2. Update Metrics Detailed List
        updateMetricsList(data, targets);

        // 3. Render Comparison Chart
        renderComparisonChart(data, targets);

    } catch (err) {
        console.error("Report Comparison API Error:", err);
        showNoData();
    }
}

function updateStatusBanner(avgTotal, limit, status) {
    const banner = document.getElementById('statusBanner');
    const title = document.getElementById('statusTitle');
    const desc = document.getElementById('statusDesc');
    const icon = document.getElementById('statusIcon');

    if (status === 'good') {
        banner.className = 'status-banner status-good';
        title.innerText = 'Good Situation 🌲';
        desc.innerText = `Your daily baseline (${avgTotal.toFixed(2)} kg) is BELOW the national average limit of ${limit} kg. Keep it up!`;
        icon.innerText = '✅';
    } else {
        banner.className = 'status-banner status-danger';
        title.innerText = 'Danger Situation ⚠️';
        desc.innerText = `Your daily baseline (${avgTotal.toFixed(2)} kg) is ABOVE the national average limit of ${limit} kg. Action required!`;
        icon.innerText = '🔴';
    }
}

function updateMetricsList(data, targets) {
    const list = document.getElementById('metricsList');
    const metrics = [
        { label: 'Transport', val: data.transport, target: targets.transportDaily, icon: '🚗', period: 'Daily' },
        { label: 'Electricity', val: data.electricity, target: targets.electricityMonthly, icon: '⚡', period: 'Monthly' },
        { label: 'Food', val: data.food, target: targets.foodDaily, icon: '🍽️', period: 'Daily' }
    ];

    list.innerHTML = metrics.map(m => {
        const isBetter = m.val <= m.target;
        return `
            <div class="activity-item">
                <div class="activity-left">
                    <span class="activity-icon">${m.icon}</span>
                    <div>
                    <div class="activity-total">${m.label} (${m.period})</div>
                        <div class="activity-date">Your ${m.period}: ${m.val.toFixed(2)} kg vs Target: ${m.target.toFixed(2)} kg</div>
                    </div>
                </div>
                <div class="activity-score" style="background: ${isBetter ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${isBetter ? 'var(--green)' : '#ef4444'}">
                    ${isBetter ? 'Within Target' : 'Needs Work'}
                </div>
            </div>
        `;
    }).join('');
}

function renderComparisonChart(data, targets) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Transport (Daily)', 'Electricity (Monthly)', 'Food (Daily)'],
            datasets: [
                {
                    label: 'Your Data (kg CO2e)',
                    data: [data.transport, data.electricity, data.food],
                    backgroundColor: 'rgba(34, 197, 94, 0.6)',
                    borderColor: 'var(--green)',
                    borderWidth: 1
                },
                {
                    label: 'National Target (kg CO2e)',
                    data: [targets.transportDaily, targets.electricityMonthly, targets.foodDaily],
                    backgroundColor: 'rgba(239, 68, 68, 0.3)',
                    borderColor: '#ef4444',
                    borderWidth: 1,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: 'rgba(255, 255, 255, 0.8)' }
                }
            }
        }
    });
}

function showNoData() {
    const banner = document.getElementById('statusBanner');
    banner.className = 'status-banner';
    banner.style.background = 'rgba(255, 255, 255, 0.05)';
    document.getElementById('statusTitle').innerText = 'No Data Available';
    document.getElementById('statusDesc').innerText = 'Please log your data in the Calculator to see your report.';
    document.getElementById('statusIcon').innerText = '📊';
}
