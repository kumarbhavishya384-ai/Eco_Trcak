/* EcoTrack AI - i18n Management */
const I18N_KEY = 'ecotrack_lang';

async function initI18n() {
    const lang = localStorage.getItem(I18N_KEY) || 'en';
    const response = await fetch(`./locales/${lang}.json`);
    const translations = await response.json();

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[key]) {
            el.textContent = translations[key];
        }
    });
}

function switchLanguage(lang) {
    localStorage.setItem(I18N_KEY, lang);
    location.reload();
}

document.addEventListener('DOMContentLoaded', initI18n);
