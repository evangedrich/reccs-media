import { collections } from "@/app/lib/collections";
import CollectionShelf from "@/app/components/collectionShelf";
import { getReccs } from "@/app/lib/reccs";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: 'Theatre',
};

export default async function CinemaPage() {
    const theatreCollections = collections.filter(collection => collection.type==="theatre");
    const reccs = await getReccs();
    return (
        <CollectionShelf collections={theatreCollections} reccs={reccs} />
    )
}