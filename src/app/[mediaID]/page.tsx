import { reccsData } from "@/app/lib/local-media";
import Image from "next/image";
import { notoEmoji } from "../fonts/fonts";
import StickyTitleBar from "../components/stickyTitleBar";
import MediaContent from "../components/mediaContent";
import { getTitle, getByline } from "../functions/text";

export async function generateStaticParams() {
    return reccsData.flat().map(item => ({
        mediaID: item.label,
    }));
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
    const entry = reccsData.flat().find(item => item.label===mediaID);
    const title = getTitle(entry);
    const byline = getByline(entry);
    return (
        <div className="w-full h-full flex flex-wrap border-b-2 grow-1">
            <div className="basis-full sm:basis-1/3 px-4 pt-4 sm:pb-4 sm:border-r-2 border-solid border-[var(--color-front)] flex flex-col items-end">
                <Image src={`/posters/${entry?.label}.jpg`} alt="Media Image" width="300" height="400" className="w-full sm:w-[300px] h-auto sm:sticky sm:top-[calc(var(--header-h)+1rem)] transition-[top]" loading="eager" />
            </div>
            <div className="basis-full sm:basis-2/3 min-w-0">
                <StickyTitleBar title={title}>
                    <div className="p-4 border-b-2 border-solid border-[var(--color-front)]">
                        <h1 className="sm:text-6xl text-4xl font-black leading-none hyphens-auto break-words mb-2 max-w-[800px]" lang="en">
                            {title}
                        </h1>
                        <h2 className="leading-none text-2xl mb-4">{entry?.title?.transliteration+" · "+entry?.title?.translation}</h2>
                        <h2 className={`${byline ? "" : "hidden"} leading-none text-2xl mb-4`}>{byline}</h2>
                        <ul className="sm:flex gap-x-6 gap-y-1 flex-wrap">
                            {Object.keys(entry?.group).map(key => (
                                <li key={`${key}Text`}>
                                    <span className={`${notoEmoji.className} ${key==="location" ? "" : "mr-1"}`}>{groupIcons[key]}</span>
                                    {entry?.group[key]}
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
