import { regions } from "@/app/lib/subregions";
import { Metadata } from "next";
import SubregionViewer from "@/app/components/subregionViewer";

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
    return (
        <SubregionViewer regionID={regionID} />
    )
}