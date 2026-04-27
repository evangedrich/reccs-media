'use client';

import { useRef, useState } from "react";

const externalLinkClass = "text-[var(--color-highlight)] underline";

const getEmbed = (url: string): React.ReactNode => {
    if (!url || url.length === 0) return <>No media found.</>;
    if (url.substring(8, 16) === "youtu.be") {
        const key = url.substring(17);
        const params = url.includes("?")
            ? "&cc_lang_pref=en&cc_load_policy=1&playsinline=0"
            : "?cc_lang_pref=en&cc_load_policy=1&playsinline=0";
        return (
            <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${key}${params}`}
                title="Video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
            />
        );
    }
    if (url.includes("vimeo")) {
        const key = url.slice(-8);
        return (
            <iframe
                className="w-full h-full"
                src={`https://player.vimeo.com/video/${key}?badge=0&autopause=0&player_id=0&app_id=58479`}
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
            />
        );
    }
    if (url.substring(8, 14) === "aparat") {
        const key = url.substring(21);
        return (
            <iframe
                className="w-full h-full"
                src={`https://www.aparat.com/video/video/embed/videohash/${key}/vt/frame`}
                allowFullScreen
            />
        );
    }
    if (url.substring(12, 16) === "ictv") {
        return (
            <>
                This video is from ICTV Australia; click{" "}
                <a href={url} target="_blank" rel="noreferrer" className={externalLinkClass}>here</a>{" "}
                to watch.
            </>
        );
    }
    if (url.substring(12, 17) === "isuma") {
        const key = url.substring(26);
        return (
            <iframe
                className="w-full h-full"
                src={`http://www.isuma.tv/node/${key}?isuma5embed`}
                allowFullScreen
            />
        );
    }
    if (url.includes("archive.org")) {
        const key = url.substring(28);
        return (
            <iframe
                className="w-full h-full"
                src={`https://archive.org/embed/${key}`}
                allowFullScreen
            />
        );
    }
    return (
        <>
            This media cannot be embedded; click{" "}
            <a href={url} target="_blank" rel="noreferrer" className={externalLinkClass}>here</a>{" "}
            to view.
        </>
    );
};

export function PrepVideo({ vid }: { vid: string | string[] }) {
    const seriesRef = useRef<HTMLDivElement>(null);
    const urls = Array.isArray(vid) ? vid : [vid];
    const [currIndex, setCurrIndex] = useState(0);

    const scroll = (dir: -1 | 1) => {
        const el = seriesRef.current;
        if (!el) return;
        const firstIframe = el.querySelector("iframe");
        const entryWidth = firstIframe ? firstIframe.offsetWidth : el.clientWidth;
        if (entryWidth === 0) return;
        const iframes = el.querySelectorAll("iframe");
        const prev = iframes[currIndex];
        if (prev) prev.src = prev.src;
        el.scrollBy({ left: dir * entryWidth, behavior: "smooth" });
        setTimeout(() => {
            const newIndex = Math.max(0, Math.min(iframes.length - 1, Math.round(el.scrollLeft / entryWidth)));
            setCurrIndex(newIndex);
            const target = iframes[newIndex];
            if (target) target.src = target.src;
        }, 500);
    };

    if (urls.length === 1) {
        return <div className="w-full aspect-video border-2 bg-[var(--color-mid)]">{getEmbed(urls[0])}</div>;
    }

    return (
        <div className="relative border-2 bg-[var(--color-mid)]">
            <div
                ref={seriesRef}
                className="flex overflow-x-scroll snap-x snap-mandatory scroll-smooth"
            >
                {urls.map((url, i) => (
                    <div
                        key={`vid${i}`}
                        className="flex-shrink-0 w-full aspect-video snap-start"
                    >
                        {getEmbed(url)}
                    </div>
                ))}
            </div>
            {currIndex > 0 && (
                <button
                    onClick={() => scroll(-1)}
                    aria-label="Previous video"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 text-xl flex items-center justify-center bg-[var(--color-back)] border-2 border-l-0 border-[var(--color-front)] cursor-pointer active:opacity-85"
                >
                    <span className="w-full h-full hover:bg-[var(--color-mid)] flex items-center justify-center">&lt;</span>
                </button>
            )}
            {currIndex < urls.length - 1 && (
                <button
                    onClick={() => scroll(1)}
                    aria-label="Next video"
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 text-xl flex items-center justify-center bg-[var(--color-back)] border-2 border-r-0 border-[var(--color-front)] cursor-pointer active:opacity-85"
                >
                    <span className="w-full h-full hover:bg-[var(--color-mid)] flex items-center justify-center">&gt;</span>
                </button>
            )}
        </div>
    );
}
