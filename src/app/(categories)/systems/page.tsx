import { collections } from "@/app/lib/collections";
import CollectionShelf from "@/app/components/collectionShelf";

export default function CinemaPage() {
    const systemsCollections = collections.filter(collection => collection.type==="systems");
    return (
        <CollectionShelf collections={systemsCollections} />
    )
}