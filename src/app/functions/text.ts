

export const giveTitle = (selection: any) => {
    let label = '[UNTITLED]';
    if ('genre' in selection) {
        if (typeof selection.genre === 'object') { label = selection.genre.original; }
        else { label = selection.genre; }
    }
    else if (typeof selection.title === 'object') {
        if ('piece' in selection.title) { label = selection.title.piece; }
        else if (typeof selection.title.original === 'object') { label = selection.title.original.piece; }
        else { label = selection.title.original; }
    }
    else { label = selection.title; }
    return label;
}