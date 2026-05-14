import { collections } from "@/app/lib/collections";
import CollectionShelf from "@/app/components/collectionShelf";
import { getReccs } from "@/app/lib/reccs";

export const dynamic = "force-dynamic";

export default async function CinemaPage() {
    const systemsCollections = collections.filter(collection => collection.type==="systems");
    const reccs = await getReccs();
    return (
        <CollectionShelf collections={systemsCollections} reccs={reccs} />
    )
}