import parse, { domToReact } from 'html-react-parser';
import { preParse } from './text';

const extractText = (children: any[]): string =>
    children.map((c: any) => {
        if (c.type === 'text') return c.data ?? '';
        if (c.children) return extractText(c.children);
        return '';
    }).join('');

// Parses markup that has already been through a string transform — mongolExcerpt(), which
// builds its own markup and must not be run through preParse() on top of it.
export const parseHtmlWithAbbr = (
    html: string,
    onAbbrClick: (title: string, content: string) => void,
) => parse(html, {
    replace: (node: any) => {
        if (node.type === 'tag' && node.name === 'abbr') {
            const title = node.attribs?.title ?? '';
            const content = extractText(node.children ?? []);
            return (
                <abbr
                    title={title}
                    style={{ cursor: 'help' }}
                    onClick={() => onAbbrClick(title, content)}
                    className="active:opacity-80"
                >
                    {domToReact(node.children)}
                </abbr>
            );
        }
    },
});

export const parseWithAbbr = (
    txt: string,
    onAbbrClick: (title: string, content: string) => void,
) => parseHtmlWithAbbr(preParse(txt), onAbbrClick);
