import { Suspense } from 'react';
import { getShuffledReccsSearch } from '@/app/lib/reccs';
import SearchWindow from '@/app/components/searchWindow';

export default async function SearchPage() {
    const reccs = await getShuffledReccsSearch( Math.floor((new Date().getUTCFullYear() * 10000) + ((new Date().getUTCMonth() + 1) * 100) + new Date().getUTCDate()) );
    return (
        <Suspense>
            <SearchWindow reccs={reccs} />
        </Suspense>
    )
}