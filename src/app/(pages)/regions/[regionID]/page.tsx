import { Suspense } from "react";
import { regions } from "@/app/lib/subregions";
import { Metadata } from "next";
import SubregionViewer from "@/app/components/subregionViewer";
// import { getShuffledReccsLite } from "@/app/lib/reccs";
import { getReccsLite } from "@/app/lib/reccs";

export async function generateStaticParams() {
    return regions.map(reg => ({
        regionID: reg.id,
    }));
}

export async function generateMetadata({ params }: { params: Promise<{ regionID: string }> }): Promise<Metadata> {
  const { regionID } = await params;
  const title = regionID.charAt(0).toUpperCase() + regionID.slice(1);
  return {
    title,
  };
}

export default async function RegionPage({ params }: { params: Promise<{ regionID: string }> }) {
    const { regionID } = await params;
    // const reccs = await getShuffledReccsLite(Math.floor(Date.now() / 86_400_000));
    const reccs = await getReccsLite();
    return (
        <Suspense>
            <SubregionViewer regionID={regionID} reccs={reccs} />
        </Suspense>
    )
}