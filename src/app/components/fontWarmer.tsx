"use client";

import { useState, useEffect, useMemo } from "react";
import type { ReccLite } from "../types/recc";
import { getTitle, checkFont } from "../functions/text";

// Pulls every writing system's font into cache shortly after the page settles.
//
// Picking a subregion is a client-side state change, not a navigation: the entry cards
// paint on the next frame (~7ms) but the font each title needs is only discovered then,
// so it arrived ~90ms later and every non-Latin title flashed in the fallback first.
// There is no navigation to hang a preload off, so the fonts have to be pulled ahead of
// time. Clicking a card through to its entry page has the same problem one step later —
// entry headers are font-black where cards are font-semibold, a different file again.
//
// Rendering one off-screen sample per script at BOTH weights covers both cases: nothing
// is fetched when a subregion is picked, and nothing when a card is clicked.
//
// Three things this depends on, each learned the hard way:
//   - the spans must be real laid-out text; `display: none` does not trigger a fetch
//   - the weights must match what the pages actually render, since weight is part of what
//     identifies a face — warming at the default 400 fetches the wrong file
//   - it must wait for `load` and then for idle, so ~490KB of fonts never competes with
//     first paint or the poster images
export default function FontWarmer({ reccs }: { reccs: ReccLite[] }) {
    const [warm, setWarm] = useState(false);
    useEffect(() => {
        let idle: number | undefined;
        const schedule = () => {
            const ric = (window as typeof window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
            idle = ric ? ric(() => setWarm(true), { timeout: 3000 }) : window.setTimeout(() => setWarm(true), 1200);
        };
        if (document.readyState === "complete") schedule();
        else { window.addEventListener("load", schedule); return () => window.removeEventListener("load", schedule); }
        return () => { if (idle !== undefined) window.clearTimeout(idle); };
    }, []);

    // one title per writing system — 14 spans rather than one per entry
    const samples = useMemo(() => {
        const seen: Record<string, string> = {};
        for (const itm of reccs) {
            const title = getTitle(itm);
            const cls = checkFont(title);            // "" is the Latin/JuliaMono case
            if (!(cls in seen)) seen[cls] = title;
        }
        return Object.entries(seen);
    }, [reccs]);

    if (!warm) return null;
    return (
        <div aria-hidden="true" className="pointer-events-none absolute w-0 h-0 overflow-hidden opacity-0">
            {samples.map(([cls, title]) => (
                <span key={`warm6_${cls || "latin"}`} className={`text-xs font-semibold ${cls}`}>{title}</span>
            ))}
            {samples.map(([cls, title]) => (
                <span key={`warm9_${cls || "latin"}`} className={`text-xs font-black ${cls}`}>{title}</span>
            ))}
            {/* the card's collection label is font-bold, a different JuliaMono face again */}
            <span className="text-[0.55rem] font-bold uppercase">Reccs</span>
        </div>
    );
}
