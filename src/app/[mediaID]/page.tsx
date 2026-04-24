import { reccsData } from "@/app/lib/local-media";
import Image from "next/image";
import { notoEmoji } from "../fonts/fonts";
import StickyTitleBar from "../components/stickyTitleBar";
import ScrollTop from "../components/scrollTop";

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
    return (
        <div className="w-full h-full flex flex-wrap border-b-2">
            <div className="basis-full sm:basis-1/3 px-4 pt-4 sm:border-r-2 border-solid border-[var(--color-front)] flex flex-col items-end">
                <Image src={`/posters/${entry?.label}.jpg`} alt="Media Image" width="300" height="400" className="w-full sm:w-[300px] sm:sticky sm:top-[calc(var(--header-h)+1rem)] transition-all" />
            </div>
            <div className="basis-full sm:basis-2/3 min-w-0">
                <StickyTitleBar title={entry?.title?.original ?? entry?.title ?? entry?.genre?.original}>
                    <div className="p-4 border-b-2 border-solid border-[var(--color-front)]">
                        <h1 className="sm:text-6xl text-4xl font-black leading-none hyphens-auto break-words mb-2 max-w-[800px]" lang="en">
                            {entry?.title?.original ?? entry?.title ?? entry?.genre.original}
                        </h1>
                        <h2 className="leading-none text-2xl mb-4">{entry?.title?.translation}</h2>
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
                <div className="h-[34px] border-b-2 border-solid border-[var(--color-front)] pl-3 pr-1 sticky top-[calc(var(--header-h)+var(--title-bar-h))] bg-[var(--color-back)] flex items-center justify-between transition-all">
                    <ul className="flex gap-3">
                        <li className="cursor-pointer px-1 hover:bg-[var(--color-front)] hover:text-[var(--color-back)] font-bold italic hover:ring-b-2">info</li>
                        <li className="cursor-pointer px-1 hover:bg-[var(--color-front)] hover:text-[var(--color-back)]">excerpt</li>
                    </ul>
                    <ScrollTop />
                </div>
                <div className="p-4 max-w-[800px]">
                    <p>{entry?.info}</p><br/>
                    <p>{entry?.excerpt}</p>
                </div>
            </div>
        </div>
    )
}
