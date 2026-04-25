import { collections } from "@/app/lib/collections";
import CollectionShelf from "@/app/components/collectionShelf";

export default function CinemaPage() {
    const cinemaCollections = collections.filter(collection => collection.type==="cinema");
    return (
        <CollectionShelf collections={cinemaCollections} />
    )
}