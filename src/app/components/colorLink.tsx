import Link from "next/link";

export default function ColorLink({ to, text, c, caps, bold }: { to: string, text: string, c: string, caps?: boolean, bold?: boolean }) {
    const hoverColor = c==="g" ? "hover:text-[var(--color-green)]" : c==="o" ? "hover:text-[var(--color-orange)]" : c==="r" ? "hover:text-[var(--color-red)]" : c==="b" ? "hover:text-[var(--color-blue)]" : c==="y" ? "hover:text-[var(--color-yellow)]" : "hover:text-[var(--color-purple)]";
    return (
        <>
            {
                to.startsWith('http')
                ? <a href={to} target="_blank" className={`${hoverColor} hover:font-extrabold`}>{text}</a>
                : <Link href={to} className={`${hoverColor} hover:font-extrabold ${caps?"uppercase":""} ${bold?"font-extrabold":""}`}>{text}</Link>
            }
        </>
    )
}