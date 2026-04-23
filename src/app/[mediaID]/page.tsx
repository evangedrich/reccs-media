import { reccsData } from "@/app/lib/old-media";
import Image from "next/image";

export async function generateStaticParams() {
    return reccsData.flat().map(item => ({
        mediaID: item.label,
    }));
}

export default async function MovieDetailView({ params }: { params: Promise<{ mediaID: string }> }) {
    const { mediaID } = await params;
    const entry = reccsData.flat().find(item => item.label===mediaID);
    return (
        <div className="">
            <Image src={`/posters/${entry?.label}.jpg`} alt="Media Image" width="300" height="400" />
            <p>{entry?.info}</p><br/>
            <p>{entry?.excerpt}</p>
        </div>
    )
}