

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
  lunarYear: string;
  lunarMonth: string; // Transliterated name (e.g., "Zhengyue")
  lunarDay: number;
}

/**
 * Converts a Gregorian Date to Chinese Lunar date with transliterated month names.
 */
function toTransliteratedChineseDate(date: Date): TransliteratedLunarDate {
  // Mapping of lunar month indices to Pinyin transliterations
  const PINYIN_MONTHS = [
    "Zhengyue", "Eryue", "Sanyue", "Siyue", "Wuyue", "Liuyue", 
    "Qiyue", "Bayue", "Jiuyue", "Shiyue", "Shiyiyue", "Layue"
  ];

  // We use numeric month to easily map to our array
  const formatter = new Intl.DateTimeFormat('en-u-ca-chinese', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  const monthNum = parseInt(getPart('month'), 10);
  const isLeap = parts.some(p => p.type === 'month' && p.value.includes('Leap'));

  // Handle month names: Month 1 is index 0, but check for potential 13th (leap) month
  let transliteratedMonth = PINYIN_MONTHS[monthNum - 1] || `Month ${monthNum}`;
  if (isLeap) {
    transliteratedMonth = `Run ${transliteratedMonth}`; // "Run" indicates a leap month
  }

  return {
    lunarYear: getPart('year'),
    lunarMonth: transliteratedMonth,
    lunarDay: parseInt(getPart('day'), 10),
  };
}

export const calendars = [
    {
        id: "EUWE",
        name: "Gregorian Calendar",
        group: "Italian",
        function: (x: Date) => x.toLocaleString('en-GB', { day: 'numeric', month: 'long' })
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
        group: "Islamic",
        function: (x: Date) => `${toIslamicDate(x).day} ${toIslamicDate(x).month}`
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
];