
export const getTitle = (selection: any, field?: string) => {
    const label = ('work' in selection && selection.work[field ?? "original"])
        ? `${selection.work[field ?? "original"]}: “${selection.title[field ?? "original"]}”`
        : ('anthology' in selection && selection.anthology[field ?? "original"])
        ? `“${selection.title[field ?? "original"]}”, ${selection.anthology[field ?? "original"]}`
        : ('piece' in selection && /^(?!undefined)\p{Script=Latin}/u.test(selection.title[field ?? "original"]))
        ? `“${selection.title[field ?? "original"]}”`
        : selection.title[field ?? "original"];
    return label;
};

export const getByline = (selection: any): string | null => {
  let byline = null;
  if ('author' in selection) { byline = `by ${selection.author}`; }
  if ('intermediary' in selection) { byline = `via ${selection.intermediary}`; }
  if ('author' in selection && 'intermediary' in selection) { byline = `by ${selection.author} via ${selection.intermediary}`; }
  return byline;
};