import { Suspense } from 'react';
import { getShuffledReccs } from '@/app/lib/reccs';
import SearchWindow from '@/app/components/searchWindow';

export default async function SearchPage() {
    const reccs = await getShuffledReccs(Math.floor(Date.now() / 86_400_000));
    return (
        <Suspense>
            <SearchWindow reccs={reccs} />
        </Suspense>
    )
}