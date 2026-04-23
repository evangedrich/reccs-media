import { collections } from "@/app/lib/collections";

export async function generateStaticParams() {
    return collections.map(collection => ({
        collectionID: collection.id,
    }));
}

export default async function MovieDetailView({ params }: { params: Promise<{ collectionID: string }> }) {
    const { collectionID } = await params;
    const collection = collections.find(collection => collection.id===collectionID);
    return (
        <div className="">
            {collection?.name}
        </div>
    )
}