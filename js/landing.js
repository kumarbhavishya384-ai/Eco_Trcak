/* ===================================================
   EcoTrack AI – Landing Page JS (landing.js)
   =================================================== */

// ── Particle System ───────────────────────────────────
(function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const NUM_PARTICLES = 60;

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.radius = Math.random() * 2 + 0.5;
            this.alpha = Math.random() * 0.4 + 0.1;
            this.color = Math.random() > 0.5 ? '34,197,94' : '6,182,212';
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.reset();
            }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < NUM_PARTICLES; i++) {
        particles.push(new Particle());
    }

    // Draw connections
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(34,197,94,${0.08 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        drawConnections();
        requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
})();

// ── Counter animation ─────────────────────────────────
function animateCounter(el, target, suffix = '') {
    let start = 0;
    const duration = 2000;
    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);
        el.textContent = current.toLocaleString('en-IN') + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// Run counters on page load
window.addEventListener('load', () => {
    const statUsers = document.getElementById('stat-users');
    if (statUsers) animateCounter(statUsers, 12847);
});

// ── Scroll animations – Enhanced ─────────────────────────
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

// Select all elements with reveal class or original feature cards
document.querySelectorAll('.reveal, .feature-card, .step').forEach(el => {
    observer.observe(el);
});

// ── Navbar Scroll Style ──────────────────────────────
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.landing-nav');
    if (nav) {
        if (window.scrollY > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
    }
});

// ── Password Strength Logic ───────────────────────────
function updatePasswordStrength(val) {
    const bars = document.querySelectorAll('#passwordStrength .strength-bar');
    if (!bars.length) return;

    bars.forEach(b => b.className = 'strength-bar');

    if (!val) return;

    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    for (let i = 0; i < score; i++) {
        if (score <= 1) bars[i].classList.add('weak');
        else if (score <= 3) bars[i].classList.add('medium');
        else bars[i].classList.add('strong');
    }
}

// Redirect if already logged in
if (typeof getCurrentUser === 'function' && getCurrentUser()) {
    // window.location.href = 'dashboard.html';
}
