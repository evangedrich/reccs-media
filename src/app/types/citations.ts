/**
 * The specific category of the work. 
 * This is the 'Master Key' that determines how formatting logic (italics vs quotes) is applied.
 */
type WorkType =
    | 'article'    // Journal, magazine, or newspaper articles
    | 'book'       // Whole books (print or digital)
    | 'chapter'    // A specific chapter or essay within an anthology/edited book
    | 'webpage'    // Blog posts, online news, or general website content
    | 'video'      // YouTube, movies, TV shows, or webinars
    | 'legal_case' // Court proceedings (e.g., Brown v. Board)
    | 'statute'    // Laws, acts, or bills
    | 'software'   // Computer programs, libraries, or apps
    | 'artwork'    // Paintings, sculptures, or photographs (physical or digital)
    | 'map'        // Cartographic data
    | 'patent';    // Official patent filings

/**
 * Information about the people or organizations that created the work.
 */
interface Contributor {
    firstName?: string;    // Given names
    lastName?: string;     // Surname/Family name
    organization?: string; // Corporate authors (e.g., "World Health Organization")
    handle?: string;       // Social media username (e.g., "@sciguy")
    /**
     * The role determines where the name appears in the citation (e.g., 'Directed by', 'Edited by').
     */
    role: 'author' | 'editor' | 'translator' | 'director' | 'uploader' | 'counsel' | 'performer';
}

/**
 * A universal data structure capable of generating a citation for any style (APA, MLA, Chicago, etc.)
 */
export interface UniversalCitation {
    /** Internal unique ID for database or array mapping */
    id: string;

    /** The broad category of the work */
    type: WorkType;

    /** The primary name of the work (Article title, Book title, Movie title) */
    title: string;

    /** Used for shortened subsequent citations in styles like Chicago (e.g., "History of Khoi" instead of the full title) */
    shortTitle?: string;

    // --- CONTAINERS (The "Where") ---

    /** The larger work that contains the piece (e.g., The Journal name, the Website name, or the Anthology title) */
    containerTitle?: string;

    /** For archival work; describes the specific collection name at a library or museum */
    collection?: string;

    /** List of all people involved. Usually sorted by 'author' first in bibliography generation. */
    contributors: Contributor[];

    // --- TEMPORAL DATA (The "When") ---

    /** * Publication date. We use an object because many styles require just the year, 
     * while others (Newspapers/YouTube) require the full date or season.
     */
    pubDate: {
        year: number;
        month?: number;     // 1-12
        day?: number;
        season?: string;    // e.g., "Spring" or "Q3"
    };

    /** The date you viewed the material. Critical for websites and ephemeral content like Tweets. */
    accessDate?: Date;

    // --- PHYSICAL & DIGITAL LOCATION ---

    /** The publishing house, studio, or university press */
    publisher?: string;

    /** City of publication (Chicago style) or the physical museum/gallery housing an artwork */
    location?: string;

    /** Specific physical location within an archive (e.g., "Box 4, Folder 12, Series 2") */
    archiveLocation?: string;

    // --- VERSIONS & NUMBERING ---

    /** Edition (e.g., "3rd ed."), Software version (e.g., "v1.2.0"), or Director's Cut */
    version?: string;

    /** Volume number (common for journals and multi-volume book sets) */
    volume?: string;

    /** Issue number or 'Number' (e.g., Vol 2, No 4) */
    issue?: string;

    /** * Page numbers. 'literal' is used for non-standard strings like "iv-xi" or "C1, C4-C6".
     */
    pages?: {
        start: string;
        end: string;
        literal?: string;
    };

    // --- IDENTIFIERS ---

    /** Digital Object Identifier - the gold standard for academic permanent links */
    doi?: string;

    /** Full web address */
    url?: string;

    /** International Standard Book Number */
    isbn?: string;

    /** Describes the format in brackets (e.g., "[Film]", "[Oil on canvas]", "[Source code]", "[Tweet]") */
    medium?: string;

    // --- LEGAL & TECHNICAL ---

    /** The legal authority or geographic area (e.g., "U.S. Supreme Court" or "UK Parliament") */
    jurisdiction?: string;

    /** Case number for legal filings or patents */
    docketNumber?: string;

    // --- USER METADATA (Internal Use) ---

    /** * Non-bibliographic data for your own application logic 
     * (e.g., your 'grade' system or personal 'sort' tags).
     */
    meta?: {
        sortKey?: string;
        grade?: 'A' | 'B' | 'C' | 'D' | 'F';
        tags?: string[];
        notes?: string;
    };
}