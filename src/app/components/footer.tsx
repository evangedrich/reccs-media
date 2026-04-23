import { syncopate } from "@/app/fonts/fonts";

export default function Footer() {
    return (
        <div className="w-full border-t-2 border-solid border-[var(--color-front)] p-4">
            <b className={syncopate.className}>More</b><br/>
            <a>Film Reccs</a><br/>
            <a>Lit Reccs</a>
        </div>
    )
}