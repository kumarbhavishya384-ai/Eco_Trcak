/* EcoTrack AI - Auto-logging via Geolocation */

async function startTripTracking() {
    if (!("geolocation" in navigator)) {
        showGlobalToast("Geolocation not supported on this device.");
        return;
    }

    showGlobalToast("Initializing Auto-Trip Detection... 🛰️");

    // Simulate detecting a trip after permission is granted
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        console.log(`Watching location: ${latitude}, ${longitude}`);

        // In a real app, we'd watch position and calculate distance.
        // For this demo, we'll simulate finding a 5km trip.
        setTimeout(() => {
            detectStoredTrip(5.2, 'metro');
        }, 5000);
    });
}

function detectStoredTrip(km, mode) {
    const confirmTrip = confirm(`EcoTrack detected a ${km}km trip via ${mode}. Would you like to log this to your footprint?`);
    if (confirmTrip) {
        // This would call the calculator logic to save
        showGlobalToast(`Logged ${km}km ${mode} trip automatically! 🌍`);
    }
}

// Add to sidebar or dashboard UI
function initAutoLogUI() {
    const container = document.querySelector('.sidebar-content');
    if (container) {
        const btn = document.createElement('div');
        btn.className = 'nav-item';
        btn.innerHTML = `
            <span class="nav-icon">🛰️</span>
            <span class="nav-text">Enable Auto-Log</span>
        `;
        btn.onclick = startTripTracking;
        container.appendChild(btn);
    }
}

document.addEventListener('DOMContentLoaded', initAutoLogUI);
