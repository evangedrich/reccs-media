import { syncopate } from "@/app/fonts/fonts";

export default function Footer() {
    return (
        <div className="w-full border-t-2 border-solid border-[var(--color-front)] p-4 flex gap-8">
            <div>
                <b className={syncopate.className}>Details</b><br/>
                <a>About</a><br/>
                <a>Privacy</a><br/>
                <a>Landing</a>
            </div>
            <div>
                <b className={syncopate.className}>External</b><br/>
                <a>Film Reccs</a><br/>
                <a>Lit Reccs</a>
            </div>
        </div>
    )
}