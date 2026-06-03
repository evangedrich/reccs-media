import { getReccById } from "@/app/lib/reccs";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import { notoEmoji } from "../fonts/fonts";
import StickyTitleBar from "../components/stickyTitleBar";
import MediaContent from "../components/mediaContent";
import { getTitle, getByline, isMongol } from "../functions/text";
import { posterUrl } from "../lib/images";

export const dynamic = "force-dynamic";
export async function generateMetadata(
    { params }: { params: Promise<{ mediaID: string }> }
): Promise<Metadata> {
    const { mediaID } = await params;
    const entry = await getReccById(mediaID);
    if (!entry) return {};
    return {
        title: getTitle(entry),
    };
}

const groupIcons: { people: string, language: string, location: string, country: string, religion: string, } = {
    people: "👥",
    language: "🗣︎",
    location: "📍",
    country: "🌐",
    religion: "✨",
};

export default async function DetailPage({ params }: { params: Promise<{ mediaID: string }> }) {
    const { mediaID } = await params;
    const entry = await getReccById(mediaID);
    if (!entry) notFound();
    const title = getTitle(entry);
    const transliteration = getTitle(entry,"transliteration");
    const translation = getTitle(entry,"translation");
    const byline = getByline(entry);
    const sortedGroup = entry?.group.people ? { people: entry?.group.people, ...entry?.group } : entry?.group;
    return (
        <div className="w-full h-full flex flex-wrap border-b-2 grow-1">
            <div className="basis-full sm:basis-1/3 px-4 pt-4 sm:pb-4 sm:border-r-2 border-solid border-[var(--color-front)] flex flex-col items-end">
                <Image src={posterUrl(entry!.id)} alt="Media Image" width="300" height="400" className="w-full sm:w-[300px] h-auto sm:sticky sm:top-[calc(var(--header-h)+1rem)] transition-[top] aspect-3/4 bg-[var(--color-mid)]" priority unoptimized />
            </div>
            <div className="basis-full sm:basis-2/3 min-w-0">
                <StickyTitleBar title={title}>
                    <div className="p-4 border-b-2 border-solid border-[var(--color-front)]">
                        <h1 className={`sm:text-6xl text-4xl font-black leading-none hyphens-auto break-words mb-2 max-w-[800px] ${isMongol(title) ? "[writing-mode:vertical-rl] h-fit" : ""}`} lang="en">
                            {isMongol(title) ? title.split(/\s+/).map((w: string, i: number) => <span key={i} className="block">{w}</span>) : title}
                        </h1>
                        <h2 className={`${(transliteration || translation) ? "" : "hidden"} leading-none text-2xl mb-4 opacity-50`}>
                            {(transliteration && translation)
                            ? <span>{`${transliteration} (${translation})`}</span>
                            : (transliteration || translation)
                            ? <span>{translation ? translation : transliteration}</span>
                            : <></>}
                        </h2>
                        <h2 className={`${(byline) ? "" : "hidden"} leading-none text-xl mb-4`}>{byline}</h2>
                        <ul className="sm:flex gap-x-6 gap-y-1 flex-wrap">
                            {(Object.keys(sortedGroup ?? {}) as Array<keyof typeof groupIcons>).map(key => (
                                <li key={`${key}Text`}>
                                    <span className={`${notoEmoji.className} ${key==="location" ? "sm:mr-0" : ""} mr-1 font-bold`}>{groupIcons[key]}</span>
                                    {sortedGroup[key as keyof typeof entry.group]}
                                </li>
                            ))}
                        </ul>
                    </div>
                </StickyTitleBar>
                <MediaContent entry={entry} />
            </div>
        </div>
    )
}
