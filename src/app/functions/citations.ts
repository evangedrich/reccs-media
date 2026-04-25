import { UniversalCitation } from "../types/citations";

type Contributor = UniversalCitation['contributors'][number];

const getInitials = (firstName: string): string =>
    firstName.split(/\s+/).filter(Boolean).map(n => n.replace(/\./g, '').charAt(0).toUpperCase() + '.').join(' ');

const nameLastFirst = (c: Contributor): string => {
    if (c.organization) return c.organization;
    const last = c.lastName ?? '';
    const first = c.firstName ?? '';
    return first ? `${last}, ${first}` : last;
};

const nameFirstLast = (c: Contributor): string => {
    if (c.organization) return c.organization;
    const last = c.lastName ?? '';
    const first = c.firstName ?? '';
    return first ? `${first} ${last}` : last;
};

const nameAPA = (c: Contributor): string => {
    if (c.organization) return c.organization;
    const last = c.lastName ?? '';
    const initials = c.firstName ? getInitials(c.firstName) : '';
    return initials ? `${last}, ${initials}` : last;
};

const joinList = (items: string[], sep: string, lastSep: string): string => {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]}${lastSep}${items[1]}`;
    return items.slice(0, -1).join(sep) + lastSep + items[items.length - 1];
};

const primaryContributors = (contributors: Contributor[]): { list: Contributor[]; role: Contributor['role'] } => {
    const authors = contributors.filter(c => c.role === 'author');
    if (authors.length > 0) return { list: authors, role: 'author' };
    const editors = contributors.filter(c => c.role === 'editor');
    if (editors.length > 0) return { list: editors, role: 'editor' };
    return { list: contributors.slice(0, 1), role: contributors[0]?.role ?? 'author' };
};

const formatPages = (pages?: { start: string; end: string; literal?: string }): string => {
    if (!pages) return '';
    if (pages.literal) return pages.literal;
    if (pages.start === pages.end) return pages.start;
    return `${pages.start}–${pages.end}`;
};

const resolveUrl = (c: UniversalCitation): string => c.doi ? `https://doi.org/${c.doi}` : (c.url ?? '');

const formatAPA = (c: UniversalCitation): { citation: string; url: string } => {
    const { list, role } = primaryContributors(c.contributors);
    const names = list.map(nameAPA);
    let authors = joinList(names, ', ', names.length > 1 ? ', & ' : '');
    if (authors && role === 'editor') authors += list.length > 1 ? ' (Eds.)' : ' (Ed.)';

    const parts: string[] = [];
    if (authors) parts.push(`${authors}${/*'.'*/""}`);
    parts.push(`(${c.pubDate.year}).`);

    if (c.type === 'article') {
        parts.push(`${c.title}.`);
        if (c.containerTitle) {
            let container = `*${c.containerTitle}*`;
            if (c.volume) {
                container += `, *${c.volume}*`;
                if (c.issue) container += `(${c.issue})`;
            }
            const pp = formatPages(c.pages);
            if (pp) container += `, ${pp}`;
            parts.push(`${container}.`);
        }
    } else if (c.type === 'chapter') {
        parts.push(`${c.title}.`);
        if (c.containerTitle) {
            let container = `In *${c.containerTitle}*`;
            const pp = formatPages(c.pages);
            if (pp) container += ` (pp. ${pp})`;
            parts.push(`${container}.`);
        }
        if (c.publisher) parts.push(`${c.publisher}.`);
    } else {
        parts.push(`*${c.title}*.`);
        if (c.publisher) parts.push(`${c.publisher}.`);
    }

    return { citation: parts.join(' '), url: resolveUrl(c) };
};

const formatMLA = (c: UniversalCitation): { citation: string; url: string } => {
    const { list, role } = primaryContributors(c.contributors);
    let authors = '';
    if (list.length === 1) authors = nameLastFirst(list[0]);
    else if (list.length === 2) authors = `${nameLastFirst(list[0])}, and ${nameFirstLast(list[1])}`;
    else if (list.length >= 3) authors = `${nameLastFirst(list[0])}, et al.`;
    if (authors && role === 'editor') authors += list.length > 1 ? ', editors' : ', editor';

    const parts: string[] = [];
    if (authors) parts.push(`${authors}.`);

    if (c.type === 'article' || c.type === 'chapter') {
        parts.push(`"${c.title}."`);
        if (c.containerTitle) {
            let container = `*${c.containerTitle}*`;
            if (c.volume) container += `, vol. ${c.volume}`;
            if (c.issue) container += `, no. ${c.issue}`;
            container += `, ${c.pubDate.year}`;
            const pp = formatPages(c.pages);
            if (pp) container += `, pp. ${pp}`;
            parts.push(`${container}.`);
        } else {
            if (c.publisher) parts.push(`${c.publisher}, ${c.pubDate.year}.`);
            else parts.push(`${c.pubDate.year}.`);
        }
    } else {
        parts.push(`*${c.title}*.`);
        if (c.publisher) parts.push(`${c.publisher}, ${c.pubDate.year}.`);
        else parts.push(`${c.pubDate.year}.`);
    }

    return { citation: parts.join(' '), url: resolveUrl(c) };
};

const formatChicago = (c: UniversalCitation): { citation: string; url: string } => {
    const { list, role } = primaryContributors(c.contributors);
    let authors = '';
    if (list.length === 1) authors = nameLastFirst(list[0]);
    else if (list.length <= 3) {
        const first = nameLastFirst(list[0]);
        const rest = list.slice(1).map(nameFirstLast);
        authors = rest.length === 1 ? `${first}, and ${rest[0]}` : `${first}, ${rest.slice(0, -1).join(', ')}, and ${rest[rest.length - 1]}`;
    } else authors = `${nameLastFirst(list[0])}, et al.`;
    if (authors && role === 'editor') authors += list.length > 1 ? ', eds.' : ', ed.';

    const parts: string[] = [];
    if (authors) parts.push(`${authors}.`);

    if (c.type === 'article') {
        parts.push(`"${c.title}."`);
        if (c.containerTitle) {
            let container = `*${c.containerTitle}*`;
            if (c.volume) container += ` ${c.volume}`;
            if (c.issue) container += `, no. ${c.issue}`;
            container += ` (${c.pubDate.year})`;
            const pp = formatPages(c.pages);
            if (pp) container += `: ${pp}`;
            parts.push(`${container}.`);
        } else {
            parts.push(`${c.pubDate.year}.`);
        }
    } else if (c.type === 'chapter') {
        parts.push(`"${c.title}."`);
        if (c.containerTitle) {
            let container = `In *${c.containerTitle}*`;
            const pp = formatPages(c.pages);
            if (pp) container += `, ${pp}`;
            parts.push(`${container}.`);
        }
        const imprint: string[] = [];
        if (c.location) imprint.push(c.location);
        if (c.publisher) imprint[0] = imprint[0] ? `${imprint[0]}: ${c.publisher}` : c.publisher;
        imprint.push(`${c.pubDate.year}`);
        parts.push(`${imprint.join(', ')}.`);
    } else {
        parts.push(`*${c.title}*.`);
        const imprint: string[] = [];
        if (c.location) imprint.push(c.location);
        if (c.publisher) imprint[0] = imprint[0] ? `${imprint[0]}: ${c.publisher}` : c.publisher;
        imprint.push(`${c.pubDate.year}`);
        parts.push(`${imprint.join(', ')}.`);
    }

    return { citation: parts.join(' '), url: resolveUrl(c) };
};

export const getCitations = (refArray: UniversalCitation[], format: string): { citation: string; url: string; type: string }[] => {
    const formatter = format === 'MLA' ? formatMLA : format === 'Chicago' ? formatChicago : formatAPA;
    return refArray.map(c => {
        const { citation, url } = formatter(c);
        const grade = c.meta?.grade ? ` [Grade ${c.meta.grade}]` : '';
        return { citation: `${citation}${grade}`, url, type: c.meta?.sortKey ?? '' };
    });
};