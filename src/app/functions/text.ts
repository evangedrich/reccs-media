

export const getTitle = (selection: any) => {
    let label = selection.title.original;
    if ('piece' in selection) {
        if ('work' in selection) {
            label = selection.work.original+": “"+selection.title.original+'”';
        } else if ('anthology' in selection) {
            label = '“'+selection.title.original+'”'+", "+selection.anthology.original;
        } else {
            label = /^\p{Script=Latin}/u.test(selection.title.original) ? ('“'+selection.title.original+'”') : selection.title.original;
        }
    }
    return label;
};

export const getSubtitle = (selection: any) => {
    return ""
};

export const getByline = (selection: any): string | null => {
  let byline = null;
  if ('author' in selection) { byline = `by ${selection.author}`; }
  if ('intermediary' in selection) { byline = `via ${selection.intermediary}`; }
  if ('author' in selection && 'intermediary' in selection) { byline = `by ${selection.author} via ${selection.intermediary}`; }
  return byline;
};