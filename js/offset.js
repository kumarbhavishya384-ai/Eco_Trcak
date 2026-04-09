/* ===================================================
   EcoTrack AI – Offset Tools JS (offset.js)
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (!user) return;

    const entries = getUserEntries(user.id);
    renderOffsetOverview(entries);
    renderNGOPartners();

    // Initialize calculators with defaults
    calcTrees();
    calcSolar();
    calcCredits();
});

// ── Offset Overview ───────────────────────────────────
function renderOffsetOverview(entries) {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    const monthEntries = entries.filter(e => new Date(e.date) >= cutoff);
    const monthTotal = monthEntries.reduce((s, e) => s + e.total, 0);

    const totalEl = document.getElementById('totalToOffset');
    if (totalEl) totalEl.textContent = monthTotal.toFixed(1);

    // Simulate 30% already offset
    const offsetPct = Math.min(100, Math.round((15 / (monthTotal || 100)) * 100));
    const pctEl = document.getElementById('offsetPct');
    if (pctEl) pctEl.textContent = offsetPct + '%';

    // Animate ring
    const ring = document.getElementById('offsetRingCircle');
    if (ring) {
        const circumference = 264;
        const offset = circumference - (offsetPct / 100) * circumference;
        setTimeout(() => { ring.style.strokeDashoffset = offset; ring.style.transition = 'stroke-dashoffset 1.5s ease'; }, 200);
    }

    // Pre-fill tree calculator with month total
    const treeInput = document.getElementById('treeOffsetKg');
    if (treeInput && monthTotal > 0) {
        treeInput.value = monthTotal.toFixed(1);
        calcTrees();
    }

    // Pre-fill credit calculator
    const creditInput = document.getElementById('creditKg');
    if (creditInput && monthTotal > 0) {
        creditInput.value = monthTotal.toFixed(1);
        calcCredits();
    }
}

// ── Tree Plantation Calculator ────────────────────────
function calcTrees() {
    const kg = +document.getElementById('treeOffsetKg')?.value || 0;
    const treeAbsorption = +document.getElementById('treeType')?.value || 21; // kg CO₂/year per tree

    // Convert to monthly absorption
    const monthlyAbsorption = treeAbsorption / 12;
    const treesNeeded = kg > 0 ? Math.ceil(kg / monthlyAbsorption) : 0;

    const countEl = document.getElementById('treeCount');
    if (countEl) countEl.textContent = treesNeeded.toLocaleString('en-IN');

    // Tree visual
    const visualEl = document.getElementById('treeVisual');
    if (visualEl) {
        const displayCount = Math.min(treesNeeded, 50);
        visualEl.textContent = '. '.repeat(displayCount) + (treesNeeded > 50 ? ` +${treesNeeded - 50} more` : '');
    }

    // Extra info
    const extraEl = document.getElementById('treeExtra');
    if (extraEl && treesNeeded > 0) {
        const area = (treesNeeded * 4).toFixed(0); // ~4 m² per tree
        const cost = (treesNeeded * 250).toLocaleString('en-IN'); // ₹250 avg planting cost
        extraEl.innerHTML = `
      Requires ~${area} m² of land &nbsp;|&nbsp;
      Est. planting cost: ₹${cost}<br/>
      Full offset in: ${Math.ceil(kg / treeAbsorption * 12)} months per tree
    `;
    } else if (extraEl) {
        extraEl.textContent = 'Enter CO₂ amount to calculate trees needed.';
    }
}

// ── Solar Savings Calculator ──────────────────────────
function calcSolar() {
    const bill = +document.getElementById('solarBill')?.value || 0;
    const area = +document.getElementById('solarArea')?.value || 0; // sq ft
    const solarIrradiance = +document.getElementById('solarState')?.value || 4.5; // kWh/m²/day

    if (bill === 0 && area === 0) {
        ['solarKwPerYear', 'solarCO2Save', 'solarMoneySave', 'solarPayback'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '--';
        });
        return;
    }

    // Convert sq ft to m²
    const areaM2 = area * 0.0929;
    // Typical panel efficiency: 20%, system efficiency: 80%
    const panelCapacityKw = areaM2 * 0.2; // kW peak
    const kwhPerDay = panelCapacityKw * solarIrradiance * 0.8;
    const kwhPerYear = kwhPerDay * 365;

    // CO₂ savings (India grid factor: 0.82 kg/kWh)
    const co2SavePerYear = kwhPerYear * 0.82;

    // Money savings (avg ₹6/kWh)
    const moneySavePerYear = kwhPerYear * 6;

    // Payback period (system cost ~₹60/watt, so ₹60,000/kW)
    const systemCostRs = panelCapacityKw * 60000;
    const paybackYears = moneySavePerYear > 0 ? (systemCostRs / moneySavePerYear).toFixed(1) : '--';

    const kwEl = document.getElementById('solarKwPerYear');
    if (kwEl) kwEl.textContent = kwhPerYear.toFixed(0);

    const co2El = document.getElementById('solarCO2Save');
    if (co2El) co2El.textContent = co2SavePerYear.toFixed(0);

    const moneyEl = document.getElementById('solarMoneySave');
    if (moneyEl) moneyEl.textContent = '₹' + moneySavePerYear.toLocaleString('en-IN', { maximumFractionDigits: 0 });

    const paybackEl = document.getElementById('solarPayback');
    if (paybackEl) {
        paybackEl.innerHTML = `
      System cost: ₹${systemCostRs.toLocaleString('en-IN', { maximumFractionDigits: 0 })}<br/>
      Payback period: <strong style="color:#22c55e">${paybackYears} years</strong><br/>
      ${panelCapacityKw > 0 ? `${panelCapacityKw.toFixed(2)} kW system fits on your roof` : ''}
    `;
    }
}

// ── Carbon Credit Calculator ──────────────────────────
function calcCredits() {
    const kg = +document.getElementById('creditKg')?.value || 0;
    const ratePerKg = +document.getElementById('creditType')?.value || 6;

    const totalCost = kg * ratePerKg;

    const costEl = document.getElementById('creditCost');
    if (costEl) costEl.textContent = '₹' + totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 });

    const equivEl = document.getElementById('creditEquiv');
    if (equivEl && kg > 0) {
        const tonCO2 = (kg / 1000).toFixed(3);
        const globalRate = (kg * 0.75).toFixed(0); // ~$0.75/kg in USD equivalent
        equivEl.innerHTML = `
      = ${tonCO2} tonnes CO₂ &nbsp;|&nbsp; Global market equiv: ~$${globalRate}<br/>
      <span style="color:var(--text-muted);font-size:0.75rem">Price varies by program; certified offsets are most reliable</span>
    `;
    } else if (equivEl) {
        equivEl.textContent = 'Enter CO₂ amount to see cost estimate.';
    }
}

// ── NGO Partners ──────────────────────────────────────
function renderNGOPartners() {
    const grid = document.getElementById('ngoPartnersGrid');
    if (!grid) return;

    const partners = [
        {
            icon: '', name: 'Green India Foundation',
            desc: 'Plant native trees across India with GPS-verified tracking. Each tree comes with a certificate.',
            tag: 'Reforestation', ctaPrice: '₹250/tree'
        },
        {
            icon: '', name: 'Solar Warriors India',
            desc: 'Fund solar installations for rural schools & hospitals. 100% accountability via satellite imagery.',
            tag: 'Solar Energy', ctaPrice: '₹500/panel'
        },
        {
            icon: '', name: 'Waste Warriors',
            desc: 'Support verified waste management initiatives that prevent methane emissions at landfills.',
            tag: 'Waste Management', ctaPrice: '₹200/month'
        },
        {
            icon: '', name: 'Climate Smart Agriculture',
            desc: 'Help farmers adopt low-emission practices. Verified by third-party auditors.',
            tag: 'Agriculture', ctaPrice: '₹350/month'
        },
        {
            icon: '', name: 'Mangrove Alliance',
            desc: 'Restore coastal mangroves that sequester 5x more carbon than tropical forests.',
            tag: 'Blue Carbon', ctaPrice: '₹300/plant'
        },
        {
            icon: '', name: "India CSR Network",
            desc: 'Corporate Social Responsibility carbon offset network for businesses and institutions.',
            tag: 'Corporate / CSR', ctaPrice: 'Custom'
        }
    ];

    grid.innerHTML = partners.map(p => `
    <div class="ngo-card">
      <div class="ngo-icon">${p.icon}</div>
      <div class="ngo-name">${p.name}</div>
      <div class="ngo-tag">${p.tag}</div>
      <div class="ngo-desc">${p.desc}</div>
      <div style="font-size:0.8rem;color:var(--green);font-weight:700;margin-bottom:0.75rem">${p.ctaPrice}</div>
      <button class="ngo-partner-btn" onclick="partnerWithNGO('${p.name}', this)">Offset Now</button>
    </div>
  `).join('');
}

async function partnerWithNGO(name, btn) {
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Minting on Polygon...';

    // Simulate Blockchain Latency
    await new Promise(r => setTimeout(r, 2000));

    const txHash = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    btn.textContent = 'Verified on Chain!';
    btn.style.background = 'rgba(34,197,94,0.25)';
    btn.onclick = () => window.open(`https://polygonscan.com/tx/${txHash}`, '_blank');

    showToast(`Offset recorded on Polygon! Certificate Minted.<br/><small style="font-size:0.7rem; color:var(--text-muted)">TX: ${txHash.substring(0, 12)}...</small>`);

    // Create a mini "NFT" badge
    const badge = document.createElement('div');
    badge.style = "position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:10000; background:var(--card-bg); border:2px solid var(--primary); padding:2rem; border-radius:16px; text-align:center; box-shadow:0 20px 50px rgba(0,0,0,0.5); animation: zoomIn 0.5s ease-out;";
    badge.innerHTML = `
        <div style="font-size:4rem; margin-bottom:1rem;"></div>
        <h2 style="color:var(--primary); margin-bottom:0.5rem;">Verified Carbon Credit</h2>
        <p style="font-size:0.9rem; margin-bottom:1rem;">Issued to: ${getCurrentUser().firstName}<br/>Partner: ${name}</p>
        <div style="font-family:monospace; font-size:0.7rem; background:rgba(0,0,0,0.2); padding:0.5rem; border-radius:8px; margin-bottom:1.5rem; word-break:break-all;">${txHash}</div>
        <button onclick="this.parentElement.remove()" class="btn-primary" style="padding:0.6rem 1.5rem;">Claim Certificate</button>
    `;
    document.body.appendChild(badge);
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<span style="font-size:0.9rem;flex:1">${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}
