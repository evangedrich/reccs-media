import { collections } from "@/app/lib/collections";
import CollectionShelf from "@/app/components/collectionShelf";
import { getReccs } from "@/app/lib/reccs";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: 'Systems',
};

export default async function CinemaPage() {
    const systemsCollections = collections.filter(collection => collection.type==="systems");
    const reccs = await getReccs();
    return (
        <CollectionShelf collections={systemsCollections} reccs={reccs} />
    )
}