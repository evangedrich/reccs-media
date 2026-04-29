import parse, { domToReact } from 'html-react-parser';
import { preParse } from './text';

const extractText = (children: any[]): string =>
    children.map((c: any) => {
        if (c.type === 'text') return c.data ?? '';
        if (c.children) return extractText(c.children);
        return '';
    }).join('');

export const parseWithAbbr = (
    txt: string,
    onAbbrClick: (title: string, content: string) => void,
) => parse(preParse(txt), {
    replace: (node: any) => {
        if (node.type === 'tag' && node.name === 'abbr') {
            const title = node.attribs?.title ?? '';
            const content = extractText(node.children ?? []);
            return (
                <abbr
                    title={title}
                    style={{ cursor: 'help' }}
                    onClick={() => onAbbrClick(title, content)}
                >
                    {domToReact(node.children)}
                </abbr>
            );
        }
    },
});
