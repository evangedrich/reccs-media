import Link from "next/link";

export default function ColorLink({ to, text, n }: { to: string, text: string, n: string }) {
    const hoverColor = n==="g" ? "hover:text-[var(--color-green)]" : n==="o" ? "hover:text-[var(--color-orange)]" : n==="r" ? "hover:text-[var(--color-red)]" : n==="b" ? "hover:text-[var(--color-blue)]" : "hover:text-[var(--color-purple)]";
    return (
        <>
            {
                to.startsWith('http')
                ? <a href={to} target="_blank" className={`${hoverColor} hover:font-extrabold`}>{text}</a>
                : <Link href={to} className={`${hoverColor} hover:font-extrabold`}>{text}</Link>
            }
        </>
    )
}