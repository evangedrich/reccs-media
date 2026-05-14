import { collections } from "@/app/lib/collections";
import CollectionShelf from "@/app/components/collectionShelf";
import { getReccs } from "@/app/lib/reccs";

export const dynamic = "force-dynamic";

export default async function LiteraturePage() {
    const literatureCollections = collections.filter(collection => collection.type==="literature");
    const reccs = await getReccs();
    return (
        <CollectionShelf collections={literatureCollections} reccs={reccs} />
    )
}