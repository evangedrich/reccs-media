'use client';

import { useEffect, useRef } from "react";
import ScrollTop from "./scrollTop";

export default function StickyTitleBar({ title, children }: { title: string | undefined, children: React.ReactNode }) {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        const bar = barRef.current;
        const inner = innerRef.current;
        if (!sentinel || !bar || !inner) return;

        let raf = 0;
        const update = () => {
            raf = 0;
            // The wrapper pins at the same sticky line as Bar2. While scrolling freely
            // it tracks the sentinel (its natural position); the instant it pins, its
            // top freezes while the sentinel keeps rising past it. That gap is exactly
            // the moment Bar2 has hit its stick destination.
            const stuck = bar.getBoundingClientRect().top > sentinel.getBoundingClientRect().top + 0.5;
            inner.style.opacity = stuck ? '1' : '0';
            inner.style.pointerEvents = stuck ? 'auto' : 'none';
        };
        const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };

        update();
        window.addEventListener('scroll', schedule, { passive: true });
        // ResizeObserver catches header height changes (e.g. the widget opening)
        // even when the user isn't scrolling.
        const headerEl = document.body.firstElementChild as HTMLElement | null;
        const ro = new ResizeObserver(schedule);
        if (headerEl) ro.observe(headerEl);
        return () => {
            window.removeEventListener('scroll', schedule);
            ro.disconnect();
            if (raf) cancelAnimationFrame(raf);
        };
    }, []);

    return (
        <>
            <div>
                {children}
                <div ref={sentinelRef} aria-hidden="true" />
            </div>
            <div ref={barRef} className="sticky top-[calc(var(--header-h)+34px)] h-0 z-20 transition-[top]">
                <div ref={innerRef} style={{ opacity: 0, pointerEvents: 'none' }}
                    className="absolute -top-[34px] left-0 w-full h-[34px] border-b-2 border-solid border-[var(--color-front)] pl-4 pr-2 bg-[var(--color-back)] flex items-center justify-between overflow-hidden"
                >
                    <span className="font-black truncate">{title}</span>
                    <ScrollTop />
                </div>
            </div>
        </>
    );
}
