import { Suspense } from "react";
import { categories } from "@/app/lib/collections";
import { collections } from "@/app/lib/collections";
import CollectionShelf from "@/app/components/collectionShelf";
import { getShuffledReccs } from "@/app/lib/reccs";
import { Metadata } from "next";

export async function generateStaticParams() {
    return categories.map(cat => ({
        category: cat,
    }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const title = category.charAt(0).toUpperCase() + category.slice(1);
  return {
    title,
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = await params;
    const cinemaCollections = collections.filter(collection => collection.type===category);
    const reccs = await getShuffledReccs(Math.floor(Date.now() / 86_400_000));
    return (
        <Suspense>
            <CollectionShelf collections={cinemaCollections} reccs={reccs} />
        </Suspense>
    )
}