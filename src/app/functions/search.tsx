import { Recc, ReccSearch } from "../types/recc";
import { subregions } from "../lib/subregions";

const norm = ( txt: string ) => {
    return txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
const checkTitle = ( query: string, entry: ReccSearch ) => {
    return norm(entry.title.original).includes(norm(query)) 
    || norm(entry.title.transliteration??"").includes(norm(query))
    || norm(entry.title.translation??"").includes(norm(query));
};
const checkInfo = ( query: string, entry: ReccSearch ) => {
    return entry.info?.join(" ").toLowerCase().includes(query.toLowerCase());
};
const checkExcerpt = ( query: string, entry: ReccSearch ) => {
    return entry.excerpt?.join(" ").toLowerCase().includes(query.toLowerCase());
};
const checkAuthor = ( query: string, entry: ReccSearch ) => {
    return entry.author || entry.intermediary ? norm(entry.author??"").includes(norm(query)) || norm(entry.intermediary??"").includes(norm(query)) : false;
};
const getGrouping = (entries: ReccSearch[], grouping: keyof Recc["group"]) => {
    // Define the exceptions for quick lookup
    const euweExceptions = new Set(["English", "French", "Spanish", "German", "France", "USA"]);
    const eueaExceptions = new Set(["Russian"]);
    // Step 1: Accumulate items into Sets, grouped by prefix or the "EUWE" exception
    const groupedSets = entries.reduce((acc, entry) => {
        const prefix = entry.id.substring(0, 4);
        const raw = entry.group[grouping] as string;
        const items = raw?.includes(',') ? [raw.trim()] : raw?.split('/').map(item => item.trim());

        items?.forEach(item => {
            // Check if the item matches our exceptions; if so, route it to "EUWE"
            const targetKey = euweExceptions.has(item) ? "EUWE" : eueaExceptions.has(item) ? "EUEA" : prefix;
            // Initialize a new Set for this target key if it doesn't exist yet
            if (!acc[targetKey]) {
                acc[targetKey] = new Set<string>();
            }
            // Add the item to the appropriate Set
            acc[targetKey].add(item);
        });
        return acc;
    }, {} as Record<string, Set<string>>);
    // Step 2: Convert the object of Sets into an object of alphabetized arrays
    const result: Record<string, string[]> = {};
    for (const key in groupedSets) {
        result[key] = [...groupedSets[key]].sort();
    }
    return result;
};
const checkLanguage = ( query: string, entry: ReccSearch ) => {
    return norm(entry.group.language).includes(norm(query));
};
const checkSubregion = ( query: string, entry: ReccSearch ) => {
    return subregions.find(subr => subr.id===entry.id.slice(0,4))?.name.toLowerCase().includes(query.toLowerCase());
};
const checkTags = ( query: string, entry: ReccSearch ) => {
    return entry.tags?.join(" ").toLowerCase().includes(query.toLowerCase()) || entry.genre?.join(" ").toLowerCase().includes(query.toLowerCase());
};
const checkAll = ( query: string, entry: ReccSearch ) => {
    const checks = [checkTitle,checkInfo,checkExcerpt,checkAuthor,checkSubregion,checkTags];
    let match: boolean|undefined = false;
    checks.forEach(check => match = match ? true : check(query,entry));
    return match;
};
export const searchTypes = [
    { type: "all", check: checkAll },
    { type: "title", check: checkTitle },
    { type: "info", check: checkInfo },
    { type: "excerpt", check: checkExcerpt },
    { type: "author", check: checkAuthor },
    { type: "region", check: checkSubregion },
    { type: "tags", check: checkTags }
];
export const filterTypes = [
    { id: "language", get: getGrouping, check: checkLanguage }
];