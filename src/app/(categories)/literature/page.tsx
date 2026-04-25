import { collections } from "@/app/lib/collections";
import CollectionShelf from "@/app/components/collectionShelf";

export default function LiteraturePage() {
    const literatureCollections = collections.filter(collection => collection.type==="literature");
    return (
        <CollectionShelf collections={literatureCollections} />
    )
}