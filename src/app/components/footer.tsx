import { syncopate } from "@/app/fonts/fonts";
import ColorLink from "./colorLink";

export default function Footer() {
    return (
        <div className="w-full border-t-2 border-solid border-[var(--color-front)] p-4 px-8 cursor-default">
            <div className="mx-auto flex gap-8">
                <div className="flex flex-col">
                    <h1 className={`opacity-50 uppercase text-xs mb-1 block`}>Info</h1>
                    <ColorLink to="/about" text="About" c="y"/>
                    <ColorLink to="/privacy-policy" text="Privacy" c="p"/>
                    <ColorLink to="/landing" text="Landing" c="o"/>
                </div>
                <div className="flex flex-col">
                    <h1 className={`opacity-50 uppercase text-xs mb-1 block`}>More</h1>
                    <ColorLink to="https://film.reccs.media" text="Film Reccs" c="b" />
                    <a>Lit Reccs</a>
                </div>
            </div>
        </div>
    )
}