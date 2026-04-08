/* ============================================================
   EcoTrack AI — Master i18n Language System
   Covers: landing page, dashboard, calculator, history, leaderboard, offset, recommendations, report
   ============================================================ */

const translations = {
  en: {
    // Top & Nav
    nav_dashboard: "Dashboard", nav_report: "Report Dashboard", nav_calculator: "Calculator", nav_history: "History", nav_insights: "AI Insights", nav_leaderboard: "Leaderboard", nav_offset: "Offset Tools", nav_logout: "⬡ Logout",
    logout_btn: "Logout", realtime: "REAL-TIME", log_data: "Log Data", log_today: "+ Log Today's Data", export_csv: "⬇ Export CSV",
    
    // Landing Page
    l_feat: "Features", l_how: "How It Works", l_eco: "EcoScore", l_signin: "Sign In", l_getstart: "Get Started Free",
    l_hbadge: "AI-Powered Carbon Intelligence",
    l_htitle: "Track Your <span class='gradient-text'>Carbon Impact</span><br />Save The <span class='gradient-text-green'>Planet</span>",
    l_hsub: "Advanced AI platform that calculates, predicts, and helps reduce your carbon emissions.<br />Get your personalized <strong>EcoScore</strong> and smart recommendations instantly.",
    l_start: "<span>🚀</span> Start Your EcoJourney", l_demo: "<span>▶</span> Watch Demo",
    l_stat1: "Active EcoWarriors", l_stat2: "kg CO₂ Tracked", l_stat3: "Trees Equivalent Saved",
    l_live: "LIVE", l_card1: "YOUR ECOSCORE", l_card2: "Excellent! You're an eco-champion.",
    l_cmod: "Core Modules", l_cmodt: "Everything You Need to Go <span class='gradient-text-green'>Green</span>",
    l_f1t: "Smart Calculator", l_f1d: "Measure emissions from transport, electricity, food & shopping",
    l_f2t: "AI Predictions", l_f2d: "Machine learning models predict your future carbon footprint",
    l_f3t: "EcoScore System", l_f3d: "Real-time 0-800 EcoScore rating system with personalized tips",
    l_f4t: "Analytics Dashboard", l_f4d: "Beautiful charts, trend analysis, and comparisons",
    l_f5t: "Offset Calculator", l_f5d: "See exactly how many trees needed to offset your emissions",
    l_f6t: "Campus Leaderboard", l_f6d: "Compete with friends and colleagues for sustainability",
    l_sbag: "How It Works", l_stitle: "Simple, Smart, <span class='gradient-text'>Sustainable</span>",
    l_s1t: "Create Profile", l_s1d: "Sign up and set your baseline — location, household size, lifestyle type",
    l_s2t: "Log Activities", l_s2d: "Daily inputs for transport, energy use, food choices, and purchases",
    l_s3t: "Get EcoScore", l_s3d: "AI analyzes your data and gives you an instant, actionable EcoScore",
    l_s4t: "Reduce & Track", l_s4d: "Follow smart recommendations and watch your score improve over time",
    l_ebdge: "EcoScore System", l_etitle: "Where Do <span class='gradient-text-green'>You</span> Stand?",
    l_e1t: "High Pollution", l_e1d: "Urgent action needed — your footprint is critically high",
    l_e2t: "Moderate", l_e2d: "Room for significant improvement with targeted changes",
    l_e3t: "Good", l_e3d: "You're on the right track — keep pushing forward!",
    l_e4t: "Eco Friendly", l_e4d: "Excellent! You're a true environmental champion",
    l_cta1: "Ready to Make a <span class='gradient-text'>Difference?</span>",
    l_cta2: "Join thousands of eco-warriors tracking and reducing their footprints every day",
    l_ctab: "🌍 Join EcoTrack AI Now — It's Free",
    l_ft: "Built with ❤️ for a greener tomorrow | Carbon Formula: Emission = Activity × Emission Factor",

    // Application Pages
    db_title: "Dashboard", your_ecoscore: "Your EcoScore", points: "POINTS", daily_streak: "DAILY STREAK",
    impact_breakdown: "Impact Breakdown", this_month: "This Month", transport_label: "TRANSPORTATION",
    electricity_label: "ELECTRICITY", diet_label: "DIET & MEALS", emission_analytics: "📈 Emission Analytics",
    recent_activity: "Recent Activity", ai_tips: "AI Tips", top_warriors: "Top Eco-Warriors", view_all: "View All",
    calc_title: "Carbon Calculator", step1of3: "Step 1 of 3", step2of3: "Step 2 of 3", step3of3: "Step 3 of 3",
    transport_emissions: "🚗 Transport Emissions (Daily)",
    transport_subtitle: "Track your daily travel. Carbon = Distance × Emission Factor",
    personal_vehicle: "PERSONAL VEHICLE", fuel_type: "Fuel Type", petrol: "Petrol (2.3 kg CO₂/L)",
    diesel: "Diesel (2.68 kg CO₂/L)", cng: "CNG (1.77 kg CO₂/kg)", electric: "Electric (0.82 kg CO₂/kWh)",
    distance_driven: "Distance Driven (km)", mileage: "Mileage (km/L or km/kWh)",
    public_transport: "PUBLIC TRANSPORT", auto_taxi: "Auto/Taxi (km)", bus_km: "Bus (km)", metro_train: "Metro/Train (km)",
    air_travel: "AIR TRAVEL", flight_hours: "Flight Hours", flight_class: "Flight Class",
    economy: "Economy", business: "Business", first_class: "First Class",
    electricity_energy: "⚡ Electricity & Energy (Monthly)", home_electricity: "HOME ELECTRICITY",
    monthly_bill: "Monthly Bill", rate_kwh: "Rate/kWh", direct_kwh: "OR Direct kWh Usage",
    lpg_png: "LPG / PNG GAS", lpg_cylinders: "LPG Cylinders/Month", png_usage: "PNG Usage (m³/month)",
    household_members: "🏠 HOUSEHOLD MEMBERS", family_members: "Number of Family Members",
    appliances: "APPLIANCES USAGE (DAILY AVG)", ac: "🌡️ AC", pc: "🖥️ PC/Laptop", tv: "📺 TV", washing: "🧺 Washing Machine",
    food_diet: "🍽️ Food & Diet (Daily)", food_subtitle: "Track your food impact today.",
    diet_type: "Diet Type", vegan: "Vegan", pure_veg: "Pure Veg", veg_egg: "Veg with Egg", omnivore: "Omnivore", heavy_meat: "Heavy Meat",
    ai_food_scanner: "AI Food Scanner", what_eat: "🍽️ What did you eat today?", how_many_dishes: "How many different dishes?",
    generate_fields: "Generate Fields", dish: "Dish", footprint: "Footprint", other_impacts: "Other Impacts",
    rice: "🍚 Generic Rice (bowls)", grains: "🍞 Grains/Bread (servings)", veggies: "🥕 Veggies/Fruits (cups)",
    imported_fruits: "🍎 Imported Fruits (items)", food_waste: "🗑️ Food Waste (kg)", total: "TOTAL",
    prev_btn: "← Previous", next_btn: "Next →", save_btn: "✅ Save Entry",
    saved_title: "Saved Successfully!", saved_msg: "Your carbon data has been logged.",
    hist_title: "📅 Emission History", total_entries: "Total Entries", total_co2: "Total kg CO₂", best_day: "Best Day", logging_streak: "Logging Streak",
    emission_timeline: "Emission Timeline", last7: "Last 7 Days", last30: "Last 30 Days", last90: "Last 90 Days",
    all_entries: "All Entries", all_categories: "All Categories", transport_cat: "Transport", electricity_cat: "Electricity", food_cat: "Food",
    date_col: "Date", transport_col: "🚗 Transport", electricity_col: "⚡ Electricity", food_col: "🍽️ Food",
    total_co2_col: "Total CO₂", ecoscore_col: "EcoScore", action_col: "Action",
    lb_title: "🏆 Campus Leaderboard", this_week: "This Week", all_time: "All Time", your_position: "Your current leaderboard position",
    full_rankings: "Full Rankings", individual: "Individual", campus_groups: "Campus Groups", ngo_csr: "NGO/CSR",
    loading_rankings: "Loading rankings...", loading_groups: "Loading group rankings...", my_badges: "🎖️ My Eco Badges", share_impact: "🤳 Share My Impact",
    offset_title: "🌲 Carbon Offset Tools", carbon_journey: "Your Carbon Neutrality Journey",
    tree_calc: "Tree Plantation Calculator", co2_to_offset: "CO₂ to offset (kg)", tree_type: "Tree Type", trees_needed: "Trees Needed",
    avg_tree: "Average Tree (21 kg CO₂/yr)", bamboo: "Bamboo (50 kg CO₂/yr)", oak: "Oak (48 kg CO₂/yr)", fruit_tree: "Fruit Tree (15 kg CO₂/yr)", pine: "Pine (30 kg CO₂/yr)",
    solar_title: "Solar Savings Predictor", monthly_bill_label: "Monthly Electricity Bill", roof_area: "Roof Area Available (sq ft)", your_state: "Your State",
    kwh_year: "kWh/year", co2_saved: "kg CO₂ saved/yr", money_saved: "rs saved/year",
    credit_calc: "Carbon Credit Calculator", offset_program: "Offset Program Type",
    reforestation: "Reforestation", renewable: "Renewable Energy", direct_air: "Direct Air Capture", biochar: "Biochar", cost_label: "Estimated Cost to Offset", ngo_partners: "🤝 NGO & CSR Partners",
    rec_title: "🤖 AI Insights & Predictions", ecocoach_title: "EcoCoach AI Analysis", ecocoach_sub: "GPT-Powered Personalized Guidance",
    analyzing: "EcoCoach is analyzing your footprint...", ai_carbon_analysis: "Your AI Carbon Analysis",
    ml_model_note: "Our ML model predicts your future emissions", accuracy: "97% Accuracy", curr_month: "Current Month (est.)",
    ai_prediction: "🤖 AI Prediction (Next Month)", potential_savings: "Potential Savings", follow_tips: "kg CO₂ if you follow tips",
    smart_recs: "💡 Smart Recommendations", high_impact: "🔥 High Impact", behavioral: "📈 Behavioral Pattern Analysis", eco_challenges: "🎯 Eco Challenges",
    report_title: "Report Dashboard", analyzing_data: "Analyzing Data...", please_wait: "Please wait...",
    live_comparison: "Live Comparison vs India", custom_comparison: "Custom Comparison", detailed_comparison: "Detailed Comparison",
    gov_standards: "Government Standards", nat_target: "National Target 2030", nat_target_desc: "Reducing emission intensity by 45%",
    net_zero: "Net Zero Target", net_zero_desc: "India aims for Net Zero by 2070", daily_benchmark: "Daily Benchmark", daily_benchmark_desc: "Approx. 5.2 kg CO₂e per person",
    view_verified: "🏛️ View Verified Data & Referrals"
  },

  hi: {
    nav_dashboard: "डैशबोर्ड", nav_report: "रिपोर्ट डैशबोर्ड", nav_calculator: "कैलकुलेटर", nav_history: "इतिहास", nav_insights: "AI अंतर्दृष्टि", nav_leaderboard: "लीडरबोर्ड", nav_offset: "ऑफसेट टूल्स", nav_logout: "⬡ लॉगआउट",
    logout_btn: "लॉगआउट", realtime: "रियल-टाइम", log_data: "डेटा लॉग करें", log_today: "+ आज का डेटा लॉग करें", export_csv: "⬇ CSV निकास करें",
    
    l_feat: "विशेषताएं", l_how: "यह कैसे काम करता है", l_eco: "ईकोस्कोर", l_signin: "लॉग इन", l_getstart: "शुरुआत करें",
    l_hbadge: "एआई-संचालित कार्बन एनालिटिक्स",
    l_htitle: "अपने <span class='gradient-text'>कार्बन प्रभाव</span> को ट्रैक करें<br />पृथ्वी को <span class='gradient-text-green'>बचाएं</span>",
    l_hsub: "उन्नत एआई प्लेटफॉर्म जो आपको उत्सर्जन कम करने में मदद करता है।<br />अपना <strong>ईकोस्कोर</strong> और स्मार्ट सुझाव प्राप्त करें।",
    l_start: "<span>🚀</span> यात्रा शुरू करें", l_demo: "<span>▶</span> डेमो देखें",
    l_stat1: "सक्रिय ईको-योद्धा", l_stat2: "kg CO₂ मापा गया", l_stat3: "बचाए गए पेड़ों के बराबर",
    l_live: "लाइव", l_card1: "आपका ईकोस्कोर", l_card2: "अति उत्कृष्ट! आप पर्यावरण के चैंपियन हैं।",
    l_cmod: "मुख्य मॉड्यूल", l_cmodt: "हरित भविष्य के लिए <span class='gradient-text-green'>सब कुछ</span>",
    l_f1t: "स्मार्ट कैलकुलेटर", l_f1d: "परिवहन, बिजली और भोजन से कार्बन को मापें",
    l_f2t: "एआई भविष्यवाणियां", l_f2d: "मशीन लर्निंग से भविष्य के उत्सर्जन की सटीक भविष्यवाणी",
    l_f3t: "ईकोस्कोर प्रणाली", l_f3d: "सुधार के लिए 0-800 का रीयल-टाइम स्कोर प्रणाली",
    l_f4t: "एनालिटिक्स डैशबोर्ड", l_f4d: "शानदार चार्ट, प्रवृत्ति और समुदाय के साथ तुलना",
    l_f5t: "ऑफसेट कैलकुलेटर", l_f5d: "जानें कि उत्सर्जन भरपाई के लिए कितने पेड़ जरूरी हैं",
    l_f6t: "कैंपस लीडरबोर्ड", l_f6d: "दोस्तों और सहकर्मियों के साथ सकारात्मक प्रतिस्पर्धा",
    l_sbag: "यह कैसे काम करता है", l_stitle: "सरल, स्मार्ट, <span class='gradient-text'>टिकाऊ</span>",
    l_s1t: "प्रोफ़ाइल बनाएं", l_s1d: "साइन अप करें और अपना शहर और परिवार का आकार सेट करें",
    l_s2t: "डेटा भरें", l_s2d: "यातायात, बिजली और भोजन का दैनिक विवरण दर्ज करें",
    l_s3t: "ईकोस्कोर पाएं", l_s3d: "एआई आपका डेटा विश्लेषित करके तुरंत स्कोर देगा",
    l_s4t: "उधार करें", l_s4d: "स्मार्ट सुझावों का पालन करें और प्रकृति को बचाएं",
    l_ebdge: "ईकोस्कोर", l_etitle: "आप <span class='gradient-text-green'>कहाँ</span> खड़े हैं?",
    l_e1t: "उच्च प्रदूषण", l_e1d: "तत्काल कार्रवाई की आवश्यकता - आपका फुटप्रिंट बहुत ज्यादा है",
    l_e2t: "मध्यम", l_e2d: "लक्षित परिवर्तन के साथ सुधार की काफी गुंजाइश है",
    l_e3t: "अच्छा स्थिति", l_e3d: "आप सही रास्ते पर हैं - इस पर बने रहें!",
    l_e4t: "ईको फ्रेंडली", l_e4d: "शानदार! आप एक सच्चे पर्यावरण रक्षक हैं",
    l_cta1: "क्या आप <span class='gradient-text'>बदलाव</span> लाने के लिए तैयार हैं?",
    l_cta2: "हर दिन अपने कार्बन फुटप्रिंट को कम करने वाले हजारों लोगों से जुड़ें",
    l_ctab: "🌍 इकोट्रैक मुफ्त में ज्वाइन करें",
    l_ft: "हरे-भरे भविष्य के लिए ❤️ के साथ। सूत्र: उत्सर्जन = कार्य × फैक्टर",

    db_title: "डैशबोर्ड", your_ecoscore: "आपका ईकोस्कोर", points: "अंक", daily_streak: "दैनिक स्ट्रीक",
    impact_breakdown: "प्रभाव विश्लेषण", this_month: "इस महीने", transport_label: "परिवहन", electricity_label: "बिजली",
    diet_label: "आहार और भोजन", emission_analytics: "📈 उत्सर्जन विश्लेषण", recent_activity: "हालिया गतिविधि", ai_tips: "AI सुझाव",
    top_warriors: "शीर्ष ईको-योद्धा", view_all: "सभी देखें", calc_title: "कार्बन कैलकुलेटर", step1of3: "चरण 1 / 3", step2of3: "चरण 2 / 3",
    step3of3: "चरण 3 / 3", transport_emissions: "🚗 परिवहन उत्सर्जन (दैनिक)", transport_subtitle: "अपनी दैनिक यात्रा ट्रैक करें।",
    personal_vehicle: "व्यक्तिगत वाहन", fuel_type: "ईंधन प्रकार", petrol: "पेट्रोल", diesel: "डीज़ल",
    cng: "CNG", electric: "इलेक्ट्रिक", distance_driven: "तय की गई दूरी (km)", mileage: "माइलेज",
    public_transport: "सार्वजनिक परिवहन", auto_taxi: "ऑटो/टैक्सी (km)", bus_km: "बस (km)", metro_train: "मेट्रो (km)",
    air_travel: "हवाई यात्रा", flight_hours: "उड़ान के घंटे", flight_class: "उड़ान श्रेणी", economy: "इकोनॉमी", business: "बिज़नेस",
    first_class: "फर्स्ट क्लास", electricity_energy: "⚡ बिजली (मासिक)", home_electricity: "घरेलू बिजली",
    monthly_bill: "मासिक बिल", rate_kwh: "दर", direct_kwh: "सीधा kWh", lpg_png: "गैस", lpg_cylinders: "LPG सिलेंडर",
    png_usage: "PNG उपयोग", household_members: "🏠 परिवार के सदस्य", family_members: "सदस्यों की संख्या",
    appliances: "उपकरण उपयोग", ac: "🌡️ एसी", pc: "🖥️ लैपटॉप", tv: "📺 TV", washing: "🧺 वॉशिंग मशीन",
    food_diet: "🍽️ भोजन", food_subtitle: "आज का भोजन दर्ज करें", diet_type: "आहार", vegan: "वीगन", pure_veg: "शाकाहारी",
    veg_egg: "अंडा", omnivore: "सर्वाहारी", heavy_meat: "मांसाहारी", ai_food_scanner: "फूड स्कैनर", what_eat: "क्या खाया?",
    how_many_dishes: "कितने व्यंजन?", generate_fields: "फ़ील्ड बनाएं", dish: "व्यंजन", footprint: "फुटप्रिंट", other_impacts: "अन्य असर",
    rice: "🍚 चावल", grains: "🍞 रोटी", veggies: "🥕 सब्जियाँ", imported_fruits: "🍎 आयातित फल", food_waste: "🗑️ खाद्य अपशिष्ट",
    total: "कुल", prev_btn: "← पिछला", next_btn: "अगला →", save_btn: "✅ सहेजें", saved_title: "सहेजा गया!", saved_msg: "डेटा सेव हो गया।",
    hist_title: "📅 इतिहास", total_entries: "प्रविष्टियाँ", total_co2: "कुल CO₂", best_day: "सर्वश्रेष्ठ दिन", logging_streak: "स्ट्रीक",
    emission_timeline: "उत्सर्जन टाइमलाइन", last7: "7 दिन", last30: "30 दिन", last90: "90 दिन",
    all_entries: "सभी प्रविष्टियाँ", all_categories: "सभी श्रेणियाँ", transport_cat: "परिवहन", electricity_cat: "बिजली", food_cat: "भोजन",
    date_col: "तारीख", transport_col: "परिवहन", electricity_col: "बिजली", food_col: "भोजन",
    total_co2_col: "कुल CO₂", ecoscore_col: "ईकोस्कोर", action_col: "कार्रवाई",
    lb_title: "🏆 लीडरबोर्ड", this_week: "इस सप्ताह", all_time: "सर्वकालीन", your_position: "आपकी स्थिति",
    full_rankings: "पूर्ण रैंकिंग", individual: "व्यक्तिगत", campus_groups: "कैंपस समूह", ngo_csr: "NGO/CSR",
    loading_rankings: "लोड हो रहा है...", loading_groups: "समूह लोड हो रहा है...", my_badges: "🎖️ मेरे बैज", share_impact: "शेयर करें",
    offset_title: "🌲 ऑफसेट टूल्स", carbon_journey: "आपकी कार्बन यात्रा", tree_calc: "वृक्षारोपण कैलकुलेटर", co2_to_offset: "ऑफ़सेट CO₂",
    tree_type: "वृक्ष प्रकार", trees_needed: "आवश्यक पेड़", avg_tree: "औसत पेड़", bamboo: "बांस", oak: "ओक", fruit_tree: "फलदार", pine: "पाइन",
    solar_title: "सौर बचत", monthly_bill_label: "मासिक बिल", roof_area: "छत क्षेत्र", your_state: "राज्य",
    kwh_year: "kWh", co2_saved: "kg CO₂ बचत", money_saved: "रुपये बचाए", credit_calc: "क्रेडिट कैलकुलेटर", offset_program: "प्रोग्राम",
    reforestation: "पुनर्वनीकरण", renewable: "पवन ऊर्जा", direct_air: "एयर कैप्चर", biochar: "बायोचार", cost_label: "लागत", ngo_partners: "भागीदार",
    rec_title: "🤖 AI अंतर्दृष्टि", ecocoach_title: "EcoCoach विश्लेषण", ecocoach_sub: "GPT-मार्गदर्शन",
    analyzing: "विश्लेषण कर रहा है...", ai_carbon_analysis: "AI कार्बन विश्लेषण", ml_model_note: "ML मॉडल भविष्यवाणी करता है",
    accuracy: "97% सटीकता", curr_month: "वर्तमान माह", ai_prediction: "AI भविष्यवाणी", potential_savings: "संभावित बचत",
    follow_tips: "यदि सुझाव मानें", smart_recs: "💡 स्मार्ट सिफारिशें", high_impact: "🔥 उच्च प्रभाव", behavioral: "पैटर्न विश्लेषण", eco_challenges: "🎯 चुनौतियाँ",
    report_title: "रिपोर्ट डैशबोर्ड", analyzing_data: "डेटा विश्लेषण...", please_wait: "कृपया प्रतीक्षा करें...",
    live_comparison: "लाइव तुलना बनाम भारत", custom_comparison: "कस्टम तुलना", detailed_comparison: "विस्तृत तुलना",
    gov_standards: "सरकारी मानक", nat_target: "राष्ट्रीय लक्ष्य 2030", nat_target_desc: "45% कमी",
    net_zero: "नेट ज़ीरो लक्ष्य", net_zero_desc: "2070 तक नेट ज़ीरो", daily_benchmark: "दैनिक बेंचमार्क", daily_benchmark_desc: "प्रति व्यक्ति 5.2 kg", view_verified: "🏛️ डेटा देखें"
  },

  bn: {
    nav_dashboard: "ড্যাশবোর্ড", nav_report: "রিপোর্ট", nav_calculator: "ক্যালকুলেটর", nav_history: "ইতিহাস", nav_insights: "AI অন্তর্দৃষ্টি", nav_leaderboard: "লিডারবোর্ড", nav_offset: "অফসেট টুলস", nav_logout: "⬡ লগআউট",
    logout_btn: "লগআউট", realtime: "রিয়েল-টাইম", log_data: "তথ্য যুক্ত করুন", log_today: "+ আজকের তথ্য", export_csv: "⬇ CSV এক্সপোর্ট",
    
    l_feat: "বৈশিষ্ট্য", l_how: "কিভাবে কাজ করে", l_eco: "ইকোস্কোর", l_signin: "লগ ইন", l_getstart: "শুরু করুন",
    l_hbadge: "এআই-চালিত কার্বন বিশ্লেষণ",
    l_htitle: "আপনার <span class='gradient-text'>কার্বন প্রভাব</span> ট্র্যাক করুন<br />বিশ্বকে <span class='gradient-text-green'>বাঁচান</span>",
    l_hsub: "উন্নত এআই প্ল্যাটফর্ম যা আপনার কার্বন নির্গমন গণনা করতে এবং কমাতে সাহায্য করে।<br />তাত্ক্ষণিকভাবে আপনার <strong>ইকোস্কোর</strong> পান।",
    l_start: "<span>🚀</span> যাত্রা শুরু করুন", l_demo: "<span>▶</span> ডেমো দেখুন",
    l_stat1: "সক্রিয় ইকো-যোদ্ধা", l_stat2: "kg CO₂ ট্র্যাক করা হয়েছে", l_stat3: "রক্ষা করা গাছের সমতুল্য",
    l_live: "লাইভ", l_card1: "আপনার ইকোস্কোর", l_card2: "দুর্দান্ত! আপনি একজন চ্যাম্পিয়ন।",
    l_cmod: "প্রধান মডিউল", l_cmodt: "সবুজ ভবিষ্যতের জন্য <span class='gradient-text-green'>সবকিছু</span>",
    l_f1t: "স্মার্ট ক্যালকুলেটর", l_f1d: "পরিবহন, বিদ্যুৎ এবং খাদ্যের নির্গমন পরিমাপ করুন",
    l_f2t: "এআই ভবিষ্যদ্বাণী", l_f2d: "ভবিষ্যতের কার্বন ফুটপ্রিন্টের সঠিক ভবিষ্যদ্বাণী",
    l_f3t: "ইকোস্কোর সিস্টেম", l_f3d: "উন্নতির জন্য 0-800 এর রিয়েল-টাইম স্কোর",
    l_f4t: "কাস্টম ড্যাশবোর্ড", l_f4d: "চার্ট, প্রবণতা বিশ্লেষণ এবং সম্প্রদায়ের সাথে তুলনা",
    l_f5t: "অফসেট ক্যালকুলেটর", l_f5d: "নির্গমন পূরণের জন্য কত গাছ প্রয়োজন তা জানুন",
    l_f6t: "লিডারবোর্ড", l_f6d: "বন্ধুদের এবং কলিগদের সাথে প্রতিযোগিতা করুন",
    l_sbag: "কিভাবে কাজ করে", l_stitle: "সরল, স্মার্ট, <span class='gradient-text'>টেকসই</span>",
    l_s1t: "প্রোফাইল তৈরি করুন", l_s1d: "সাইন আপ করুন এবং ঠিকানা ও ব্যাসরেখা সেট করুন",
    l_s2t: "তথ্য যুক্ত করুন", l_s2d: "দৈনন্দিন পরিবহন, বিদ্যুৎ ও খাদ্যের বিবরণ",
    l_s3t: "ইকোস্কোর পান", l_s3d: "এআই আপনার তথ্য বিশ্লেষণ করে তাৎক্ষণিক স্কোর দেবে",
    l_s4t: "নির্গমন কমান", l_s4d: "সুপারিশ অনুসরণ করুন এবং পরিবেশ বাঁচান",
    l_ebdge: "ইকোস্কোর সিস্টেম", l_etitle: "আপনি <span class='gradient-text-green'>কোথায়</span> দাঁড়িয়ে আছেন?",
    l_e1t: "উচ্চ দূষণ", l_e1d: "জরুরী পদক্ষেপ প্রয়োজন - আপনার ফুটপ্রিন্ট অনেক বেশি",
    l_e2t: "মধ্যম", l_e2d: "সঠিক পরিবর্তনের সাথে উন্নতির অনেক সুযোগ রয়েছে",
    l_e3t: "ভালো অবস্থা", l_e3d: "আপনি সঠিক পথে আছেন - এভাবেই চলুন!",
    l_e4t: "ইকো ফ্রেন্ডলি", l_e4d: "অসাধারণ! আপনি প্রকৃত পরিবেশ রক্ষক",
    l_cta1: "আপনি কি <span class='gradient-text'>পরিবর্তন</span> আনতে প্রস্তুত?",
    l_cta2: "প্রতিদিন নিজেদের কার্বন ফুটপ্রিন্ট কমানো হাজার হাজার মানুষের সাথে যোগ দিন",
    l_ctab: "🌍 ইকোট্র্যাক এআই এ যোগ দিন - এটি সম্পূর্ণ বিনামূল্যে",
    l_ft: "সবুজ ভবিষ্যতের জন্য ❤️ দিয়ে তৈরি। সমীকরণ: নির্গমন = কাজ × ফ্যাক্টর",

    db_title: "ড্যাশবোর্ড", your_ecoscore: "আপনার ইকোস্কোর", points: "পয়েন্ট", daily_streak: "ডেইলি স্ট্রিক",
    impact_breakdown: "প্রভাব বিশ্লেষণ", this_month: "এই মাসে", transport_label: "পরিবহন", electricity_label: "বিদ্যুৎ",
    diet_label: "খাদ্য এবং আহার", emission_analytics: "📈 নির্গমন বিশ্লেষণ", recent_activity: "সাম্প্রতিক কাজ", ai_tips: "এআই টিপস",
    top_warriors: "শীর্ষ যোদ্ধা", view_all: "সব দেখুন", calc_title: "ক্যালকুলেটর", step1of3: "ধাপ 1 / 3", step2of3: "ধাপ 2 / 3",
    step3of3: "ধাপ 3 / 3", transport_emissions: "🚗 পরিবহন (দৈনিক)", transport_subtitle: "দৈনন্দিন যাত্রা ট্র্যাক করুন।",
    personal_vehicle: "ব্যক্তিগত গাড়ি", fuel_type: "জ্বালানির ধরন", petrol: "পেট্রোল", diesel: "ডিজেল",
    cng: "CNG", electric: "বৈদ্যুতিক", distance_driven: "অতিক্রান্ত দূরত্ব (কিমি)", mileage: "মাইলেজ",
    public_transport: "পাবলিক ট্রান্সপোর্ট", auto_taxi: "অটো/ট্যাক্সি", bus_km: "বাস", metro_train: "মেট্রো/ট্রেন",
    air_travel: "বিমান যাতায়াত", flight_hours: "উড়ান ঘণ্টা", flight_class: "ফ্লাইট ক্লাস", economy: "ইকোনমি", business: "বিজনেস",
    first_class: "প্রথম শ্রেণী", electricity_energy: "⚡ বিদ্যুৎ (মাসিক)", home_electricity: "বাড়ির বিদ্যুৎ",
    monthly_bill: "মাসিক বিল", rate_kwh: "হার", direct_kwh: "সরাসরি ইউনিট", lpg_png: "গ্যাস", lpg_cylinders: "LPG সিলিন্ডার",
    png_usage: "PNG ব্যবহার", household_members: "🏠 পরিবারের সদস্য", family_members: "সদস্য সংখ্যা",
    appliances: "বিদ্যুৎ সরঞ্জাম", ac: "🌡️ এসি", pc: "🖥️ ল্যাপটপ", tv: "📺 টিভি", washing: "🧺 ওয়াশিং মেশিন",
    food_diet: "🍽️ খাদ্য", food_subtitle: "আজকের খাবার ট্র্যাক করুন", diet_type: "খাদ্যাভ্যাস", vegan: "ভেগান", pure_veg: "নিরামিষ",
    veg_egg: "ডিমসহ নিরামিষ", omnivore: "সর্বভুক", heavy_meat: "মাংসভোজী", ai_food_scanner: "এআই স্ক্যানার", what_eat: "কী খেলেন?",
    how_many_dishes: "কয়টি পদ?", generate_fields: "ফিল্ড তৈরি করুন", dish: "পদ", footprint: "ফুটপ্রিন্ট", other_impacts: "অন্যান্য প্রভাব",
    rice: "🍚 ভাত", grains: "🍞 রুটি", veggies: "🥕 সবজি", imported_fruits: "🍎 ফল", food_waste: "🗑️ খাদ্যের অপচয়",
    total: "মোট", prev_btn: "← পূর্ববর্তী", next_btn: "পরবর্তী →", save_btn: "✅ সংরক্ষণ করুন", saved_title: "সংরক্ষিত!", saved_msg: "আপনার ডেটা সেভ হয়েছে।",
    hist_title: "📅 ইতিহাস", total_entries: "মোট এন্ট্রি", total_co2: "মোট CO₂", best_day: "সেরা দিন", logging_streak: "স্ট্রিক",
    emission_timeline: "টাইমলাইন", last7: "৭ দিন", last30: "৩০ দিন", last90: "৯০ দিন",
    all_entries: "সব এন্ট্রি", all_categories: "সব বিভাগ", transport_cat: "পরিবহন", electricity_cat: "বিদ্যুৎ", food_cat: "খাদ্য",
    date_col: "তারিখ", transport_col: "পরিবহন", electricity_col: "বিদ্যুৎ", food_col: "খাদ্য",
    total_co2_col: "মোট CO₂", ecoscore_col: "ইকোস্কোর", action_col: "ব্যবস্থা",
    lb_title: "🏆 ক্যাম্পাস লিডারবোর্ড", this_week: "এই সপ্তাহে", all_time: "সর্বকালীন", your_position: "আপনার অবস্থান",
    full_rankings: "পূর্ণ র‍্যাঙ্কিং", individual: "নিজস্ব", campus_groups: "গ্রুপ", ngo_csr: "NGO/CSR",
    loading_rankings: "লোড হচ্ছে...", loading_groups: "গ্রুপ লোড হচ্ছে...", my_badges: "🎖️ আমার ব্যাজ", share_impact: "শেয়ার করুন",
    offset_title: "🌲 অফসেট টুলস", carbon_journey: "আপনার যাত্রা", tree_calc: "গাছ লাগানোর ক্যালকুলেটর", co2_to_offset: "অফসেট CO₂",
    tree_type: "গাছের ধরণ", trees_needed: "প্রয়োজনীয় গাছ", avg_tree: "সাধারণ গাছ", bamboo: "বাঁশ", oak: "ওক", fruit_tree: "ফল গাছ", pine: "পাইন",
    solar_title: "সোলার সেভিংস", monthly_bill_label: "মাসিক বিল", roof_area: "ছাদের মাপ", your_state: "রাজ্য",
    kwh_year: "kWh", co2_saved: "CO₂ বাঁচানো", money_saved: "টাকা বাঁচানো", credit_calc: "ক্রেডিট ক্যালকুলেটর", offset_program: "অফসেট প্রোগ্রাম",
    reforestation: "বনায়ন", renewable: "নবায়নযোগ্য শক্তি", direct_air: "এয়ার ক্যাপচার", biochar: "বায়োচার", cost_label: "খরচ", ngo_partners: "পার্টনার",
    rec_title: "🤖 অন্তর্দৃষ্টি", ecocoach_title: "ইকো-কোচ বিশ্লেষণ", ecocoach_sub: "GPT-গাইডেন্স",
    analyzing: "বিশ্লেষণ করছে...", ai_carbon_analysis: "এআই বিশ্লেষণ", ml_model_note: "মেশিন লার্নিং ভবিষ্যদ্বাণী",
    accuracy: "৯৭% সঠিকতা", curr_month: "বর্তমান মাস", ai_prediction: "এআই ভবিষ্যদ্বাণী", potential_savings: "সম্ভাব্য সঞ্চয়",
    follow_tips: "টিপস মানলে", smart_recs: "💡 স্মার্ট সুপারিশ", high_impact: "🔥 গুরুত্বপূর্ণ রূপান্তর", behavioral: "প্যাটার্ন বিশ্লেষণ", eco_challenges: "🎯 চ্যালেঞ্জ",
    report_title: "রিপোর্ট", analyzing_data: "বিশ্লেষণ...", please_wait: "দয়া করে অপেক্ষা করুন...",
    live_comparison: "লাইভ তুলনা", custom_comparison: "কাস্টম তুলনা", detailed_comparison: "বিস্তৃত তুলনা",
    gov_standards: "সরকারী মান", nat_target: "জাতীয় লক্ষ্য", nat_target_desc: "৪৫% নির্গমন হ্রাস",
    net_zero: "নেট জিরো", net_zero_desc: "২০৭০ এর আগে নেট জিরো", daily_benchmark: "দৈনিক লক্ষ্য", daily_benchmark_desc: "মাথাপিছু ৫.২ কেজি", view_verified: "🏛️ ডেটা দেখুন"
  },

  ta: {
    nav_dashboard: "டாஷ்போர்டு", nav_report: "அறிக்கை", nav_calculator: "கால்குலேட்டர்", nav_history: "வரலாறு", nav_insights: "AI நுண்ணறிவு", nav_leaderboard: "லீடர்போர்டு", nav_offset: "ஆஃப்செட்", nav_logout: "⬡ வெளியேறு",
    logout_btn: "வெளியேறு", realtime: "நிகழ்நேரம்", log_data: "தரவை பதிவு செய்", log_today: "+ இன்று பதிவு செய்", export_csv: "⬇ CSV பதிவிறக்கு",
    
    l_feat: "அம்சங்கள்", l_how: "எப்படி செயல்படுகிறது", l_eco: "ஈகோஸ்கோர்", l_signin: "உள்நுழை", l_getstart: "தொடங்கவும்",
    l_hbadge: "AI-ஆதரிக்கும் கார்பன் அறிவியியல்",
    l_htitle: "உங்கள் <span class='gradient-text'>கார்பன் தாக்கத்தை</span> கண்காணிக்கவும்<br />உலகை <span class='gradient-text-green'>பாதுகாக்கவும்</span>",
    l_hsub: "உங்கள் கார்பன் உமிழ்வைக் கணக்கிடவும், குறைக்கவும் உதவும் மேம்பட்ட AI தளம்.<br />உங்கள் தனிப்பயனாக்கப்பட்ட <strong>ஈகோஸ்கோர்</strong> உடனடியாகப் பெறவும்.",
    l_start: "<span>🚀</span> தொடங்கவும்", l_demo: "<span>▶</span> டெமோ பார்க்க",
    l_stat1: "செயலில் உள்ளவர்கள்", l_stat2: "kg CO₂ குறைப்பு", l_stat3: "மரங்களுக்கு சமம்",
    l_live: "நேரடி", l_card1: "உங்கள் ஈகோஸ்கோர்", l_card2: "மிகச் சிறப்பு! நீங்கள் சுற்றுச்சூழல் சாம்பியன்.",
    l_cmod: "முக்கிய தொகுதிகள்", l_cmodt: "பசுமை எதிர்காலத்திற்கான <span class='gradient-text-green'>அனைத்தும்</span>",
    l_f1t: "ஸ்மார்ட் கால்குலேட்டர்", l_f1d: "போக்குவரத்து, மின்சாரம், உணவின் கார்பன் அளவைக் கணக்கிடுங்கள்",
    l_f2t: "AI கணிப்புகள்", l_f2d: "உங்கள் எதிர்கால உமிழ்வுகளை இயந்திர கற்றல் மூலம் கணிக்கவும்",
    l_f3t: "ஈகோஸ்கோர் அமைப்பு", l_f3d: "உங்கள் பழக்கங்களை மேம்படுத்த 0-800 நிகழ்நேர ஈகோஸ்கோர்",
    l_f4t: "பகுப்பாய்வு டேஷ்போர்டு", l_f4d: "விளக்கப்படங்கள் மற்றும் சமூகத்துடன் ஒப்பிடுதல்",
    l_f5t: "ஆஃப்செட் கால்குலேட்டர்", l_f5d: "எத்தனை மரங்கள் நட வேண்டும் என்பதை கண்டறியவும்",
    l_f6t: "லீடர்போர்டு", l_f6d: "நண்பர்களோடு போட்டியிட்டு மாற்றத்தைக் கொண்டு வாருங்கள்",
    l_sbag: "செயல்படும் முறை", l_stitle: "எளிமையான, <span class='gradient-text'>சுற்றுச்சூழல் நட்பு</span>",
    l_s1t: "சுயவிவரம் உருவாக்கு", l_s1d: "பதிவு செய்து உங்கள் இருப்பிடம், குடும்ப அளவை உள்ளிடவும்",
    l_s2t: "செயல்பாடுகள் சேர்", l_s2d: "தினசரி பயணம், மின்சாரம், உணவு விவரங்களை உள்ளிடவும்",
    l_s3t: "ஸ்கோர் பெறுங்கள்", l_s3d: "AI தரவை பகுப்பாய்வு செய்து மதிப்பெண் வழங்கும்",
    l_s4t: "கண்காணித்து குறைக்கவும்", l_s4d: "பரிந்துரைகளைப் பின்பற்றி உங்கள் மதிப்பெண்ணை மேம்படுத்துங்கள்",
    l_ebdge: "ஈகோஸ்கோர்", l_etitle: "நீங்கள் <span class='gradient-text-green'>எங்கு</span> இருக்கிறீர்கள்?",
    l_e1t: "அதிக மாசுபாடு", l_e1d: "உடனடி நடவடிக்கை தேவை - உமிழ்வு மிக அதிகம்",
    l_e2t: "நடுத்தரம்", l_e2d: "சிறிய மாற்றங்கள் மூலம் நிறைய மேம்படுத்தலாம்",
    l_e3t: "நல்லது", l_e3d: "சரியான பாதையில் செல்கிறீர்கள் - தொடருங்கள்",
    l_e4t: "சுற்றுச்சூழல் நட்பு", l_e4d: "அற்புதம்! நீங்கள் ஒரு உண்மையான பாதுகாவலர்",
    l_cta1: "<span class='gradient-text'>மாற்றத்தை</span> ஏற்படுத்த தயாரா?",
    l_cta2: "கார்பன் உமிழ்வைக் குறைக்கும் ஆயிரக்கணக்கானவர்களுடன் இணையுங்கள்",
    l_ctab: "🌍 EcoTrack AI-இல் இலவசமாக இணையுங்கள்",
    l_ft: "பசுமையான நாளைக்காக ❤️ உடன் உருவாக்கப்பட்டது | கார்பன் சூத்திரம்: உமிழ்வு = செயல்பாடு × காரணி",

    db_title: "டாஷ்போர்டு", your_ecoscore: "உங்கள் ஈகோஸ்கோர்", points: "புள்ளிகள்", daily_streak: "தினசரி ஸ்ட்ரீக்",
    impact_breakdown: "தாக்க முறிவு", this_month: "இந்த மாதம்", transport_label: "பயணம்", electricity_label: "மின்சாரம்",
    diet_label: "உணவு", emission_analytics: "📈 உமிழ்வு பகுப்பாய்வு", recent_activity: "சமீபத்திய செயல்கள்", ai_tips: "AI குறிப்புகள்",
    top_warriors: "சிறந்த வீரர்கள்", view_all: "அனைத்தையும் காண்", calc_title: "கால்குலேட்டர்", step1of3: "படி 1 / 3", step2of3: "படி 2 / 3",
    step3of3: "படி 3 / 3", transport_emissions: "🚗 போக்குவரத்து (தினசரி)", transport_subtitle: "தினசரி பயணத்தை பதிவு செய்யவும்",
    personal_vehicle: "சொந்த வாகனம்", fuel_type: "எரிபொருள் வகை", petrol: "பெட்ரோல்", diesel: "டீசல்",
    cng: "CNG", electric: "மின்சார", distance_driven: "தூரம் (km)", mileage: "மைலேஜ்",
    public_transport: "பொது போக்குவரத்து", auto_taxi: "ஆட்டோ/டாக்ஸி", bus_km: "பேருந்து", metro_train: "ரயில்",
    air_travel: "விமான பயணம்", flight_hours: "பயண நேரம்", flight_class: "வகுப்பு", economy: "பொருளாதாரம்", business: "வணிகம்",
    first_class: "முதல் வகுப்பு", electricity_energy: "⚡ மின்சாரம் (மாதாந்திர)", home_electricity: "வீட்டு மின்சாரம்",
    monthly_bill: "மாதாந்திர கட்டணம்", rate_kwh: "கட்டணம் அளவு", direct_kwh: "அலகு (kWh)", lpg_png: "எரிவாயு", lpg_cylinders: "சிலிண்டர்கள்",
    png_usage: "PNG அளவு", household_members: "🏠 குடும்ப உறுப்பினர்கள்", family_members: "எத்தனை பேர்?",
    appliances: "மின் சாதனங்கள்", ac: "🌡️ AC", pc: "🖥️ லேப்டாப்", tv: "📺 TV", washing: "🧺 சலவை இயந்திரம்",
    food_diet: "🍽️ உணவு", food_subtitle: "இன்றைய உணவு", diet_type: "உணவு முறை", vegan: "வீகன்", pure_veg: "சைவம்",
    veg_egg: "முட்டை", omnivore: "அனைத்தும்", heavy_meat: "அதிக இறைச்சி", ai_food_scanner: "AI ஸ்கேனர்", what_eat: "என்ன உணவு?",
    how_many_dishes: "எத்தனை உணவுகள்?", generate_fields: "உருவாக்கு", dish: "உணவு", footprint: "கார்பன் அளவு", other_impacts: "மற்ற தாக்கங்கள்",
    rice: "🍚 சாதம்", grains: "🍞 தானியங்கள்", veggies: "🥕 காய்கறிகள்", imported_fruits: "🍎 பழங்கள்", food_waste: "🗑️ குப்பை",
    total: "மொத்தம்", prev_btn: "← முந்தைய", next_btn: "அடுத்தது →", save_btn: "✅ சேமி", saved_title: "சேமிக்கப்பட்டது!", saved_msg: "தரவு சேமிக்கப்பட்டது.",
    hist_title: "📅 வரலாறு", total_entries: "பதிவுகள்", total_co2: "மொத்த CO₂", best_day: "சிறந்த நாள்", logging_streak: "ஸ்ட்ரீக்",
    emission_timeline: "காலவரிசை", last7: "7 நாட்கள்", last30: "30 நாட்கள்", last90: "90 நாட்கள்",
    all_entries: "அனைத்தும்", all_categories: "வகைகள்", transport_cat: "பயணம்", electricity_cat: "மின்சாரம்", food_cat: "உணவு",
    date_col: "தேதி", transport_col: "பயணம்", electricity_col: "மின்சாரம்", food_col: "உணவு",
    total_co2_col: "மொத்த CO₂", ecoscore_col: "ஈகோஸ்கோர்", action_col: "செயல்",
    lb_title: "🏆 லீடர்போர்டு", this_week: "இந்த வாரம்", all_time: "எல்லா நேரமும்", your_position: "உங்கள் இடம்",
    full_rankings: "முழு தரவரிசை", individual: "தனிநபர்", campus_groups: "குழுக்கள்", ngo_csr: "NGO/CSR",
    loading_rankings: "ஏற்றுகிறது...", loading_groups: "குழுக்களை ஏற்றுகிறது...", my_badges: "🎖️ பேட்ஜ்கள்", share_impact: "பகிர்க",
    offset_title: "🌲 ஆஃப்செட்", carbon_journey: "உங்கள் பயணம்", tree_calc: "மரம் நடும் திட்டம்", co2_to_offset: "CO₂ குறைக்க",
    tree_type: "மர வகை", trees_needed: "தேவையான மரங்கள்", avg_tree: "சராசரி மரம்", bamboo: "மூங்கில்", oak: "ஓக் மரம்", fruit_tree: "பழ மரம்", pine: "பைன் மரம்",
    solar_title: "சூரிய சக்தி மிச்சம்", monthly_bill_label: "மாத மின்கட்டணம்", roof_area: "கூரையின் அளவு", your_state: "மாநிலம்",
    kwh_year: "kWh", co2_saved: "CO₂ சேமிப்பு", money_saved: "பணம் சேமிப்பு", credit_calc: "கிரெடிட் கணக்கீடு", offset_program: "திட்டம்",
    reforestation: "மரம் நடும் திட்டம்", renewable: "புதுப்பிக்கத்தக்க", direct_air: "நொதித்தல்", biochar: "பயோகரி", cost_label: "செலவு", ngo_partners: "நிறுவனங்கள்",
    rec_title: "🤖 நுண்ணறிவு", ecocoach_title: "AI பகுப்பாய்வு", ecocoach_sub: "GPT வழிகாட்டல்",
    analyzing: "பகுப்பாய்வு செய்கிறது...", ai_carbon_analysis: "உங்கள் கார்டன் தரவு", ml_model_note: "ML மாடல் உங்களை கணிக்கிறது",
    accuracy: "97% துல்லியம்", curr_month: "இந்த மாதம்", ai_prediction: "எதிர்கால கணிப்பு", potential_savings: "சேமிப்பு வாய்ப்பு",
    follow_tips: "குறிப்புகளைப் பின்பற்றினால்", smart_recs: "💡 ஸ்மார்ட் குறிப்புகள்", high_impact: "🔥 அதிக தாக்கம்", behavioral: "பழக்கவழக்கம்", eco_challenges: "🎯 சவால்கள்",
    report_title: "அறிக்கை", analyzing_data: "தரவு ஆய்வு...", please_wait: "காத்திருக்கவும்...",
    live_comparison: "நேரடி ஒப்பீடு", custom_comparison: "தனி ஒப்பீடு", detailed_comparison: "விரிவான அறிக்கை",
    gov_standards: "அரசு தரநிலைகள்", nat_target: "தேசிய இலக்கு 2030", nat_target_desc: "45% குறைப்பு",
    net_zero: "நெட் ஜீரோ", net_zero_desc: "2070 இலக்கு", daily_benchmark: "தினசரி பெஞ்ச்மார்க்", daily_benchmark_desc: "ஒரு நபருக்கு 5.2 கிலோ", view_verified: "🏛️ சரிபார்க்கப்பட்ட தரவு"
  }
};

let currentLang = localStorage.getItem('ecotrack_lang') || 'en';

function t(key) {
  return translations[currentLang]?.[key] || translations['en']?.[key] || "";
}

function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('ecotrack_lang', lang);
  applyTranslations();
}

function applyTranslations() {
  const L = currentLang;

  // 1. Text Content replacements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = translations[L]?.[el.getAttribute('data-i18n')];
    if (val !== undefined && val !== "") el.textContent = val;
  });

  // 1b. HTML replacements
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const val = translations[L]?.[el.getAttribute('data-i18n-html')];
    if (val !== undefined && val !== "") el.innerHTML = val;
  });

  // 2. Placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const val = translations[L]?.[el.getAttribute('data-i18n-placeholder')];
    if (val !== undefined && val !== "") el.placeholder = val;
  });

  // 3. Log Data / Log Today buttons
  document.querySelectorAll('.btn-add-data').forEach(btn => {
    const tval = translations[L]?.['log_data'];
    if(tval) btn.innerHTML = `<span>+</span> ${tval}`;
  });

  // 4. Topbar Logout
  document.querySelectorAll('.btn-ghost[onclick="logout()"]').forEach(btn => {
    const tval = translations[L]?.['logout_btn'];
    if (tval) btn.textContent = tval;
  });

  // 5. Sidebar logout button
  document.querySelectorAll('.logout-btn').forEach(btn => {
    const tval = translations[L]?.['nav_logout'];
    if(tval) btn.textContent = tval;
  });

  // 6. REAL-TIME badge
  document.querySelectorAll('.status-badge').forEach(el => {
    const tval = translations[L]?.['realtime'];
    if(tval) el.textContent = `• ${tval}`;
  });

  // 7. Date locale
  const dateEl = document.getElementById('currentDate');
  if (dateEl) {
    let localeCode = 'en-US';
    if(L === 'hi') localeCode = 'hi-IN';
    if(L === 'bn') localeCode = 'bn-IN';
    if(L === 'ta') localeCode = 'ta-IN';
    dateEl.textContent = new Date().toLocaleDateString(
      localeCode,
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
