'use client';

import { useEffect, useRef } from "react";
import ScrollTop from "./scrollTop";

const BAR_H = 34;

export default function StickyTitleBar({ title, children }: { title: string | undefined, children: React.ReactNode }) {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const triggerY = useRef<number | null>(null);

    useEffect(() => {
        const el = sentinelRef.current;
        const bar = barRef.current;
        if (!el || !bar) return;

        const headerEl = document.body.firstElementChild as HTMLElement | null;
        const headerH = (headerEl?.clientHeight ?? 88) + 124;

        const apply = (h: number) => {
            bar.style.height = `${h}px`;
            bar.style.borderBottomWidth = h > 0 ? '2px' : '0px';
            bar.style.pointerEvents = h > 0 ? 'auto' : 'none';
            document.documentElement.style.setProperty('--title-bar-h', `${h}px`);
        };

        const onScroll = () => {
            if (triggerY.current === null) return;
            apply(Math.min(BAR_H, Math.max(0, window.scrollY - triggerY.current)));
        };

        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) {
                triggerY.current = window.scrollY;
                onScroll();
            } else {
                triggerY.current = null;
                apply(0);
            }
        }, { threshold: 0, rootMargin: `-${headerH}px 0px 0px 0px` });

        observer.observe(el);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', onScroll);
            document.documentElement.style.setProperty('--title-bar-h', '0px');
        };
    }, []);

    return (
        <>
            <div>
                {children}
                <div ref={sentinelRef} aria-hidden="true" />
            </div>
            <div ref={barRef} style={{ height: 0, borderBottomWidth: 0, pointerEvents: 'none' }}
                className="border-solid border-[var(--color-front)] pl-4 pr-2 sticky top-[var(--header-h)] bg-[var(--color-back)] flex items-center justify-between overflow-hidden transition-[top]">
                <span className="font-black truncate">{title}</span>
                <ScrollTop />
            </div>
        </>
    );
}
