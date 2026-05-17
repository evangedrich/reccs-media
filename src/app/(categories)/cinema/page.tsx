import { collections } from "@/app/lib/collections";
import CollectionShelf from "@/app/components/collectionShelf";
import { getReccs } from "@/app/lib/reccs";
import { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: 'Cinema',
};

export default async function CinemaPage() {
    const cinemaCollections = collections.filter(collection => collection.type==="cinema");
    const reccs = await getReccs();
    return (
        <CollectionShelf collections={cinemaCollections} reccs={reccs} />
    )
}