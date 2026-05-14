import { collections } from "@/app/lib/collections";
import CollectionShelf from "@/app/components/collectionShelf";
import { getReccs } from "@/app/lib/reccs";

export const dynamic = "force-dynamic";

export default async function CinemaPage() {
    const theatreCollections = collections.filter(collection => collection.type==="theatre");
    const reccs = await getReccs();
    return (
        <CollectionShelf collections={theatreCollections} reccs={reccs} />
    )
}