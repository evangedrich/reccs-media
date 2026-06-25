import { collections } from "@/app/lib/collections";
import CollectionShelf from "@/app/components/collectionShelf";
import { getShuffledReccs } from "@/app/lib/reccs";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: 'Theatre',
};

export default async function CinemaPage() {
    const theatreCollections = collections.filter(collection => collection.type==="theatre");
    const reccs = await getShuffledReccs(Math.floor(Date.now() / 86_400_000));
    return (
        <CollectionShelf collections={theatreCollections} reccs={reccs} />
    )
}