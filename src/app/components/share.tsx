

const shareIcons: React.ReactElement[] = [
    <svg viewBox="-15 -15 130 130" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
        <path d="M37,44 25,44 25,83 75,83 75,44 63,44" stroke="var(--color-front)" fill="none" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M50,62 50,13 M35,29 50,14 65,29" stroke="var(--color-front)" fill="none" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
    </svg>,
    <svg viewBox="-20 -20 140 140" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}} className="group-hover:opacity-80 group-active:scale-90 transition-transform">
        <path d="M75,20 25,50 75,80" stroke="var(--color-front)" fill="none" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
        <circle r="13" cx="75" cy="20" fill="var(--color-front)" />
        <circle r="13" cx="25" cy="50" fill="var(--color-front)" />
        <circle r="13" cx="75" cy="80" fill="var(--color-front)" />
    </svg>
];

const share = async (label: string) => {
    const url = (typeof window !== 'undefined') ? window.location.href : '';
    const title = 'Reccs: '+label;
    if (navigator.share) {
        try { await navigator.share({title:title,text:'Learn more about '+label+' on evangedrich.com!',url:url}); console.log('Content shared successfully'); }
        catch (error) { if ((error as Error).name !== 'AbortError') console.error('Error sharing content:', error); }
    }
};

export default function Share({ title }: { title: string }) {
    return (
        <button className="w-6 h-6 overflow-hidden text-center cursor-pointer group" onClick={() => share(title)}>
            {shareIcons[1]}
        </button>
    )
}