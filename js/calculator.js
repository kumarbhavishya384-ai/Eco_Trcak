/* ===================================================
   EcoTrack AI – Calculator JS (calculator.js)
   =================================================== */

// Tab state
let currentTab = 'transport';
let TABS = ['transport', 'electricity', 'food'];
let selectedDiet = 'omnivore';
let electricityAlreadySubmitted = false;

// Per-category running totals (kg CO₂)
const categoryTotals = { transport: 0, electricity: 0, food: 0 };
let monthlyElectricityValue = 0; // The value already logged this month

// ── Page Init ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Set today's date
    const calcDateEl = document.getElementById('calcDate');
    if (calcDateEl) {
        calcDateEl.textContent = new Date().toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    // Init calculations with default values
    calcTransport();

    // Check for monthly electricity submission
    checkElectricityStatus();

    // Set initial diet visibility and calc food
    const initialDietBtn = document.getElementById('diet-' + selectedDiet);
    selectDiet(selectedDiet, initialDietBtn);

    // Populate dish datalist
    const dishList = document.getElementById('dishOptions');
    if (dishList && EMISSION_FACTORS.dishes) {
        Object.keys(EMISSION_FACTORS.dishes).forEach(dish => {
            const opt = document.createElement('option');
            opt.value = dish;
            dishList.appendChild(opt);
        });
    }

    // Populate reference table
    const refBody = document.getElementById('refTableBody');
    if (refBody && EMISSION_FACTORS.dishes) {
        const allD = { ...EMISSION_FACTORS.dishes.vegan, ...EMISSION_FACTORS.dishes.vegetarian, ...EMISSION_FACTORS.dishes.egg, ...EMISSION_FACTORS.dishes.meat };
        Object.keys(allD).sort().forEach(d => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            tr.innerHTML = `<td style="padding:4px">${d}</td><td style="text-align:right; padding:4px">${allD[d]}</td>`;
            refBody.appendChild(tr);
        });
    }

    updateSummaryBar();
});

async function checkElectricityStatus() {
    try {
        console.log("LOG: Checking electricity status for the month...");
        const data = await apiFetch('/entries/check-monthly-electricity');
        console.log("LOG: Electricity status response:", data);

        if (data.alreadySubmitted) {
            electricityAlreadySubmitted = true;
            monthlyElectricityValue = data.electricityValue || 0;

            // Remove electricity from TABS and hide it
            TABS = TABS.filter(t => t !== 'electricity');

            // Hide the tab button in the UI using data attribute
            const elecBtn = document.querySelector('[data-tab="electricity"]');
            if (elecBtn) {
                elecBtn.classList.add('locked-tab');
                elecBtn.style.display = 'none';
            }

            // Also hide the panel content
            const elecPanel = document.getElementById('panel-electricity');
            if (elecPanel) {
                elecPanel.classList.add('locked-tab');
                elecPanel.style.display = 'none';
            }

            console.log("LOG: Electricity already logged. Tab locked and hidden.");

            // Update counts for progress label (Step 1 of 2 instead of 3)
            const label = document.getElementById('calcProgressLabel');
            if (label) label.textContent = `Step 1 of ${TABS.length}`;

            updateSummaryBar();
        } else {
            calcElectricity();
        }
    } catch (err) {
        console.warn("Failed to check electricity status", err);
    }
}

let userDishes = []; // Stores { name: string, quantity: number, co2: number }

// ── Tab Switching ─────────────────────────────────────
function switchTab(tab, btn) {
    document.querySelectorAll('.calc-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + tab).classList.add('active');
    document.querySelectorAll('.calc-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = tab;

    const idx = TABS.indexOf(tab);
    document.getElementById('calcProgressFill').style.width = ((idx + 1) / TABS.length * 100) + '%';
    document.getElementById('calcProgressLabel').textContent = `Step ${idx + 1} of ${TABS.length}`;

    const nextBtn = document.getElementById('nextTabBtn');
    if (idx === TABS.length - 1) {
        nextBtn.textContent = '✅ Save Entry';
        nextBtn.style.background = 'linear-gradient(135deg, #22c55e, #06b6d4)';
    } else {
        nextBtn.textContent = 'Next →';
        nextBtn.style.background = '';
    }
}

async function nextTabOrSubmit() {
    const idx = TABS.indexOf(currentTab);
    if (idx < TABS.length - 1) {
        const nextTab = TABS[idx + 1];
        const nextTabBtn = document.querySelector(`[data-tab="${nextTab}"]`);
        switchTab(nextTab, nextTabBtn);
    } else {
        await saveEntry();
    }
}

function prevTab() {
    const idx = TABS.indexOf(currentTab);
    if (idx > 0) {
        const prevTabName = TABS[idx - 1];
        const prevTabBtn = document.querySelector(`[data-tab="${prevTabName}"]`);
        switchTab(prevTabName, prevTabBtn);
    }
}

// ── Category Calculators ──────────────────────────────
function calcTransport() {
    const fuelType = document.getElementById('fuelType')?.value || 'petrol';
    const carKm = +document.getElementById('carKm')?.value || 0;
    const mileage = +document.getElementById('carMileage')?.value || 15;
    const autoKm = +document.getElementById('autoKm')?.value || 0;
    const busKm = +document.getElementById('busKm')?.value || 0;
    const metroKm = +document.getElementById('metroKm')?.value || 0;
    const flightHrs = +document.getElementById('flightHrs')?.value || 0;
    const flightClass = document.getElementById('flightClass')?.value || 'economy';

    const EF = EMISSION_FACTORS.transport;
    let vehicleCO2 = fuelType === 'electric' ? (carKm / mileage) * EF.electric : (carKm / mileage) * (EF[fuelType] || EF.petrol);
    const flightKm = flightHrs * 800; // avg 800km/h
    const flightFactors = { economy: EF.flightEconomy, business: EF.flightBusiness, first: EF.flightFirst };
    const flightC = flightKm * (flightFactors[flightClass] || EF.flightEconomy);

    const total = vehicleCO2 + (autoKm * EF.auto) + (busKm * EF.bus) + (metroKm * EF.metro) + flightC;
    categoryTotals.transport = +total.toFixed(3);
    if (document.getElementById('transportCO2')) document.getElementById('transportCO2').textContent = total.toFixed(2);
    updateSummaryBar();
}

function calcElectricity() {
    if (electricityAlreadySubmitted) return;

    const EF = EMISSION_FACTORS.electricity;
    const bill = +document.getElementById('electricBill')?.value || 0;
    const rate = +document.getElementById('electricRate')?.value || 6;
    const directKwh = +document.getElementById('electricKwh')?.value || 0;
    const familyMembers = Math.max(1, +document.getElementById('familyMembers')?.value || 1);

    // MONTHLY Calculation
    let baseKwh = Math.max((bill / rate), directKwh);

    // Appliances monthly estimate (Hours * 30 days)
    const appKwh = ((+document.getElementById('acHours')?.value || 0) * EF.ac +
        (+document.getElementById('pcHours')?.value || 0) * EF.pc +
        (+document.getElementById('tvHours')?.value || 0) * EF.tv +
        (+document.getElementById('washHours')?.value || 0) * EF.washer) * 30;

    // Total MONTHLY kWh for entire household
    const totalMonthlyKwh = baseKwh + appKwh;

    // Gas usage (per month) for entire household
    const lpgImpact = (+document.getElementById('lpgCylinders')?.value || 0) * EF.lpgCylinder;
    const pngImpact = (+document.getElementById('pngCubic')?.value || 0) * EF.pngCubicM;

    // Total household emissions
    const householdTotal = (totalMonthlyKwh * EF.gridFactor) + lpgImpact + pngImpact;

    // Per-person share
    const perPersonTotal = householdTotal / familyMembers;
    const perPersonKwh = totalMonthlyKwh / familyMembers;

    categoryTotals.electricity = +perPersonTotal.toFixed(3);

    if (document.getElementById('electricityCO2'))
        document.getElementById('electricityCO2').textContent = perPersonTotal.toFixed(2);

    if (document.getElementById('electricityEquiv')) {
        if (familyMembers > 1) {
            document.getElementById('electricityEquiv').textContent =
                `= ~${perPersonKwh.toFixed(1)} kWh/person  (${totalMonthlyKwh.toFixed(1)} kWh ÷ ${familyMembers} members)`;
        } else {
            document.getElementById('electricityEquiv').textContent =
                `= ~${totalMonthlyKwh.toFixed(1)} kWh consumed this month`;
        }
    }
    updateSummaryBar();
}

function selectDiet(diet, el) {
    selectedDiet = diet;
    document.querySelectorAll('.diet-option').forEach(d => d.classList.remove('selected'));
    if (el) el.classList.add('selected');

    // Clear current dish list if it's potentially invalid for the new diet
    // Or just filter the options for NEW entries
    updateDishAutosuggest();
    calcFood();
}

function updateDishAutosuggest() {
    const list = document.getElementById('dishOptions');
    if (!list) return;
    list.innerHTML = '';

    const DISH_CAT = EMISSION_FACTORS.dishes;
    let allowedDishes = {};

    if (selectedDiet === 'vegan') {
        allowedDishes = { ...DISH_CAT.vegan };
    } else if (selectedDiet === 'pure-veg') {
        allowedDishes = { ...DISH_CAT.vegan, ...DISH_CAT.vegetarian };
    } else if (selectedDiet === 'egg-veg') {
        allowedDishes = { ...DISH_CAT.vegan, ...DISH_CAT.vegetarian, ...DISH_CAT.egg };
    } else {
        // Omnivore / Heavy Meat
        allowedDishes = { ...DISH_CAT.vegan, ...DISH_CAT.vegetarian, ...DISH_CAT.egg, ...DISH_CAT.meat };
    }

    Object.keys(allowedDishes).sort().forEach(dish => {
        const opt = document.createElement('option');
        opt.value = dish;
        list.appendChild(opt);
    });
}

function generateDishFields() {
    const num = +document.getElementById('numDishesInput')?.value || 0;
    const container = document.getElementById('dynamicDishFields');
    if (!container) return;

    if (num <= 0 || num > 10) {
        showGlobalToast("Please enter a number between 1 and 10");
        return;
    }

    let html = '';
    for (let i = 0; i < num; i++) {
        html += `
        <div class="dish-row" style="display:flex; gap:10px; margin-bottom:10px; align-items:flex-end">
            <div class="input-group" style="flex:2">
                <label>Dish ${i + 1} Name</label>
                <input type="text" class="dish-name-field" id="dishName_${i}" list="dishOptions" placeholder="Select dish..." oninput="calcFood()" />
            </div>
            <div class="input-group" style="flex:1">
                <label>Bowls</label>
                <input type="number" class="dish-qty-field" id="dishQty_${i}" placeholder="1" min="0" step="0.5" oninput="calcFood()" />
            </div>
        </div>`;
    }
    container.innerHTML = html;
    updateDishAutosuggest();
    calcFood();
}

function calcFood() {
    const EF_DISHES_CAT = EMISSION_FACTORS.dishes;
    const allKnownDishes = { ...EF_DISHES_CAT.vegan, ...EF_DISHES_CAT.vegetarian, ...EF_DISHES_CAT.egg, ...EF_DISHES_CAT.meat };

    let dishCO2 = 0;
    const names = document.querySelectorAll('.dish-name-field');
    const qtys = document.querySelectorAll('.dish-qty-field');

    names.forEach((nameInput, i) => {
        const dishName = nameInput.value.trim();
        const qty = +qtys[i].value || 0;
        if (dishName && qty > 0) {
            const factor = allKnownDishes[dishName] || 0.25;
            dishCO2 += factor * qty;
        }
    });

    const EF = EMISSION_FACTORS.food;
    const otherItems =
        (+document.getElementById('riceServings')?.value || 0) * EF.rice +
        (+document.getElementById('grainServings')?.value || 0) * EF.grains +
        (+document.getElementById('veggieServings')?.value || 0) * EF.veggies +
        (+document.getElementById('importServings')?.value || 0) * EF.imports +
        (+document.getElementById('foodWaste')?.value || 0) * EF.waste;

    const total = dishCO2 + otherItems;

    categoryTotals.food = +total.toFixed(3);
    if (document.getElementById('foodCO2')) document.getElementById('foodCO2').textContent = total.toFixed(2);
    updateSummaryBar();
}


function updateSummaryBar() {
    const { transport, electricity, food } = categoryTotals;

    // For display, use the monthly value if we're locked
    const displayElectric = electricityAlreadySubmitted ? monthlyElectricityValue : electricity;
    const total = transport + displayElectric + food;

    const elements = {
        'sum-transport': transport,
        'sum-electricity': displayElectric,
        'sum-food': food
    };

    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id].toFixed(2);
    });

    const totalEl = document.getElementById('sum-total');
    if (totalEl) {
        totalEl.textContent = total.toFixed(2);
        totalEl.style.color = total > 10 ? '#ef4444' : total > 5 ? '#f97316' : '#22c55e';
    }
}

// ── API Integration ──────────────────────────────────
async function saveEntry() {
    const { transport, electricity, food } = categoryTotals;
    const btn = document.getElementById('nextTabBtn');

    try {
        btn.disabled = true;
        btn.textContent = 'Saving...';

        const payload = {
            date: getTodayDateStr(),
            transport,
            electricity: electricityAlreadySubmitted ? 0 : electricity, // Don't resend monthly data
            food
        };

        const res = await saveUserEntry(payload);

        // Show success toast
        const toast = document.getElementById('successToast');
        if (toast) {
            toast.innerHTML = `
                <span>✅</span>
                <div>
                    <strong>Data Logged to MongoDB!</strong>
                    <p>New EcoScore: <strong style="color:#22c55e">${res.ecoScore}/800</strong></p>
                </div>
                <button onclick="document.getElementById('successToast').style.display='none'">✕</button>
            `;
            toast.style.display = 'flex';
        }

        setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
    } catch (err) {
        showGlobalToast("Failed to save entry: " + err.message);
        btn.disabled = false;
        btn.textContent = '✅ Save Entry';
    }
}
// ── AI Food Scanner ────────────────────────────────────
async function handleMealScan(event) {
    const file = event.target.files[0];
    if (!file) return;

    const statusEl = document.getElementById('scanStatus');
    const scanBtn = document.getElementById('scanBtn');

    statusEl.style.display = 'block';
    statusEl.innerHTML = '<span class="loading-spinner"></span> Analyzing your plate...';
    scanBtn.disabled = true;

    try {
        // Convert image to Base64
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Image = e.target.result.split(',')[1];

            const data = await apiFetch('/ai/vision', {
                method: 'POST',
                body: JSON.stringify({ image: base64Image })
            });

            if (data.success) {
                statusEl.innerHTML = `✅ Found: <strong>${data.items.join(', ')}</strong><br/>Est. Impact: <strong>${data.totalKg}kg CO₂e</strong>`;

                // Auto-fill the food calculator if possible
                // For simplicity, we'll just add the detected CO2 to the current food total
                categoryTotals.food += data.totalKg;
                updateSummaryBar();
                showGlobalToast("AI identified your food and updated your impact! 🥗");
            } else {
                throw new Error(data.message);
            }
        };
        reader.readAsDataURL(file);
    } catch (err) {
        statusEl.innerHTML = `<span style="color:var(--danger)">⚠️ AI analysis failed: ${err.message}</span>`;
    } finally {
        scanBtn.disabled = false;
        event.target.value = ''; // Reset input
    }
}
