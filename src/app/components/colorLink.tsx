import Link from "next/link";

export default function ColorLink({ to, n }: { to: string, n: string }) {
    const hoverColor = n==="g" ? "hover:text-[var(--color-green)]" : n==="o" ? "hover:text-[var(--color-orange)]" : n==="r" ? "hover:text-[var(--color-red)]" : n==="b" ? "hover:text-[var(--color-blue)]" : "hover:text-[var(--color-purple)]";
    return (
        <Link href="/" className={`${hoverColor} hover:font-extrabold`}>{to}</Link>
    )
}