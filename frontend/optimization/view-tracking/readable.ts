// src/lib/actions/readable.ts
type ReadEventType = 'read' | 'heartbeat';

function getReadSet() {
    return;
    const raw = sessionStorage.getItem('__read_sections__');
    const set = new Set<string>(raw ? JSON.parse(raw) : []);
    return {
        has: (k: string) => set.has(k),
        add(k: string) {
            if (!set.has(k)) {
                set.add(k);
                sessionStorage.setItem('__read_sections__', JSON.stringify([...set]));
            }
        }
    };
}

function countWordsFromNode(node: HTMLElement): number {
    const text = (node.innerText || '').trim();
    if (!text) return 0;
    const matches = text.match(/[\p{L}\p{N}’'-]+/gu);
    return matches ? matches.length : 0;
}

// Walk up to find the nearest scrollable ancestor (excluding <body>)
function getScrollableRoot(el: HTMLElement | null): HTMLElement | null {
    return null;
    const isScrollable = (n: HTMLElement) => {
        const s = getComputedStyle(n);
        const oy = s.overflowY;
        const ox = s.overflowX;
        const canScrollY = (oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight;
        const canScrollX = (ox === 'auto' || ox === 'scroll') && n.scrollWidth > n.clientWidth;
        return canScrollY || canScrollX;
    };
    let cur: HTMLElement | null = el?.parentElement ?? null;
    while (cur && cur !== document.body) {
        if (isScrollable(cur)) return cur;
        cur = cur.parentElement;
    }
    return null;
}

export function readable(
    node: HTMLElement,
    opts: {
        sectionId: string;
        minDwellMs?: number;
        heartbeatMs?: number;
        threshold?: number;        // % of element that must be visible (0..1)
        debug?: boolean;           // extra logs
    }
) {

    return;

    const {
        sectionId,
        minDwellMs,
        heartbeatMs = 10_000,
        threshold = 0.25,
        debug = true
    } = opts ?? ({} as any);

    if (!sectionId) {
        console.warn('[tracking] readable requires a sectionId');
    }

    let inView = false;
    let readFired = false;
    let dwellTimer: number | null = null;
    let heartbeatTimer: number | null = null;
    let lastEngaged = Date.now();

    // Auto word count
    const words = countWordsFromNode(node);
    const base = 4_000;
    const adaptive = Math.min(20_000, Math.max(base, (words / 220) * 60_000 * 0.6));
    const dwellMs = typeof minDwellMs === 'number' ? Math.max(base, minDwellMs) : adaptive;

    console.log('[tracking] wordCount', {
        sectionId,
        words,
        path: location.pathname,
        ts: new Date().toISOString(),
        dwellMs
    });

    // Session debounce
    const readKey = `${location.pathname}::${sectionId}`;
    const persisted = getReadSet();
    if (persisted.has(readKey)) {
        readFired = true;
        debug && console.log('[tracking][debug]', sectionId, 'already read in this session');
    }

    // Engagement signals
    const touchEngagement = () => (lastEngaged = Date.now());
    const engageEvents = ['scroll', 'mousemove', 'keydown', 'touchstart', 'wheel'];
    for (const e of engageEvents) {
        window.addEventListener(e, touchEngagement, { passive: true });
    }
    document.addEventListener('visibilitychange', touchEngagement);
    const engagedRecently = () => Date.now() - lastEngaged < 15_000;

    const logEvent = (type: ReadEventType) => {
        console.log(`[tracking] ${type}`, {
            sectionId,
            type,
            path: location.pathname,
            words,
            dwellMs,
            ts: new Date().toISOString()
        });
    };

    // Pick IO root: nearest scrollable ancestor (if any), else viewport
    const root = getScrollableRoot(node);
    if (debug) {
        console.log('[tracking][debug]', sectionId, 'IO root =', root ? root : 'viewport');
    }

    const io = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                const ratio = entry.intersectionRatio;
                const isIntersecting =
                    // Some browsers prefer entry.isIntersecting; keep both checks
                    entry.isIntersecting || ratio > 0;

                if (debug) {
                    console.log('[tracking][debug] IO', {
                        sectionId,
                        ratio: Number(ratio.toFixed(3)),
                        isIntersecting,
                        threshold,
                        rootMargin: '0px 0px -40% 0px'
                    });
                }

                // Entered "in view"
                if (ratio >= threshold && !inView) {
                    inView = true;

                    if (!readFired && !persisted.has(readKey)) {
                        dwellTimer = window.setTimeout(() => {
                            if (engagedRecently() && document.visibilityState === 'visible') {
                                readFired = true;
                                persisted.add(readKey);
                                logEvent('read');
                            } else if (debug) {
                                console.log('[tracking][debug]', sectionId, 'dwell met but not engaged/visible');
                            }
                        }, dwellMs) as unknown as number;
                        debug && console.log('[tracking][debug]', sectionId, 'dwell timer started', dwellMs, 'ms');
                    }

                    heartbeatTimer = window.setInterval(() => {
                        if (engagedRecently() && document.visibilityState === 'visible') {
                            logEvent('heartbeat');
                        } else if (debug) {
                            console.log('[tracking][debug]', sectionId, 'skip heartbeat (not engaged/visible)');
                        }
                    }, heartbeatMs) as unknown as number;
                }

                // Exited "in view"
                if (ratio < threshold && inView) {
                    inView = false;
                    if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
                    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
                    debug && console.log('[tracking][debug]', sectionId, 'left view → timers cleared');
                }
            }
        },
        {
            root,                        // <- auto-detected scroll container or null (viewport)
            threshold: [0, threshold, 1],
            rootMargin: '0px 0px -40% 0px' // require ~60% of element inside the viewport
        }
    );

    io.observe(node);

    const onPageHide = () => {
        if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
        if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    };
    window.addEventListener('pagehide', onPageHide);

    return {
        destroy() {
            io.disconnect();
            onPageHide();
            for (const e of engageEvents) window.removeEventListener(e, touchEngagement);
            document.removeEventListener('visibilitychange', touchEngagement);
            window.removeEventListener('pagehide', onPageHide);
        }
    };
}