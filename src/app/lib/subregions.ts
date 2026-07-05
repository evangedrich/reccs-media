interface RegionType {
    id: string;
    color: string;
    code?: string[];
}
interface SubregionType {
    id: string;
    name: string;
    neighbors: string[];
    description: string;
}

export const regions: RegionType[] = [
    { id: "africa", color: "p", code: ["AF"] },
    { id: "americas", color: "b", code: ["AM"] },
    { id: "eurasia", color: "o", code: ["AS","EU"] },
    { id: "oceania", color: "g", code: ["OC"] },
];

export const subregions: SubregionType[] = [
    { id: "AFNO", name: "North Africa", neighbors: ["EUWE","ASWE","AFWE"], description: "The Amazigh, Saharan, and Chadic languages anchor the distinctive linguistic and cultural heritage of the Maghreb, Sahara, and Sahel." },
    { id: "AFNE", name: "Northeast Africa", neighbors: ["ASWE","AFNO","AFEA"], description: "The Cushitic, Omotic, and Semitic languages, all part of the broader Afroasiatic language family, are spoken across the Horn of Africa." },
    { id: "AFEA", name: "East Africa", neighbors: ["AFNE","AFNO","AFCE","OCMD"], description: "This subregion is made up of the Nilotic eastern Sudanian belt, the Bantu Swahili Coast, and the Hadza and Sandawe areas of the southeast." },
    { id: "AFSO", name: "Southern Africa", neighbors: ["AFEA","AFCE"], description: "Khoisan Southern Africa includes speakers of the click consonant Kxʼa, Taa–ǃKwi, and Khoe–Kwadi language families in the Karoo, Kalahari Basin, and Okavango Delta, in addition to click-borrowing Bantu groups like the Nguni." },
    { id: "AFCE", name: "Central Africa", neighbors: ["AFWE","AFEA"], description: "Mbenga, Mbuti, and Twa groups in the Congo Basin speak the Bantu, Ubangian, and Central Sudanic languages of the surrounding areas, with some specialized botanical vocabulary of earlier origin." },
    { id: "AFWE", name: "West Africa", neighbors: ["AFNO","AFCE"], description: "Comprised of Upper and Lower Guinea (separated by the Dahomey Gap) and the western Sudanian savanna, this subregion is dominated by the western branches of the Niger–Congo language family." },
    { id: "AMNO", name: "Northern North America", neighbors: ["ASNO","AMNW"], description: "The Eskaleut languages encircle the Arctic from Greenland to Alaska and extend across the Behring Strait to the Chukchi Peninsula, and are distinct from older Algic and Na-Dené parts of the Subarctic also in this subregion." },
    { id: "AMEA", name: "Eastern North America", neighbors: ["AMNO","AMIN","AMSW"], description: "Coterminous with the Eastern Woodlands, this subregion accounts for the cultural areas of the Northeastern and Southeastern Woodlands and the Great Lakes, including language families like the Algonquian, Iroquoian, and Muskogean." },
    { id: "AMSW", name: "Southwest North America", neighbors: ["AMCE","AMIN","AMNW"], description: "Encompassing the American Southwest, Great Basin, and Californian cultural areas, where the Uto-Aztecan and Hokan families, alongside prominent isolates like Zuni and Washoe or outliers like Diné Bizaad, are spoken." },
    { id: "AMNW", name: "Northwest North America", neighbors: ["AMNO","AMIN","AMSW"], description: "The Pacific Northwest Coast and Plateau cultural areas are largely defined by the diversity of Salishan, Penutian, Wakashan, Tsimshianic, and Chimakuan languages spread across the coast and interior." },
    { id: "AMIN", name: "Interior North America", neighbors: ["AMEA","AMNW","AMSW"], description: "The Interior Plains include the Great Plains, Prairies, and Rockies, where the Caddoan, Western Siouan, and Plains Algonquian language families are spoken." },
    { id: "AMCE", name: "Central America", neighbors: ["AMSW","AMCR"], description: "Mesoamerica—the Nahua and Oto-Manguean spheres of influence in the west and the Mayan world in the east—as well as the transitional Isthmo-Colombian area's Chibchan and Misumalpan languages, constitute this subregion." },
    { id: "AMCR", name: "Caribbean", neighbors: ["AMNE","AMCE"], description: "This subregion includes the Arawakan Taíno languages of the Greater Antilles, and the more-recently introduced Cariban languages of the Lesser Antilles, alongside older languages like Guanahatabey, Macorix, and Ciguayo." },
    { id: "AMWE", name: "Western South America", neighbors: ["AMNE","AMSO"], description: "The Andean Region is dominated by the imperial Quechuan and Aymaran languages, alongside families like the Chibchan and Barbacoan in the north, across the terrains of the Costeña, Cordillera, and eastern foothills." },
    { id: "AMNE", name: "Northeast South America", neighbors: ["AMCR","AMSO","AMWE"], description: "The Guiana Shield, Orinoquia, Amazonia, and the Brazilian Plateau can all be found within this subregion, where the Macro-Jê, Tupian, Arawakan, Cariban, and Panoan languages, among others, are spoken." },
    { id: "AMSO", name: "Southern South America", neighbors: ["AMNE","AMWE"], description: "The Southern Cone consists of Patagonia, the Pampas, the Southern Andes, and Tierra del Fuego, and includes language families like Araucanian and Guaicuruan, and the Chon and Puelche-Het of the Fuegian sprachbund." },
    { id: "ASNO", name: "North Asia", neighbors: ["AMNO","EUEA","ASIN","ASCE"], description: "Siberia, its peninsulas from the Yamal to the Kamchatka and islands like Sakhalin and Hokkaido, contains speakers of Uralic and Tungusic languages and older families like Chukotko–Kamchatkan, Nivkh, Yeniseian, and Yukaghir." },
    { id: "ASIN", name: "Inner Asia", neighbors: ["ASCE","ASHI","ASEA","ASNO"], description: "The cultural and linguistic domains of the Mongolic and southern Tungusic peoples extend across the eastern Eurasian Steppe and Manchuria in this subregion." },
    { id: "ASEA", name: "East Asia", neighbors: ["ASIN","ASHI","ASSE"], description: "The Sinitic, Koreanic, and Japonic languages form the core of this sphere of cultural interchange surrounding the East China Sea." },
    { id: "ASHI", name: "Highland Asia", neighbors: ["ASSO","ASEA","ASSE"], description: "This subregion is characterized by the Tibetic sphere of influence pervading the Qinghai-Tibetan Plateau and the Himalayas, including the central Ü-Tsang, eastern Kham, and northeastern Amdo regional groupings." },
    { id: "ASSE", name: "Southeast Asia", neighbors: ["ASEA","ASSO","OCMR"], description: "Austroasiatic, Kra–Dai, Hmong–Mien, and Sino–Tibetan languages converge in the Indochinese sprachbund, divided up into river valleys by the numerous mountain ranges of Mainland Southeast Asia." },
    { id: "ASSO", name: "South Asia", neighbors: ["ASHI","ASWE"], description: "The Dravidian languages dominate the southern Deccan peninsula, whereas Indo-Aryan languages extend across the northern Ganga and Indus plains, the Thar desert, and the northeastern mountain zone." },
    { id: "ASWE", name: "West Asia", neighbors: ["AFNO","ASSO","ASCE"], description: "The Arabian Peninsula, Iranian Plateau, and Anatolia comprise the Arabic, Persic, and Turkic spheres of this subregion, in addition to transitional areas like Mesopotamia, Sinai, and the Armenian Highlands." },
    { id: "ASCE", name: "Central Asia", neighbors: ["ASIN","ASWE","ASNO","EUEA"], description: "The central Eurasian Steppe, stretching from the Ural mountains in the west to the Altai mountains in the east, is predominantly a diverse mix of Turkic and Iranic cultures." },
    { id: "EUEA", name: "Eastern Europe", neighbors: ["EUWE","ASNO","ASWE","ASCE"], description: "This subregion is dominated by Balto-Slavic and Uralic languages and the Balkan sprachbund; its plains of the western Eurasian Steppe are bordered by the Carpathian, Ural, and Caucasus mountain ranges to the west, east, and south." },
    { id: "EUWE", name: "Western Europe", neighbors: ["EUEA","AFNO","ASWE"], description: "This subregion includes the Latin, Germanic, and Celtic cultural areas, in various admixtures, and the branches of the Indo-European language families of the same names." },
    { id: "OCAU", name: "Australia", neighbors: ["OCML"], description: "The Pama–Nyungan language family, of which three-quarters of all Australian languages are part, covers nearly 90% of the continent, while the remaining ~30 families and isolates are clustered in the north." },
    { id: "OCMD", name: "Madagascar", neighbors: ["OCMR","AFEA","OCPL"], description: "A combination of Austronesian (originating in Maritime Southeast Asia) and later Bantu (via Southeast Africa) influences converge to constitute the Malagasy language and culture predominant across the island." },
    { id: "OCMR", name: "Maritime Southeast Asia", neighbors: ["ASSE","OCML","OCMC","OCPL","OCMD"], description: "The Austronesian languages of the Malaysphere pervade throughout this subregion, while older isolates and substrata persist in some secluded archipelagos and rugged island interiors." },
    { id: "OCML", name: "Melanesia", neighbors: ["OCMC","OCAU","OCMR"], description: "There are 1,000–1,500 distinct languages spoken in Melanesia, as much as one-quarter of the global total, centered on New Guinea and the surrounding islands." },
    { id: "OCMC", name: "Micronesia", neighbors: ["OCPL","OCML","OCMR"], description: "Austronesian languages of the Oceanic branch, featuring extensive maritime vocabulary, pervade throughout this subregion in a unique synthesis of Melanesian and Polynesian influences." },
    { id: "OCPL", name: "Polynesia", neighbors: ["OCMC","OCMR","OCML"], description: "Speakers of the closely related Polynesian languages of the Oceanic branch of Austronesian span the vast expanse of ocean covered by the Polynesian Triangle." },
];