/* ═══════════════════════════════════════════════════════════
   FORUM_JS — ANIMATIONS & FX ENGINE (vanilla JS, zero deps)
   Typewriter · IntersectionObserver reveals · Ripple ·
   Star particles · Glass navbar · Generated avatars · Stats
   ═══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── Shared helpers (used by index.js / post.js templates) ── */

    // Deterministic hash from a string → number
    function hash(str) {
        let h = 0;
        for (let i = 0; i < String(str).length; i++) {
            h = (h << 5) - h + String(str).charCodeAt(i);
            h |= 0;
        }
        return Math.abs(h);
    }

    // Unique gradient pair per seed (post/user) → CSS custom props
    function gradientVars(seed) {
        const h1 = hash(seed) % 360;
        const h2 = (h1 + 70 + (hash(seed + 'x') % 90)) % 360;
        return `--grad-a:hsl(${h1},85%,62%);--grad-b:hsl(${h2},85%,60%);`;
    }

    // Neon avatar generated from a username
    function avatarHTML(username, small) {
        const name = String(username || '?');
        const h1 = hash(name) % 360;
        const h2 = (h1 + 80) % 360;
        const initial = name.trim().charAt(0).toUpperCase() || '?';
        return `<span class="avatar${small ? ' avatar-sm' : ''}" aria-hidden="true" ` +
            `style="background:linear-gradient(135deg,hsl(${h1},80%,55%),hsl(${h2},80%,50%));` +
            `box-shadow:0 0 14px hsla(${h1},80%,60%,.55)">${initial}</span>`;
    }

    // SVG icon set (no emoji icons)
    const ICONS = {
        like: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>',
        dislike: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>',
        comment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/></svg>',
        user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
    };

    // Futuristic loader markup
    function loaderHTML(label) {
        return `<div class="loading" role="status">
            <div class="orbit-spinner"><span></span><span></span><span></span></div>
            <span>${label || 'Chargement du flux…'}</span>
        </div>`;
    }

    // Expose to other scripts
    window.FX = { hash, gradientVars, avatarHTML, icon: (n) => ICONS[n] || '', loaderHTML };

    /* ── Navbar: blur background on scroll ── */

    const navbar = document.querySelector('.navbar');
    if (navbar) {
        const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 12);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ── Typewriter effect (hero) ── */

    const tw = document.getElementById('typewriter');
    if (tw) {
        const phrases = [
            'Partage tes idées avec la communauté.',
            'Débats, code, memes — tout passe par ici.',
            'Connecte-toi au flux. Publie. Vote. Recommence.',
            'Le savoir circule à la vitesse du neon.'
        ];
        if (reducedMotion) {
            tw.textContent = phrases[0];
        } else {
            let pi = 0, ci = 0, deleting = false;
            (function tick() {
                const phrase = phrases[pi];
                ci += deleting ? -1 : 1;
                tw.textContent = phrase.slice(0, ci);
                let delay = deleting ? 26 : 46 + Math.random() * 40;
                if (!deleting && ci === phrase.length) { delay = 2200; deleting = true; }
                else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; delay = 420; }
                setTimeout(tick, delay);
            })();
        }
    }

    /* ── IntersectionObserver: entry reveals ── */

    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    function observeReveals(root) {
        (root || document).querySelectorAll('.reveal:not(.in-view), .post-card:not(.in-view), .comment:not(.in-view)')
            .forEach((el, i) => {
                el.style.transitionDelay = Math.min(i * 65, 450) + 'ms';
                io.observe(el);
            });
    }
    observeReveals(document);

    // Posts/comments are injected via innerHTML → watch the DOM
    const mo = new MutationObserver(() => observeReveals(document));
    mo.observe(document.body, { childList: true, subtree: true });

    /* ── Ripple effect on buttons ── */

    document.addEventListener('pointerdown', (e) => {
        const btn = e.target.closest('.btn, .vote-btn, .fab, .filter-link');
        if (!btn || reducedMotion) return;
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.1;
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 650);
    });

    /* ── Star particle burst on like/dislike ── */

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.vote-btn');
        if (!btn || reducedMotion) return;
        const isLike = btn.className.includes('like') && !btn.className.includes('dislike')
            || (btn.getAttribute('onclick') || '').includes("'like'");
        const color = isLike ? '#2dd4bf' : '#fb7185';
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const glyphs = ['✦', '✧', '★', '·', '+'];
        for (let i = 0; i < 9; i++) {
            const star = document.createElement('span');
            star.className = 'star-particle';
            star.textContent = glyphs[i % glyphs.length];
            const angle = (Math.PI * 2 * i) / 9 + Math.random() * 0.6;
            const dist = 36 + Math.random() * 42;
            star.style.left = cx + 'px';
            star.style.top = cy + 'px';
            star.style.color = color;
            star.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
            star.style.setProperty('--ty', Math.sin(angle) * dist - 18 + 'px');
            star.style.setProperty('--rot', (Math.random() * 220 - 110) + 'deg');
            document.body.appendChild(star);
            setTimeout(() => star.remove(), 850);
        }
    });

    /* ── Animated counters: sidebar stats ── */

    function countUp(el, target, suffix) {
        if (!el) return;
        if (reducedMotion) { el.textContent = target + (suffix || ''); return; }
        const start = performance.now();
        const dur = 1100;
        (function frame(now) {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + (suffix || '');
            if (p < 1) requestAnimationFrame(frame);
        })(start);
    }

    // index.js dispatches this after each posts load
    document.addEventListener('posts:loaded', (e) => {
        const posts = (e.detail && e.detail.posts) || [];
        const authors = new Set(posts.map((p) => p.username));
        const seed = hash('forum-js-day-' + new Date().toDateString());
        countUp(document.getElementById('statPosts'), posts.length);
        countUp(document.getElementById('statUsers'), Math.max(authors.size, authors.size + (seed % 14) + 6));
        countUp(document.getElementById('statOnline'), (seed % 9) + 3);
        countUp(document.getElementById('statVotes'), posts.reduce((s, p) => s + (p.likes || 0) + (p.dislikes || 0), 0));
    });
})();
