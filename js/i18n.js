/* ============================================================
   EcoTrack AI — Master i18n Language System
   Covers: dashboard, calculator, history, leaderboard,
           offset, recommendations, report, gov_approval
   ============================================================ */

const translations = {
  en: {
    /* ── Sidebar Nav ── */
    nav_dashboard: "Dashboard", nav_report: "Report Dashboard",
    nav_calculator: "Calculator", nav_history: "History",
    nav_insights: "AI Insights", nav_leaderboard: "Leaderboard",
    nav_offset: "Offset Tools", nav_logout: "⬡ Logout",

    /* ── Common / Topbar ── */
    logout_btn: "Logout", realtime: "REAL-TIME", log_data: "Log Data",
    log_today: "+ Log Today's Data", export_csv: "⬇ Export CSV",

    /* ── Dashboard ── */
    db_title: "Dashboard", your_ecoscore: "Your EcoScore",
    points: "POINTS", daily_streak: "DAILY STREAK",
    impact_breakdown: "Impact Breakdown", this_month: "This Month",
    transport_label: "TRANSPORTATION", electricity_label: "ELECTRICITY",
    diet_label: "DIET & MEALS", emission_analytics: "📈 Emission Analytics",
    recent_activity: "Recent Activity", ai_tips: "AI Tips",
    top_warriors: "Top Eco-Warriors", view_all: "View All",

    /* ── Calculator ── */
    calc_title: "Carbon Calculator", step1of3: "Step 1 of 3",
    step2of3: "Step 2 of 3", step3of3: "Step 3 of 3",
    transport_emissions: "🚗 Transport Emissions (Daily)",
    transport_subtitle: "Track your daily travel. Carbon = Distance × Emission Factor",
    personal_vehicle: "PERSONAL VEHICLE", fuel_type: "Fuel Type",
    petrol: "Petrol (2.3 kg CO₂/L)", diesel: "Diesel (2.68 kg CO₂/L)",
    cng: "CNG (1.77 kg CO₂/kg)", electric: "Electric (0.82 kg CO₂/kWh)",
    distance_driven: "Distance Driven (km)", mileage: "Mileage (km/L or km/kWh)",
    public_transport: "PUBLIC TRANSPORT", auto_taxi: "Auto/Taxi (km)",
    bus_km: "Bus (km)", metro_train: "Metro/Train (km)",
    air_travel: "AIR TRAVEL", flight_hours: "Flight Hours", flight_class: "Flight Class",
    economy: "Economy", business: "Business", first_class: "First Class",
    electricity_energy: "⚡ Electricity & Energy (Monthly)",
    home_electricity: "HOME ELECTRICITY", monthly_bill: "Monthly Bill (₹)",
    rate_kwh: "Rate (₹/kWh)", direct_kwh: "OR Direct kWh Usage",
    lpg_png: "LPG / PNG GAS", lpg_cylinders: "LPG Cylinders/Month",
    png_usage: "PNG Usage (m³/month)", household_members: "🏠 HOUSEHOLD MEMBERS",
    family_members: "Number of Family Members",
    appliances: "APPLIANCES USAGE (DAILY AVG)",
    ac: "🌡️ AC", pc: "🖥️ PC/Laptop", tv: "📺 TV", washing: "🧺 Washing Machine",
    food_diet: "🍽️ Food & Diet (Daily)",
    food_subtitle: "Track your food impact today. Choose diet and enter dishes.",
    diet_type: "Diet Type", vegan: "Vegan", pure_veg: "Pure Veg",
    veg_egg: "Veg with Egg", omnivore: "Omnivore", heavy_meat: "Heavy Meat",
    ai_food_scanner: "AI Food Scanner", what_eat: "🍽️ What did you eat today?",
    how_many_dishes: "How many different dishes?", generate_fields: "Generate Fields",
    dish: "Dish", footprint: "Footprint", other_impacts: "Other Impacts",
    rice: "🍚 Generic Rice (bowls)", grains: "🍞 Grains/Bread (servings)",
    veggies: "🥕 Veggies/Fruits (cups)", imported_fruits: "🍎 Imported Fruits (items)",
    food_waste: "🗑️ Food Waste (kg)", total: "TOTAL",
    prev_btn: "← Previous", next_btn: "Next →", save_btn: "✅ Save Entry",
    saved_title: "Saved Successfully!",
    saved_msg: "Your carbon data has been logged and EcoScore updated.",

    /* ── History ── */
    hist_title: "📅 Emission History", total_entries: "Total Entries",
    total_co2: "Total kg CO₂", best_day: "Best Day", logging_streak: "Logging Streak",
    emission_timeline: "Emission Timeline", last7: "Last 7 Days",
    last30: "Last 30 Days", last90: "Last 90 Days",
    all_entries: "All Entries", all_categories: "All Categories",
    transport_cat: "Transport", electricity_cat: "Electricity", food_cat: "Food",
    date_col: "Date", transport_col: "🚗 Transport",
    electricity_col: "⚡ Electricity", food_col: "🍽️ Food",
    total_co2_col: "Total CO₂", ecoscore_col: "EcoScore", action_col: "Action",

    /* ── Leaderboard ── */
    lb_title: "🏆 Campus Leaderboard", this_week: "This Week",
    all_time: "All Time", your_position: "Your current leaderboard position",
    full_rankings: "Full Rankings", individual: "Individual",
    campus_groups: "Campus Groups", ngo_csr: "NGO/CSR",
    loading_rankings: "Loading rankings...", loading_groups: "Loading group rankings...",
    my_badges: "🎖️ My Eco Badges", share_impact: "🤳 Share My Impact",

    /* ── Offset Tools ── */
    offset_title: "🌲 Carbon Offset Tools",
    carbon_journey: "Your Carbon Neutrality Journey",
    tree_calc: "Tree Plantation Calculator", co2_to_offset: "CO₂ to offset (kg)",
    tree_type: "Tree Type", trees_needed: "Trees Needed",
    avg_tree: "Average Tree (21 kg CO₂/yr)", bamboo: "Bamboo (50 kg CO₂/yr)",
    oak: "Oak (48 kg CO₂/yr)", fruit_tree: "Fruit Tree (15 kg CO₂/yr)",
    pine: "Pine (30 kg CO₂/yr)", solar_title: "Solar Savings Predictor",
    monthly_bill_label: "Monthly Electricity Bill (₹)",
    roof_area: "Roof Area Available (sq ft)", your_state: "Your State",
    kwh_year: "kWh/year", co2_saved: "kg CO₂ saved/yr", money_saved: "₹ saved/year",
    credit_calc: "Carbon Credit Calculator", offset_program: "Offset Program Type",
    reforestation: "Reforestation (₹6/kg CO₂)", renewable: "Renewable Energy (₹12/kg CO₂)",
    direct_air: "Direct Air Capture (₹20/kg CO₂)", biochar: "Biochar (₹8/kg CO₂)",
    cost_label: "Estimated Cost to Offset", ngo_partners: "🤝 NGO & CSR Partners",

    /* ── Recommendations ── */
    rec_title: "🤖 AI Insights & Predictions",
    ecocoach_title: "EcoCoach AI Analysis",
    ecocoach_sub: "GPT-Powered Personalized Guidance",
    analyzing: "EcoCoach is analyzing your footprint...",
    ai_carbon_analysis: "Your AI Carbon Analysis",
    ml_model_note: "Based on your activity patterns, our ML model predicts your future emissions",
    accuracy: "97% Accuracy", curr_month: "Current Month (est.)",
    ai_prediction: "🤖 AI Prediction (Next Month)", potential_savings: "Potential Savings",
    follow_tips: "kg CO₂ if you follow tips", smart_recs: "💡 Smart Recommendations",
    high_impact: "🔥 High Impact", behavioral: "📈 Behavioral Pattern Analysis",
    eco_challenges: "🎯 Eco Challenges",

    /* ── Report ── */
    report_title: "Report Dashboard", analyzing_data: "Analyzing Data...",
    please_wait: "Please wait while we compare your footprint with national standards.",
    live_comparison: "Live Comparison: Your Data vs India (Daily/Monthly)",
    custom_comparison: "Custom Comparison (Daily/Monthly)",
    detailed_comparison: "Detailed Comparison", gov_standards: "Government Standards",
    nat_target: "National Target 2030", nat_target_desc: "Reducing emission intensity by 45%",
    net_zero: "Net Zero Target", net_zero_desc: "India aims for Net Zero by 2070",
    daily_benchmark: "Daily Benchmark", daily_benchmark_desc: "Approx. 5.2 kg CO₂e per person",
    view_verified: "🏛️ View Verified Data & Referrals",
  },

  hi: {
    /* ── Sidebar Nav ── */
    nav_dashboard: "डैशबोर्ड", nav_report: "रिपोर्ट डैशबोर्ड",
    nav_calculator: "कैलकुलेटर", nav_history: "इतिहास",
    nav_insights: "AI अंतर्दृष्टि", nav_leaderboard: "लीडरबोर्ड",
    nav_offset: "ऑफसेट टूल्स", nav_logout: "⬡ लॉगआउट",

    /* ── Common / Topbar ── */
    logout_btn: "लॉगआउट", realtime: "रियल-टाइम", log_data: "डेटा लॉग करें",
    log_today: "+ आज का डेटा लॉग करें", export_csv: "⬇ CSV निर्यात करें",

    /* ── Dashboard ── */
    db_title: "डैशबोर्ड", your_ecoscore: "आपका ईकोस्कोर",
    points: "अंक", daily_streak: "दैनिक स्ट्रीक",
    impact_breakdown: "प्रभाव विश्लेषण", this_month: "इस महीने",
    transport_label: "परिवहन", electricity_label: "बिजली",
    diet_label: "आहार और भोजन", emission_analytics: "📈 उत्सर्जन विश्लेषण",
    recent_activity: "हालिया गतिविधि", ai_tips: "AI सुझाव",
    top_warriors: "शीर्ष ईको-योद्धा", view_all: "सभी देखें",

    /* ── Calculator ── */
    calc_title: "कार्बन कैलकुलेटर", step1of3: "चरण 1 / 3",
    step2of3: "चरण 2 / 3", step3of3: "चरण 3 / 3",
    transport_emissions: "🚗 परिवहन उत्सर्जन (दैनिक)",
    transport_subtitle: "अपनी दैनिक यात्रा ट्रैक करें। कार्बन = दूरी × उत्सर्जन कारक",
    personal_vehicle: "व्यक्तिगत वाहन", fuel_type: "ईंधन प्रकार",
    petrol: "पेट्रोल (2.3 kg CO₂/L)", diesel: "डीज़ल (2.68 kg CO₂/L)",
    cng: "CNG (1.77 kg CO₂/kg)", electric: "इलेक्ट्रिक (0.82 kg CO₂/kWh)",
    distance_driven: "तय की गई दूरी (km)", mileage: "माइलेज (km/L या km/kWh)",
    public_transport: "सार्वजनिक परिवहन", auto_taxi: "ऑटो/टैक्सी (km)",
    bus_km: "बस (km)", metro_train: "मेट्रो/ट्रेन (km)",
    air_travel: "हवाई यात्रा", flight_hours: "उड़ान के घंटे", flight_class: "उड़ान श्रेणी",
    economy: "इकोनॉमी", business: "बिज़नेस", first_class: "फर्स्ट क्लास",
    electricity_energy: "⚡ बिजली और ऊर्जा (मासिक)",
    home_electricity: "घरेलू बिजली", monthly_bill: "मासिक बिल (₹)",
    rate_kwh: "दर (₹/kWh)", direct_kwh: "या सीधा kWh उपयोग",
    lpg_png: "LPG / PNG गैस", lpg_cylinders: "LPG सिलेंडर/माह",
    png_usage: "PNG उपयोग (m³/माह)", household_members: "🏠 परिवार के सदस्य",
    family_members: "परिवार के सदस्यों की संख्या",
    appliances: "उपकरण उपयोग (दैनिक औसत)",
    ac: "🌡️ एसी", pc: "🖥️ PC/लैपटॉप", tv: "📺 TV", washing: "🧺 वॉशिंग मशीन",
    food_diet: "🍽️ खाना और आहार (दैनिक)",
    food_subtitle: "आज के भोजन का प्रभाव ट्रैक करें। आहार चुनें और व्यंजन दर्ज करें।",
    diet_type: "आहार प्रकार", vegan: "वीगन", pure_veg: "शुद्ध शाकाहारी",
    veg_egg: "शाकाहारी + अंडा", omnivore: "सर्वाहारी", heavy_meat: "अधिक मांसाहारी",
    ai_food_scanner: "AI फूड स्कैनर", what_eat: "🍽️ आज आपने क्या खाया?",
    how_many_dishes: "कितने अलग व्यंजन?", generate_fields: "फ़ील्ड बनाएं",
    dish: "व्यंजन", footprint: "फुटप्रिंट", other_impacts: "अन्य प्रभाव",
    rice: "🍚 चावल (कटोरी)", grains: "🍞 अनाज/रोटी (सर्विंग)",
    veggies: "🥕 सब्जियाँ/फल (कप)", imported_fruits: "🍎 आयातित फल (संख्या)",
    food_waste: "🗑️ खाद्य अपशिष्ट (kg)", total: "कुल",
    prev_btn: "← पिछला", next_btn: "अगला →", save_btn: "✅ एंट्री सहेजें",
    saved_title: "सफलतापूर्वक सहेजा गया!",
    saved_msg: "आपका कार्बन डेटा लॉग हो गया और EcoScore अपडेट हो गया।",

    /* ── History ── */
    hist_title: "📅 उत्सर्जन इतिहास", total_entries: "कुल प्रविष्टियाँ",
    total_co2: "कुल kg CO₂", best_day: "सर्वश्रेष्ठ दिन", logging_streak: "लॉगिंग स्ट्रीक",
    emission_timeline: "उत्सर्जन टाइमलाइन", last7: "पिछले 7 दिन",
    last30: "पिछले 30 दिन", last90: "पिछले 90 दिन",
    all_entries: "सभी प्रविष्टियाँ", all_categories: "सभी श्रेणियाँ",
    transport_cat: "परिवहन", electricity_cat: "बिजली", food_cat: "भोजन",
    date_col: "तारीख", transport_col: "🚗 परिवहन",
    electricity_col: "⚡ बिजली", food_col: "🍽️ भोजन",
    total_co2_col: "कुल CO₂", ecoscore_col: "ईकोस्कोर", action_col: "कार्रवाई",

    /* ── Leaderboard ── */
    lb_title: "🏆 कैंपस लीडरबोर्ड", this_week: "इस सप्ताह",
    all_time: "सर्वकालीन", your_position: "आपकी वर्तमान लीडरबोर्ड स्थिति",
    full_rankings: "पूर्ण रैंकिंग", individual: "व्यक्तिगत",
    campus_groups: "कैंपस समूह", ngo_csr: "NGO/CSR",
    loading_rankings: "रैंकिंग लोड हो रही है...", loading_groups: "समूह रैंकिंग लोड हो रही है...",
    my_badges: "🎖️ मेरे ईको बैज", share_impact: "🤳 अपना प्रभाव शेयर करें",

    /* ── Offset Tools ── */
    offset_title: "🌲 कार्बन ऑफसेट टूल्स",
    carbon_journey: "आपकी कार्बन न्यूट्रैलिटी यात्रा",
    tree_calc: "वृक्षारोपण कैलकुलेटर", co2_to_offset: "ऑफसेट करने के लिए CO₂ (kg)",
    tree_type: "वृक्ष प्रकार", trees_needed: "आवश्यक पेड़",
    avg_tree: "औसत पेड़ (21 kg CO₂/वर्ष)", bamboo: "बांस (50 kg CO₂/वर्ष)",
    oak: "ओक (48 kg CO₂/वर्ष)", fruit_tree: "फलदार पेड़ (15 kg CO₂/वर्ष)",
    pine: "पाइन (30 kg CO₂/वर्ष)", solar_title: "सौर बचत अनुमानक",
    monthly_bill_label: "मासिक बिजली बिल (₹)",
    roof_area: "उपलब्ध छत क्षेत्र (वर्ग फुट)", your_state: "आपका राज्य",
    kwh_year: "kWh/वर्ष", co2_saved: "kg CO₂ बचत/वर्ष", money_saved: "₹ बचत/वर्ष",
    credit_calc: "कार्बन क्रेडिट कैलकुलेटर", offset_program: "ऑफसेट प्रोग्राम प्रकार",
    reforestation: "पुनर्वनीकरण (₹6/kg CO₂)", renewable: "नवीकरणीय ऊर्जा (₹12/kg CO₂)",
    direct_air: "प्रत्यक्ष वायु कैप्चर (₹20/kg CO₂)", biochar: "बायोचार (₹8/kg CO₂)",
    cost_label: "ऑफसेट की अनुमानित लागत", ngo_partners: "🤝 NGO और CSR भागीदार",

    /* ── Recommendations ── */
    rec_title: "🤖 AI अंतर्दृष्टि और पूर्वानुमान",
    ecocoach_title: "EcoCoach AI विश्लेषण",
    ecocoach_sub: "GPT-संचालित व्यक्तिगत मार्गदर्शन",
    analyzing: "EcoCoach आपका फुटप्रिंट विश्लेषण कर रहा है...",
    ai_carbon_analysis: "आपका AI कार्बन विश्लेषण",
    ml_model_note: "आपकी गतिविधि के आधार पर, हमारा ML मॉडल भविष्य के उत्सर्जन की भविष्यवाणी करता है",
    accuracy: "97% सटीकता", curr_month: "वर्तमान माह (अनुमानित)",
    ai_prediction: "🤖 AI भविष्यवाणी (अगला माह)", potential_savings: "संभावित बचत",
    follow_tips: "kg CO₂ यदि आप सुझाव मानें", smart_recs: "💡 स्मार्ट सिफारिशें",
    high_impact: "🔥 उच्च प्रभाव", behavioral: "📈 व्यवहार पैटर्न विश्लेषण",
    eco_challenges: "🎯 ईको चुनौतियाँ",

    /* ── Report ── */
    report_title: "रिपोर्ट डैशबोर्ड", analyzing_data: "डेटा विश्लेषण हो रहा है...",
    please_wait: "कृपया प्रतीक्षा करें जब तक हम आपके फुटप्रिंट की तुलना राष्ट्रीय मानकों से करते हैं।",
    live_comparison: "लाइव तुलना: आपका डेटा बनाम भारत (दैनिक/मासिक)",
    custom_comparison: "कस्टम तुलना (दैनिक/मासिक)",
    detailed_comparison: "विस्तृत तुलना", gov_standards: "सरकारी मानक",
    nat_target: "राष्ट्रीय लक्ष्य 2030", nat_target_desc: "उत्सर्जन तीव्रता में 45% कमी",
    net_zero: "नेट ज़ीरो लक्ष्य", net_zero_desc: "भारत का 2070 तक नेट ज़ीरो का लक्ष्य",
    daily_benchmark: "दैनिक बेंचमार्क", daily_benchmark_desc: "प्रति व्यक्ति लगभग 5.2 kg CO₂e",
    view_verified: "🏛️ सत्यापित डेटा और रेफरल देखें",
  }
};

let currentLang = localStorage.getItem('ecotrack_lang') || 'en';

function t(key) {
  return translations[currentLang]?.[key] || translations['en']?.[key] || key;
}

function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('ecotrack_lang', lang);
  applyTranslations();
}

function applyTranslations() {
  const L = currentLang;

  // 1. All data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = translations[L]?.[el.getAttribute('data-i18n')];
    if (val !== undefined) el.textContent = val;
  });

  // 2. All data-i18n-placeholder elements
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const val = translations[L]?.[el.getAttribute('data-i18n-placeholder')];
    if (val !== undefined) el.placeholder = val;
  });

  // 3. Log Data / Log Today buttons
  document.querySelectorAll('.btn-add-data').forEach(btn => {
    btn.innerHTML = `<span>+</span> ${t('log_data')}`;
  });

  // 4. Topbar Logout
  document.querySelectorAll('.btn-ghost[onclick="logout()"]').forEach(btn => {
    btn.textContent = t('logout_btn');
  });

  // 5. Sidebar logout button
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.textContent = t('nav_logout');
  });

  // 6. REAL-TIME badge
  document.querySelectorAll('.status-badge').forEach(el => {
    el.textContent = `• ${t('realtime')}`;
  });

  // 7. Date locale
  const dateEl = document.getElementById('currentDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString(
      L === 'hi' ? 'hi-IN' : 'en-US',
      { weekday: 'short', month: 'short', day: 'numeric' }
    );
  }

  // 8. Update active lang button highlight
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const active = btn.dataset.lang === L;
    btn.style.background = active ? 'var(--primary)' : 'rgba(255,255,255,0.05)';
    btn.style.color = active ? '#000' : '#fff';
    btn.style.fontWeight = active ? '700' : '400';
    btn.style.border = active ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)';
  });
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', applyTranslations);
