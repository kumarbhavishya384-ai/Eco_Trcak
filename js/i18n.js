/* EcoTrack AI - i18n Language System */

const translations = {
  en: {
    dashboard: "Dashboard", reports: "Reports", calculator: "Calculator",
    history: "History", aiInsights: "AI Insights", leaderboard: "Leaderboard",
    offsetTools: "Offset Tools", logout: "⬡ Logout", logoutBtn: "Logout",
    dashboardTitle: "Dashboard", realtime: "REAL-TIME", logData: "Log Data",
    yourEcoScore: "Your EcoScore", points: "POINTS", dailyStreak: "DAILY STREAK",
    impactBreakdown: "Impact Breakdown", thisMonth: "This Month",
    transportation: "TRANSPORTATION", electricity: "ELECTRICITY", dietMeals: "DIET & MEALS",
    emissionAnalytics: "📈 Emission Analytics",
    recentActivity: "Recent Activity", noActivity: "No activity yet.",
    aiTips: "AI Tips", topEcoWarriors: "Top Eco-Warriors", viewAll: "View All",
  },
  hi: {
    dashboard: "डैशबोर्ड", reports: "रिपोर्ट", calculator: "कैलकुलेटर",
    history: "इतिहास", aiInsights: "AI अंतर्दृष्टि", leaderboard: "लीडरबोर्ड",
    offsetTools: "ऑफसेट टूल्स", logout: "⬡ लॉगआउट", logoutBtn: "लॉगआउट",
    dashboardTitle: "डैशबोर्ड", realtime: "रियल-टाइम", logData: "डेटा लॉग करें",
    yourEcoScore: "आपका ईकोस्कोर", points: "अंक", dailyStreak: "दैनिक स्ट्रीक",
    impactBreakdown: "प्रभाव विश्लेषण", thisMonth: "इस महीने",
    transportation: "परिवहन", electricity: "बिजली", dietMeals: "आहार और भोजन",
    emissionAnalytics: "📈 उत्सर्जन विश्लेषण",
    recentActivity: "हालिया गतिविधि", noActivity: "अभी तक कोई गतिविधि नहीं।",
    aiTips: "AI सुझाव", topEcoWarriors: "शीर्ष ईको-योद्धा", viewAll: "सभी देखें",
  }
};

// Global language state - persisted in localStorage
let currentLang = localStorage.getItem('ecotrack_lang') || 'en';

function t(key) {
  return (translations[currentLang]?.[key]) || (translations['en']?.[key]) || key;
}

function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('ecotrack_lang', lang);
  applyTranslations();
}

function applyTranslations() {
  const lang = currentLang;

  // 1. All data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = translations[lang]?.[el.getAttribute('data-i18n')];
    if (val) el.textContent = val;
  });

  // 2. Log Data button (has a <span> inside, handle carefully)
  const logBtn = document.querySelector('.btn-add-data');
  if (logBtn) logBtn.innerHTML = `<span>+</span> ${t('logData')}`;

  // 3. Topbar Logout button
  document.querySelectorAll('.btn-ghost').forEach(btn => {
    if (btn.getAttribute('onclick') === 'logout()') {
      btn.textContent = t('logoutBtn');
    }
  });

  // 4. REAL-TIME badge
  const badge = document.querySelector('.status-badge');
  if (badge) badge.textContent = `• ${t('realtime')}`;

  // 5. Update date locale
  const dateEl = document.getElementById('currentDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString(
      lang === 'hi' ? 'hi-IN' : 'en-US',
      { weekday: 'short', month: 'short', day: 'numeric' }
    );
  }

  // 6. Update active button styling
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const active = btn.dataset.lang === lang;
    btn.style.background = active ? 'var(--primary)' : 'rgba(255,255,255,0.05)';
    btn.style.color = active ? '#000' : '#fff';
    btn.style.fontWeight = active ? '700' : '400';
    btn.style.border = active ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)';
  });
}

// Apply immediately on DOM ready
document.addEventListener('DOMContentLoaded', applyTranslations);
