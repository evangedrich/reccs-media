import Markdown, { Components } from "react-markdown";

const targetSVG = <svg viewBox="-20 -35 130 130" xmlns="http://www.w3.org/2000/svg" className="w-[1em] h-[1em]">
  <path d="M40,20 10,20 10,90 80,90 80,60 M35,65 90,10 M90,10 90,30 70,10 z" stroke="var(--color-front)" strokeWidth="10" fill="none" />
</svg>;

export default function MarkdownCitation({ markdownContent, url }: { markdownContent: string, url: string }) {
    const components: Components = {
        p: ({ node, children, ...props }) => (
            <p {...props}>
                {children}
                {url ? <>&nbsp;<a href={url} target="_blank" className="inline-block hover:opacity-70">{targetSVG}</a></> : <></>}
            </p>
        )
    };
    return (
        <Markdown components={components}>
            {markdownContent}
        </Markdown>
    )
}