import { collections } from "@/app/lib/collections";
import CollectionShelf from "@/app/components/collectionShelf";

export default function CinemaPage() {
    const theatreCollections = collections.filter(collection => collection.type==="theatre");
    return (
        <CollectionShelf collections={theatreCollections} />
    )
}