// src/lib/actions/readable.ts
type ReadEventType = 'read' | 'heartbeat';

function getReadSet() {
    // Persist across SPA navigations & reloads for the current browser session
    const raw = sessionStorage.getItem('__read_sections__');
    const set = new Set<string>(raw ? JSON.parse(raw) : []);
    return {
        has(key: string) { return set.has(key); },
        add(key: string) {
            if (!set.has(key)) {
                set.add(key);
                sessionStorage.setItem('__read_sections__', JSON.stringify([...set]));
            }
        }
    };
}

function countWordsFromNode(node: HTMLElement): number {
    // innerText approximates *visible* text (ignores display:none, etc.)
    const text = (node.innerText || '').trim();
    if (!text) return 0;
    // Count tokens that look like words (handles unicode letters & numbers)
    const matches = text.match(/[\p{L}\p{N}’'-]+/gu);
    return matches ? matches.length : 0;
}

export function readable(
    node: HTMLElement,
    opts: {
        sectionId: string;
        /**
         * Optional: override minimum dwell (ms). If omitted, we compute:
         * max(4000, 0.6 * (words/220 wpm) * 60_000), capped at 20_000.
         */
        minDwellMs?: number;
        /**
         * Optional: heartbeat interval (ms). Default 10_000.
         */
        heartbeatMs?: number;
        /**
         * Optional: intersection threshold to consider "in view". Default 0.5.
         */
        threshold?: number;
    } = { sectionId: '' }
) {
    const { sectionId, minDwellMs, heartbeatMs = 10_000, threshold = 0.5 } = opts;
    if (!sectionId) {
        console.warn('[tracking] readable action requires a sectionId');
    }

    let inView = false;
    let readFired = false; // in-memory guard for this component instance
    let dwellTimer: number | null = null;
    let heartbeatTimer: number | null = null;
    let lastEngaged = Date.now();

    // Compute words automatically from visible text
    const words = countWordsFromNode(node);
    console.log('[tracking] wordCount', {
        sectionId,
        words,
        path: location.pathname,
        ts: new Date().toISOString()
    });

    // Adaptive dwell based on words
    const base = 4_000;
    const adaptive = Math.min(20_000, Math.max(base, (words / 220) * 60_000 * 0.6));
    const dwellMs = typeof minDwellMs === 'number' ? Math.max(base, minDwellMs) : adaptive;

    const readKey = `${location.pathname}::${sectionId}`;
    const persisted = getReadSet();

    // If we've already recorded this section in this session, keep readFired true.
    if (persisted.has(readKey)) {
        readFired = true;
    }

    // Engagement tracking (updates timestamp on user actions)
    const touchEngagement = () => (lastEngaged = Date.now());
    const engageEvents = ['scroll', 'mousemove', 'keydown', 'touchstart', 'wheel'];
    for (const e of engageEvents) {
        window.addEventListener(e, touchEngagement, { passive: true });
    }
    document.addEventListener('visibilitychange', touchEngagement);

    const engagedRecently = () => Date.now() - lastEngaged < 15_000;

    function logEvent(type: ReadEventType) {
        console.log(`[tracking] ${type}`, {
            sectionId,
            type,
            path: location.pathname,
            words,
            dwellMs,
            ts: new Date().toISOString()
        });
    }

    const io = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                const ratio = entry.intersectionRatio;

                if (ratio >= threshold && !inView) {
                    inView = true;

                    // Start dwell timer that may trigger the one-time "read"
                    if (!readFired && !persisted.has(readKey)) {
                        dwellTimer = window.setTimeout(() => {
                            if (engagedRecently() && document.visibilityState === 'visible') {
                                readFired = true;
                                persisted.add(readKey); // debounce across the session
                                logEvent('read');
                            }
                        }, dwellMs) as unknown as number;
                    }

                    // Start heartbeat while visible & engaged
                    heartbeatTimer = window.setInterval(() => {
                        if (engagedRecently() && document.visibilityState === 'visible') {
                            logEvent('heartbeat');
                        }
                    }, heartbeatMs) as unknown as number;
                }

                if (ratio < threshold && inView) {
                    inView = false;
                    if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
                    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
                }
            }
        },
        { threshold: [0, threshold, 1] }
    );

    io.observe(node);

    // Clean up on page hide and destroy
    const onPageHide = () => {
        if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
        if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    };
    window.addEventListener('pagehide', onPageHide);

    return {
        update(newOpts: typeof opts) {
            // Optional: allow live tuning of threshold/heartbeat via binding
            // (not strictly necessary for basic usage)
        },
        destroy() {
            io.disconnect();
            onPageHide();
            for (const e of engageEvents) {
                window.removeEventListener(e, touchEngagement);
            }
            document.removeEventListener('visibilitychange', touchEngagement);
            window.removeEventListener('pagehide', onPageHide);
        }
    };
}