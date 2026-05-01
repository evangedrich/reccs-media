

function getTonalpohualli(targetDate: Date) {
    const daySigns = [
        "Cipactli", "Ehecatl", "Calli", "Cuetzpalin", "Coatl", 
        "Miquiztli", "Mazatl", "Tochtli", "Atl", "Itzcuintli", 
        "Ozomahtli", "Malinalli", "Acatl", "Ocelotl", "Cuauhtli", 
        "Cozcaquauhtli", "Ollin", "Tecpatl", "Quiahuitl", "Xochitl"
    ];

    // Anchor: Aug 23, 1521 (Gregorian) = 1 Coatl
    // Coatl is the 5th sign (index 4)
    const anchorDate = new Date(1521, 7, 23); 
    
    // Normalize both dates to UTC midnight to avoid DST/timezone shifts
    const d1 = Date.UTC(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate());
    const d2 = Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    const diffDays = Math.floor((d2 - d1) / (24 * 60 * 60 * 1000));

    // Calculate Tonalpohualli Number (1-13)
    // Anchor was 1. (1 - 1 + diff) % 13 + 1
    const tonNumber = ((diffDays % 13) + 13) % 13 + 1;

    // Calculate Tonalpohualli Sign (1-20)
    // Anchor was index 4 (Coatl). (4 + diff) % 20
    const tonSignIndex = (((4 + diffDays) % 20) + 20) % 20;
    const tonSign = daySigns[tonSignIndex];

    return {
        number: tonNumber,
        sign: tonSign,
        toString: () => `${tonNumber} ${tonSign}`
    };
}

function toIslamicDate(date: Date): { day: number, month: string, year: number} {
  // Use 'long' for the month name
  const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const parts = formatter.formatToParts(date);
  
  const getPart = (type: string) => 
    parts.find(part => part.type === type)?.value || '';

  return {
    day: parseInt(getPart('day'), 10),
    month: getPart('month'), // e.g., "Ramadan" or "Shawwal"
    year: parseInt(getPart('year'), 10),
  };
}

function toIgboDate(date: Date): { marketDay: string; month: string; monthIndex: number; } {
  // 4-day Market Cycle (Izu)
  const IGBO_MARKET_DAYS = ["Eke", "Orie", "Afọ", "Nkwọ"];
  
  // 13 Lunar Months of the Igbo Calendar
  const IGBO_MONTHS = [
    "Ọnwa Mbụ", "Ọnwa Abụo", "Ọnwa Ife Eke", "Ọnwa Anọ", "Ọnwa Agwụ",
    "Ọnwa Ifejiọkụ", "Ọnwa Alọm Chi", "Ọnwa Ilo Mmụọ", "Ọnwa Ana",
    "Ọnwa Okike", "Ọnwa Ajana", "Ọnwa Ede Ajana", "Ọnwa Ụzọ Alụsị"
  ];

  // Reference Point: Jan 1, 2000 was an 'Eke' market day.
  // We use UTC to avoid daylight savings shifts interfering with the day count.
  const referenceDate = Date.UTC(2000, 0, 1);
  const targetDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffInMs = targetDate - referenceDate;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // 1. Calculate Market Day (Modulo 4)
  const marketDayIndex = ((diffInDays % 4) + 4) % 4;

  // 2. Calculate Month (Simplified 28-day cycle)
  // Traditional Igbo years often start in late January/February.
  // This calculates the month relative to the start of the current Gregorian year.
  const yearStart = Date.UTC(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((targetDate - yearStart) / (1000 * 60 * 60 * 24));
  const monthIndex = Math.min(Math.floor(dayOfYear / 28), 12);

  return {
    marketDay: IGBO_MARKET_DAYS[marketDayIndex],
    month: IGBO_MONTHS[monthIndex],
    monthIndex: monthIndex + 1
  };
}


interface TransliteratedLunarDate {
  lunarYear: string;  // e.g., "Bǐngwǔnián"
  lunarMonth: string; // e.g., "Zhèngyuè"
  lunarDay: number;
}

/**
 * Converts a Date to the Chinese Lunar Calendar with Pinyin diacritics.
 * Uses a stable offset calculation to ensure 2026 maps correctly to Bǐngwǔnián.
 */
function toTransliteratedChineseDate(date: Date): TransliteratedLunarDate {
  const PINYIN_MONTHS = [
    "Zhèngyuè", "Èryuè", "Sānyuè", "Sìyuè", "Wǔyuè", "Liùyuè",
    "Qīyuè", "Bāyuè", "Jiǔyuè", "Shíyuè", "Shíyīyuè", "Làyuè"
  ];

  const STEMS = ["Jiǎ", "Yǐ", "Bǐng", "Dīng", "Wù", "Jǐ", "Gēng", "Xīn", "Rén", "Guǐ"];
  const BRANCHES = ["Zǐ", "Chǒu", "Yín", "Mǎo", "Chén", "Sì", "Wǔ", "Wèi", "Shēn", "Yǒu", "Xū", "Hài"];

  // Intl handles the lunar month and day transitions (including leap months)
  const formatter = new Intl.DateTimeFormat('en-u-ca-chinese', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  // The 'year' part in Intl can be inconsistent across browsers (returning 4663, 2026, or cycles).
  // We extract the base Gregorian year and adjust if the lunar month is currently in the 'previous' Gregorian year.
  const gYear = date.getFullYear();
  const monthNum = parseInt(getPart('month'), 10);
  
  // If the lunar date's "related Gregorian year" is different from the calendar year,
  // it means we are in that awkward Jan/Feb gap.
  const rawYearString = getPart('year');
  const relatedGregorian = parseInt(rawYearString.match(/\d+/)?.[0] || gYear.toString(), 10);

  // Standard Sexagenary Formula using 4 AD as the Jiǎzǐ (0,0) starting point
  const stemIdx = (((relatedGregorian - 4) % 10) + 10) % 10;
  const branchIdx = (((relatedGregorian - 4) % 12) + 12) % 12;

  const yearName = `${STEMS[stemIdx]}${BRANCHES[branchIdx].toLowerCase()}nián`;

  const isLeap = parts.some(p => p.type === 'month' && p.value.includes('Leap'));
  let transliteratedMonth = PINYIN_MONTHS[monthNum - 1] || `Month ${monthNum}`;
  if (isLeap) {
    transliteratedMonth = `Rùn ${transliteratedMonth}`;
  }

  return {
    lunarYear: yearName,
    lunarMonth: transliteratedMonth,
    lunarDay: parseInt(getPart('day'), 10),
  };
}

interface HawaiianLunarDate {
  moonPhase: string;
  anahulu: string; // The 10-day "week"
  dayOfCycle: number;
}
function toHawaiianLunarDate(date: Date): HawaiianLunarDate {
  const MOON_PHASES = [
    "Hilo", "Hoaka", "Kūkahi", "Kūlua", "Kūpau", "Olekūkahi", "Olekūlua", "Olekūpau", "Huna", "Mohalu",
    "Hua", "Akua", "Hoku", "Māhealani", "Kulu", "Lāʻaukūkahi", "Lāʻaukūlua", "Lāʻaupau", "ʻOlekūkahi", "ʻOlekūlua",
    "ʻOlekūpau", "Kāloakūkahi", "Kāloakūlua", "Kāloapau", "Kāne", "Lono", "Mauli", "Muku"
  ];

  // A known New Moon reference (e.g., Jan 11, 2024)
  const newMoonRef = new Date(2024, 0, 11).getTime();
  const LUNAR_MONTH = 2551442889; // Mean synodic month in ms (29.53 days)
  
  const diff = date.getTime() - newMoonRef;
  const dayOfCycle = Math.floor((diff % LUNAR_MONTH) / (1000 * 60 * 60 * 24)) % 30;

  // Determine the Anahulu (10-day period)
  let anahulu = "Hoʻonui (Growing)";
  if (dayOfCycle >= 10 && dayOfCycle < 20) anahulu = "Poepoe (Rounding)";
  else if (dayOfCycle >= 20) anahulu = "Emi (Decreasing)";

  return {
    moonPhase: MOON_PHASES[dayOfCycle] || "Muku",
    anahulu: anahulu,
    dayOfCycle: dayOfCycle + 1
  };
}

interface TraditionalBengaliDate {
  day: number;
  month: string;
  year: number;
  era: string; // "Bangabda" or "BS"
}

/**
 * Converts a Gregorian Date to the Traditional Bengali Calendar (West Bengal style).
 * This follows the sidereal cycle where the year usually starts on April 15th.
 */
function toTraditionalBengali(date: Date): TraditionalBengaliDate {
  const MONTHS = [
    "Boishakh", "Jaishtha", "Ashar", "Srabon", "Bhadro", "Ashshin",
    "Kartik", "Agrahayan", "Poush", "Magh", "Falgun", "Chaitra"
  ];

  const gYear = date.getFullYear();
  const gMonth = date.getMonth();
  const gDay = date.getDate();

  // Offset: Gregorian Year - 593 (after New Year) or 594 (before New Year)
  let bYear = gYear - 593;

  // Traditional month starting dates (approximate sidereal transitions)
  // These usually fall on the 14th-17th of Gregorian months.
  const transitions = [
    { m: 3, d: 15 }, // Boishakh (Starts mid-April)
    { m: 4, d: 15 }, // Jaishtha
    { m: 5, d: 16 }, // Ashar
    { m: 6, d: 17 }, // Srabon
    { m: 7, d: 17 }, // Bhadro
    { m: 8, d: 17 }, // Ashshin
    { m: 9, d: 18 }, // Kartik
    { m: 10, d: 17 }, // Agrahayan
    { m: 11, d: 16 }, // Poush
    { m: 0, d: 15 }, // Magh (Jan)
    { m: 1, d: 14 }, // Falgun
    { m: 2, d: 15 }  // Chaitra
  ];

  // Determine if we are before the New Year (April 15)
  const isBeforeNewYear = (gMonth < 3) || (gMonth === 3 && gDay < 15);
  if (isBeforeNewYear) {
    bYear -= 1;
  }

  // Find the current month by checking which transition we just passed
  let bMonthIndex = 0;
  let transitionDay = 15;

  // Logic to find the active Bengali month based on Gregorian date
  // We check the months in reverse to find the most recent transition
  for (let i = 0; i < transitions.length; i++) {
    const t = transitions[i];
    if (gMonth === t.m && gDay >= t.d) {
      bMonthIndex = i;
      transitionDay = t.d;
      break;
    } else if (gMonth === (t.m + 1) % 12 && gDay < transitions[(i + 1) % 12].d) {
      bMonthIndex = i;
      transitionDay = t.d;
      break;
    }
  }

  // Calculate the day of the month
  // Note: This is an approximation; traditional days start at sunrise.
  let bDay: number;
  if (gDay >= transitionDay) {
    bDay = gDay - transitionDay + 1;
  } else {
    // If we are in the first half of a Gregorian month, 
    // we take the remaining days from the previous Gregorian month.
    const prevMonthLastDay = new Date(gYear, gMonth, 0).getDate();
    const prevTransition = transitions[(bMonthIndex) % 12].d;
    bDay = (prevMonthLastDay - prevTransition + 1) + gDay;
  }

  return {
    day: bDay,
    month: MONTHS[bMonthIndex],
    year: bYear,
    era: "Bangabda"
  };
}

interface IncaDate {
  day: number;
  monthName: string;
  weekName: string;      // The Quechua name
  weekTranslation: string; // The English translation
  festival: string;
  meaning: string;
}

/**
 * Converts a Gregorian Date to the Inca Traditional Calendar (Pacha).
 * Includes the three 10-day "weeks" (Decadas) with separated translations.
 */
function toIncaDate(date: Date): IncaDate {
  const INCA_MONTHS = [
    { name: "Capac Raymi", festival: "Great Feast of the Sun", meaning: "Summer solstice; coming-of-age rituals." },
    { name: "Zamay", festival: "Month of Creation", meaning: "Penances and fasts; time to see the corn." },
    { name: "Jatunpucuy", festival: "Great Ripening", meaning: "Crops begin to mature; offerings of gold and silver." },
    { name: "Pachapucuy", festival: "Earth's Maturity", meaning: "First harvests; animal sacrifices for fertility." },
    { name: "Ariway", festival: "Harvest of Maize", meaning: "Ripening of corn and potatoes." },
    { name: "Aymoray", festival: "Harvest Month", meaning: "Principal harvest month; storing of crops." },
    { name: "Inti Raymi", festival: "Festival of the Sun", meaning: "Winter solstice; honors the sun god Inti." },
    { name: "Chaguahuarquis", festival: "Land Distribution", meaning: "Dividing land; preparing for new planting." },
    { name: "Yapaquis", festival: "Month of Sowing", meaning: "Main sowing season; renewal of the earth." },
    { name: "Coya Raymi", festival: "Queen’s Festival", meaning: "Honors the queen; warding off evil spirits." },
    { name: "Uma Raymi", festival: "Water Invocation", meaning: "Season to ask for rain for the new crops." },
    { name: "Ayamarca", festival: "Feast of the Dead", meaning: "Worshipping and honoring ancestors." }
  ];

  const INCA_WEEKS = [
    { quechua: "Puntan Chani", english: "Beginning" },
    { quechua: "Chaupi Chani", english: "Middle" },
    { quechua: "Qhepa Chani", english: "End" }
  ];

  const currentYear = date.getFullYear();
  let startOfYear = new Date(currentYear, 11, 21);
  
  if (date < startOfYear) {
    startOfYear = new Date(currentYear - 1, 11, 21);
  }

  const diffInMs = date.getTime() - startOfYear.getTime();
  const totalDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  const monthIndex = Math.min(Math.floor(totalDays / 30), 11);
  const dayOfMonth = (totalDays % 30) + 1;

  const weekIndex = Math.min(Math.floor((dayOfMonth - 1) / 10), 2);

  const month = INCA_MONTHS[monthIndex];
  const week = INCA_WEEKS[weekIndex];

  return {
    day: dayOfMonth,
    monthName: month.name,
    weekName: week.quechua,
    weekTranslation: week.english,
    festival: month.festival,
    meaning: month.meaning
  };
}

interface BerberDate {
  day: number;
  month: string;
  year: number; // The Amazigh Era (e.g., 2976)
}

/**
 * Converts a Date to the Berber (Amazigh) Calendar.
 * The Berber year is Gregorian + 950.
 */
function toBerberDate(date: Date): BerberDate {
  const MONTHS = [
    "Yennayer", "Fura yer", "Meghres", "Ibrir", "Mayyu", "Yunyu",
    "Yulyu", "Ghusht", "Shtember", "Ktuber", "Nwanber", "Dujanber"
  ];

  const gYear = date.getFullYear();
  const amazighYear = gYear + 950; // Year 0 established at 950 BC

  // The Berber agricultural New Year falls on January 14th
  const isAfterNewYear = (date.getMonth() > 0) || (date.getMonth() === 0 && date.getDate() >= 14);
  const year = isAfterNewYear ? amazighYear : amazighYear - 1;

  // Uses Julian-style month lengths; January 1st (Yennayer 1) is Jan 14 Gregorian
  const refStart = new Date(isAfterNewYear ? gYear : gYear - 1, 0, 14);
  const diffInDays = Math.floor((date.getTime() - refStart.getTime()) / 86400000);

  // Simplified mapping to 12 months based on Julian lengths
  const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let d = diffInDays + 1;
  let mIdx = 0;
  
  for (let i = 0; i < 12; i++) {
    if (d <= monthLengths[i]) { mIdx = i; break; }
    d -= monthLengths[i];
  }

  return { day: d, month: MONTHS[mIdx], year };
}

interface FijianAlmanacDate {
  monthName: string;
  translation: string;
  ecologicalSign: string;
}
/**
 * Returns the Fijian Traditional Month (Vula Vakaviti) and 
 * its corresponding ecological indicator for agriculture and fishing.
 */
function toFijianAlmanac(date: Date): FijianAlmanacDate {
  const month = date.getMonth(); // 0-indexed (Jan = 0)

  const ALMANAC: Record<number, FijianAlmanacDate> = {
    0: { 
      monthName: "Vula i Nuqa Levu", 
      translation: "Big Rabbitfish Month", 
      ecologicalSign: "Schools of large rabbitfish spawn inshore; oranges are ripe for picking." 
    },
    1: { 
      monthName: "Vula i Sevu", 
      translation: "First Harvest Month", 
      ecologicalSign: "First-fruits (yams) are harvested and offered; 'lololo' (storehouses) are built." 
    },
    2: { 
      monthName: "Vula i Kelikeli", 
      translation: "Main Digging Month", 
      ecologicalSign: "The principal yam harvest begins for subsistence and trade." 
    },
    3: { 
      monthName: "Vula i Gasau", 
      translation: "Reed Flowering Month", 
      ecologicalSign: "Reeds (gasau) flower; rainy month; house building traditionally begins." 
    },
    4: { 
      monthName: "Vula i Doi", 
      translation: "Doi Tree Month", 
      ecologicalSign: "Doi trees flower; tarawau fruit is ripe; mosquitos and flies decrease." 
    },
    5: { 
      monthName: "Vula i Werewere", 
      translation: "Land Clearing Month", 
      ecologicalSign: "Clearing land for planting; kavika (Malay apple) and wi fruit are ripe." 
    },
    6: { 
      monthName: "Vula i Cukicuki", 
      translation: "Ploughing Month", 
      ecologicalSign: "Breaking ground for new yam beds; ivi (Tahitian chestnut) begins to flower." 
    },
    7: { 
      monthName: "Vula i Senidrala", 
      translation: "Coral Tree Month", 
      ecologicalSign: "Drala (Coral tree) flowers; coldest month; octopus are plentiful on reefs." 
    },
    8: { 
      monthName: "Vula i Vavakada", 
      translation: "Yam Staking Month", 
      ecologicalSign: "Yam vines are tied to reeds (vavakada); mango and dalo are planted." 
    },
    9: { 
      monthName: "Vula i Balolo Lailai", 
      translation: "Small Balolo Month", 
      ecologicalSign: "A small rise of balolo (sea worms); kawakawa (rock cod) spawn." 
    },
    10: { 
      monthName: "Vula i Balolo Levu", 
      translation: "Great Balolo Month", 
      ecologicalSign: "The main balolo worm rising; peak fishing season for marine resources." 
    },
    11: { 
      monthName: "Vula i Nuqa Lailai", 
      translation: "Small Rabbitfish Month", 
      ecologicalSign: "Small quantities of rabbitfish appear; breadfruit is planted." 
    }
  };

  return ALMANAC[month];
}

export const calendars = [
    {
        id: "EUWE",
        name: "Gregorian Calendar",
        group: "Italian",
        function: (x: Date) => x.toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    },
    {
        id: "AMCE",
        name: "Tonalpohualli",
        group: "Aztec",
        function: (x: Date) => getTonalpohualli(x).toString()
    },
    {
        id: "ASWE",
        name: "Al-taqwīm al-hijrī",
        group: "Arabic",
        function: (x: Date) => `${toIslamicDate(x).day} ${toIslamicDate(x).month} ${toIslamicDate(x).year}`
    },
    {
        id: "AFWE",
        name: "Ọ̀gụ́àfọ̀ Ị̀gbò",
        group: "Igbo",
        function: (x: Date) => `${toIgboDate(x).marketDay} ${toIgboDate(x).month}`
    },
    {
        id: "ASEA",
        name: "Nónglì",
        group: "Chinese",
        function: (x: Date) => `${toTransliteratedChineseDate(x).lunarDay} ${toTransliteratedChineseDate(x).lunarMonth}`
    },
    {
        id: "OCPL",
        name: "Kaulana Mahina",
        group: "Hawaiian",
        function: (x: Date) => `${toHawaiianLunarDate(x).dayOfCycle} ${toHawaiianLunarDate(x).moonPhase}`
    },
    {
        id: "ASSO",
        name: "Bôṅgābdô",
        group: "Bengali",
        function: (x: Date) => `${toTraditionalBengali(x).day} ${toTraditionalBengali(x).month} ${toTraditionalBengali(x).year}`
    },
    {
        id: "AMWE",
        name: "Intihuatana",
        group: "Andean",
        function: (x: Date) => `${toIncaDate(x).day} ${toIncaDate(x).monthName}`
    },
    {
        id: "AFNO",
        name: "Taswast Tamaziɣt",
        group: "Amazigh",
        function: (x: Date) => `${toBerberDate(x).day} ${toBerberDate(x).month} ${toBerberDate(x).year}`
    },
    {
        id: "OCML",
        name: "Vula Vakaviti",
        group: "Fijian",
        function: (x: Date) => `${toFijianAlmanac(x).translation}`
    },
];