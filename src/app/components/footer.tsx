import { syncopate } from "@/app/fonts/fonts";
import ColorLink from "./colorLink";

export default function Footer() {
    return (
        <div className="w-full border-t-2 border-solid border-[var(--color-front)] p-4 flex gap-8 cursor-default">
            <div>
                <h1 className={`opacity-50 uppercase text-xs mb-1 block`}>Details</h1>
                <a>About</a><br/>
                <a>Privacy</a><br/>
                <a>Landing</a>
            </div>
            <div>
                <h1 className={`opacity-50 uppercase text-xs mb-1 block`}>External</h1>
                <ColorLink to="https://film.reccs.media" text="Film Reccs" c="b" /><br/>
                <a>Lit Reccs</a>
            </div>
        </div>
    )
}