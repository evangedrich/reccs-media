function getGregorianTranslation(date: Date) {
    const literalMonths = [
        "Transitions",      // January (Month of Janus)
        "Purification", // February (Month of Februa/purification)
        "War",       // March (Month of Mars)
        "Opening",    // April (Month of Aperire/opening - as in buds)
        "Growth",       // May (Month of Maia)
        "Marriage",       // June (Month of Juno)
        "Julius",     // July (Named after Julius Caesar)
        "Augustus",   // August (Named after Augustus Caesar)
        "Month 7",      // September (7th month)
        "Month 8",      // October (8th month)
        "Month 9",       // November (9th month)
        "Month 10"         // December (10th month)
    ];

    const day = String(date.getDate()); //.padStart(2, '0');
    const monthName = literalMonths[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${monthName} ${year}`;
}

function getTonalpohualli(targetDate: Date) {
    const daySigns = [
        "Cipactli", "Ehecatl", "Calli", "Cuetzpalin", "Coatl", 
        "Miquiztli", "Mazatl", "Tochtli", "Atl", "Itzcuintli", 
        "Ozomahtli", "Malinalli", "Acatl", "Ocelotl", "Cuauhtli", 
        "Cozcaquauhtli", "Ollin", "Tecpatl", "Quiahuitl", "Xochitl"
    ];
    const daySignsEn = [
        "Crocodile", "Wind", "House", "Lizard", "Snake", 
        "Death", "Deer", "Rabbit", "Water", "Dog", 
        "Monkey", "Grass", "Reed", "Jaguar", "Eagle", 
        "Vulture", "Movement", "Flint", "Rain", "Flower"
    ];

    const yearBearers = ["Tochtli", "Acatl", "Tecpatl", "Calli"];
    const yearBearersEn = ["Rabbit", "Reed", "Flint", "House"];

    const anchorDate = new Date(1521, 7, 23); 
    const d1 = Date.UTC(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate());
    const d2 = Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const diffDays = Math.floor((d2 - d1) / (24 * 60 * 60 * 1000));

    // 1. Tonalpohualli (260-day cycle)
    const tonNumber = ((diffDays % 13) + 13) % 13 + 1;
    const tonSignIndex = (((4 + diffDays) % 20) + 20) % 20;
    const tonSign = daySigns[tonSignIndex];
    const tonSignEn = daySignsEn[tonSignIndex];

    // 2. Xiuhmolpilli (52-year cycle)
    // The Aztec year typically starts in February. 
    // If the date is before Feb 1st, we treat it as the previous Aztec year.
    const yearShift = targetDate.getMonth() < 1 ? -1 : 0;
    const currentYear = targetDate.getFullYear() + yearShift;

    // Anchor: 1521 was a "3 Calli" year.
    // 3 Calli is the 26th year in the 1 Tochtli -> 13 Calli sequence.
    const diffYears = currentYear - 1521;
    
    // Position in the 52-year cycle (1-52)
    // (Start index 26 + diff) mod 52
    const cycleIndex = (((25 + diffYears) % 52) + 52) % 52 + 1;

    // Calculate Year Name (Number + Bearer)
    // Number (1-13): Anchor was 3.
    const yearNumber = (((2 + diffYears) % 13) + 13) % 13 + 1;
    // Bearer (0-3): Anchor was "Calli" (index 3).
    const yearBearer = yearBearers[(((3 + diffYears) % 4) + 4) % 4];
    const yearBearerEn = yearBearersEn[(((3 + diffYears) % 4) + 4) % 4];

    return {
        number: tonNumber,
        sign: tonSign,
        cycleYear: cycleIndex,
        yearName: `${yearNumber} ${yearBearer}`,
        toString: () => `${tonNumber}-${tonSign} ${yearNumber}-${yearBearer}`,
        toStringEn: () => `${tonNumber}-${tonSignEn} ${yearNumber}-${yearBearerEn}`
    };
}

function toIslamicDate(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Literal translations of the Hijri month names
  const monthTranslations: { [key: string]: string } = {
    "Muharram": "Forbidden",               // Sacred month where fighting was forbidden
    "Safar": "Void",                       // Empty (houses were empty as people gathered food)
    "Rabiʻ I": "Spring 1",         // First month of grazing/spring
    "Rabiʻ II": "Spring 2",       // Second month of grazing/spring
    "Jumada I": "Parched Land 1",  // First month of dry/frozen water
    "Jumada II": "Parched Land 2",// Second month of dry/frozen water
    "Rajab": "Respect",                    // A month of honor/removing spearheads
    "Shaʻban": "Scattered",                // Tribes dispersed to find water
    "Ramadan": "Scorching Heat",           // Intense heat/burning of sins
    "Shawwal": "Lifted",                   // She-camels lifting tails (breeding season)
    "Dhuʻl-Qiʻdah": "Truce Month",    // The month of sitting/staying at home
    "Dhuʻl-Hijjah": "Pilgrimage Month" // The month of the Hajj
  };
  const monthArabic: { [key: string]: string } = {
    "Muharram": "محرم", "Safar": "صفر", "Rabiʻ I": "ربيع الأول", "Rabiʻ II": "ربيع الآخر", "Jumada I": "جمادى الأولى", "Jumada II": "جمادى الآخرة",
    "Rajab": "رجب", "Shaʻban": "شعبان", "Ramadan": "رمضان", "Shawwal": "شوال", "Dhuʻl-Qiʻdah": "ذو القعدة", "Dhuʻl-Hijjah": "ذو الحجة"
  };

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(part => part.type === type)?.value || '';

  const day = parseInt(getPart('day'), 10);
  const month = getPart('month');
  const year = parseInt(getPart('year'), 10);
  const literalMonth = monthTranslations[month] || month;
  const arabicMonth = monthArabic[month] || month;

  return {
    day,
    month,
    year,
    toStringEn: () => `${day} ${literalMonth} ${year}`,
    toStringArab: () => `${day.toLocaleString('ar-EG')} ${arabicMonth} ${year.toLocaleString('ar-EG')}`
  };
}

function toIgboDate(date: Date) {
  const IGBO_MARKET_DAYS = ["Eke", "Orie", "Afọ", "Nkwọ"];
  
  // Literal translations for the 4-day cycle
  const marketDayTranslations: { [key: string]: string } = {
    "Eke": "Creation",    // Associated with the East and Fire
    "Orie": "Limitation", // Associated with the West and Water (also 'Boundary')
    "Afọ": "Life/Belly",  // Associated with the North and Earth
    "Nkwọ": "Rest/End",   // Associated with the South and Air
  };

  const IGBO_MONTHS = [
    "Ọnwa Mbụ", "Ọnwa Abụo", "Ọnwa Ife Eke", "Ọnwa Anọ", "Ọnwa Agwụ",
    "Ọnwa Ifejiọkụ", "Ọnwa Alọm Chi", "Ọnwa Ilo Mmụọ", "Ọnwa Ana",
    "Ọnwa Okike", "Ọnwa Ajana", "Ọnwa Ede Ajana", "Ọnwa Ụzọ Alụsị"
  ];

  const monthTranslations = [
    "Month 1",               
    "Month 2",              
    "Eke Offering", 
    "Month 4",              
    "Agwụ Spirit",  
    "Yam Deity",    
    "Returning to Chi", 
    "Honoring Spirits", 
    "Earth Deity",  
    "Creation",         
    "Ajana Spirit", 
    "Cocoyam Harvest",  
    "Shrine Path"
  ];

  const referenceDate = Date.UTC(2000, 0, 1);
  const targetDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const diffInMs = targetDate - referenceDate;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  const marketDayIndex = ((diffInDays % 4) + 4) % 4;
  const yearStart = Date.UTC(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((targetDate - yearStart) / (1000 * 60 * 60 * 24));
  const monthIndex = Math.min(Math.floor(dayOfYear / 28), 12);

  const marketDay = IGBO_MARKET_DAYS[marketDayIndex];
  const literalMarketDay = marketDayTranslations[marketDay];
  const literalMonth = monthTranslations[monthIndex];

  return {
    marketDay,
    month: IGBO_MONTHS[monthIndex],
    monthIndex: monthIndex + 1,
    toStringEn: () => `${literalMarketDay}, ${literalMonth}`
  };
}


interface TransliteratedLunarDate {
  lunarYear: string;  // e.g., "Bǐngwǔnián"
  lunarMonth: string; // e.g., "Zhèngyuè"
  lunarDay: number;
  toStringTranslit: () => string;
  toStringEnglish: () => string;
  toStringChinese: () => string;
}

/**
 * Converts a Date to the Chinese Lunar Calendar with Pinyin, 
 * Hanzi, and the Yellow Emperor era year.
 */
function toChineseDate(date: Date): TransliteratedLunarDate {
  const PINYIN_MONTHS = [
    "Zhèngyuè", "Èryuè", "Sānyuè", "Sìyuè", "Wǔyuè", "Liùyuè",
    "Qīyuè", "Bāyuè", "Jiǔyuè", "Shíyuè", "Shíyīyuè", "Làyuè"
  ];

  const HANZI_MONTHS = [
    "正月", "二月", "三月", "四月", "五月", "六月", 
    "七月", "八月", "九月", "十月", "十一月", "腊月"
  ];
  
  const ENGLISH_MONTHS = [
    "First Month", "Second Month", "Third Month", "Fourth Month", "Fifth Month", "Sixth Month",
    "Seventh Month", "Eighth Month", "Ninth Month", "Tenth Month", "Eleventh Month", "Preserved Month"
  ];

  const STEMS_PINYIN = ["Jiǎ", "Yǐ", "Bǐng", "Dīng", "Wù", "Jǐ", "Gēng", "Xīn", "Rén", "Guǐ"];
  const BRANCHES_PINYIN = ["Zǐ", "Chǒu", "Yín", "Mǎo", "Chén", "Sì", "Wǔ", "Wèi", "Shēn", "Yǒu", "Xū", "Hài"];
  
  const STEMS_HANZI = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const BRANCHES_HANZI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

  const formatter = new Intl.DateTimeFormat('en-u-ca-chinese', {
    month: 'numeric', 
    day: 'numeric',
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  const gYear = date.getFullYear();
  const gMonth = date.getMonth(); 
  const monthNum = parseInt(getPart('month'), 10);
  const dayNum = parseInt(getPart('day'), 10);

  // Determine correct Lunar Year boundary
  let lunarYearNum = gYear;
  if (gMonth <= 1 && monthNum >= 11) {
    lunarYearNum = gYear - 1;
  }

  // Yellow Emperor Year (Current Gregorian Year + 2697)
  const yellowEmperorYear = lunarYearNum + 2697;

  // Sexagenary Cycle (4 AD was Jiazi)
  const stemIdx = (((lunarYearNum - 4) % 10) + 10) % 10;
  const branchIdx = (((lunarYearNum - 4) % 12) + 12) % 12;
  
  const yearName = `${STEMS_PINYIN[stemIdx]}${BRANCHES_PINYIN[branchIdx].toLowerCase()}nián`;
  const yearHanzi = `${STEMS_HANZI[stemIdx]}${BRANCHES_HANZI[branchIdx]}年`;

  const isLeap = parts.some(p => p.type === 'month' && p.value.toLowerCase().includes('leap'));
  
  let transliteratedMonth = PINYIN_MONTHS[monthNum - 1];
  let chineseMonth = HANZI_MONTHS[monthNum - 1];
  let englishMonth = ENGLISH_MONTHS[monthNum - 1];

  if (isLeap) {
    transliteratedMonth = `Rùn ${transliteratedMonth}`;
    chineseMonth = `闰${chineseMonth}`;
    englishMonth = `Leap ${englishMonth}`;
  }

  const getChineseDay = (d: number) => {
    const units = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
    if (d <= 10) return d === 10 ? "初十" : `初${units[d]}`;
    if (d < 20) return `十${units[d % 10]}`;
    if (d === 20) return "二十";
    if (d < 30) return `廿${units[d % 10]}`;
    if (d === 30) return "三十";
    return `${d}`;
  };

  return {
    lunarYear: yearName,
    lunarMonth: transliteratedMonth,
    lunarDay: dayNum,
    toStringTranslit: () => `${dayNum} ${transliteratedMonth} ${yearName}`,
    toStringEnglish: () => `${dayNum} ${englishMonth} ${yellowEmperorYear}`,
    toStringChinese: () => `${yearHanzi}${chineseMonth}${getChineseDay(dayNum)}`
  };
}

interface HawaiianLunarDate {
  moonPhase: string;
  anahulu: string;
  dayOfCycle: number;
  toStringEn: () => string;
}

/**
 * Converts a Gregorian Date to the traditional Hawaiian Lunar Calendar (Kaulana Mahina).
 * Uses a precise synodic baseline to calculate the moon phase and corresponding Anahulu.
 */
function toHawaiianLunarDate(date: Date): HawaiianLunarDate {
  // Traditional 30 named nights of the Hawaiian moon cycle
  const MOON_PHASES = [
    "Hilo", "Hoaka", "Kūkahi", "Kūlua", "Kūkolu", "Kūpau", 
    "ʻOlekūkahi", "ʻOlekūlua", "ʻOlekūkolu", "ʻOlekūpau", 
    "Huna", "Mohalu", "Hua", "Akua", "Hoku", "Māhealani", 
    "Kulu", "Lāʻaukūkahi", "Lāʻaukūlua", "Lāʻaupau", 
    "ʻOlekūkahi", "ʻOlekūlua", "ʻOlekūpau", 
    "Kāloakūkahi", "Kāloakūlua", "Kāloapau", 
    "Kāne", "Lono", "Mauli", "Muku"
  ];

  const MOON_PHASES_EN = [
    "Faint Streak", "Crescent", "First Kū", "Second Kū", "Third Kū", "Final Kū",
    "First ʻOle", "Second ʻOle", "Third ʻOle", "Final ʻOle",
    "Hidden", "Spreading", "Fruit", "God", "Star", "Full Moon", "Dropping",
    "First Lāʻau", "Second Lāʻau", "Final Lāʻau",
    "First ʻOle Reprise", "Second ʻOle Reprise", "Final ʻOle Reprise",
    "First Kāloa", "Second Kāloa", "Final Kāloa",
    "Kāne", "Lono", "Last Breath", "Cut Off"
  ];

  // Astronomical Baseline: A known global New Moon occurred on Jan 11, 2024 at 11:57 UTC
  const newMoonRef = Date.UTC(2024, 0, 11, 11, 57, 0);
  
  // The precise length of a mean synodic lunar month in milliseconds (29.53059 days)
  const LUNAR_MONTH_MS = 29.530588853 * 24 * 60 * 60 * 1000;
  
  // Target date normalized to UTC time to maintain timezone consistency
  const targetTime = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes());
  
  // Calculate raw difference and account for dates prior to reference point
  let diff = targetTime - newMoonRef;
  if (diff < 0) {
    diff = (diff % LUNAR_MONTH_MS) + LUNAR_MONTH_MS;
  }

  // Convert the position in the current lunar month into a integer index from 0 to 29
  const positionInMonth = diff % LUNAR_MONTH_MS;
  const dayOfCycle = Math.floor(positionInMonth / (1000 * 60 * 60 * 24));
  
  // Defensive clamp to prevent overflow errors due to decimal edge conditions
  const phaseIndex = Math.min(dayOfCycle, 29);

  // Grouping into the three traditional 10-day Anahulu segments
  let anahulu = "";
  if (phaseIndex < 10) {
    anahulu = "Hoʻonui (Growing Bigger)";
  } else if (phaseIndex < 20) {
    anahulu = "Poepoe (Rounding/Full)";
  } else {
    anahulu = "Hōʻemi (Decreasing/Waning)";
  }

  return {
    moonPhase: MOON_PHASES[phaseIndex],
    anahulu: anahulu,
    dayOfCycle: phaseIndex + 1,
    toStringEn: () => `${phaseIndex + 1} ${MOON_PHASES_EN[phaseIndex]}`
  };
}

interface TraditionalBengaliDate {
  day: number;
  month: string;
  year: number;
  era: string; // "Bangabda" or "BS"
  toString: () => string;
  toStringBangla: () => string;
  toStringStar: () => string;
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
  const MONTHS_BNG = [
    "বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", 
    "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র" 
  ];
  const MONTHS_STAR = [
    "Branched", "Eldest", "Invincible", "Hearing", "Blessed Steps", "Horse-Headed",
    "Krittika", "Start of Year", "Prosper", "Mighty", "Fig Tree", "Brilliant"
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

  function convertN(n: number) {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return n.toString().replace(/\d/g, (digit: string) => bengaliDigits[Number(digit)]);
  }

  return {
    day: bDay,
    month: MONTHS[bMonthIndex],
    year: bYear,
    era: "Bangabda",
    toString: () => `${bDay} ${MONTHS[bMonthIndex]} ${bYear}`,
    toStringBangla: () => `${convertN(bDay)} ${MONTHS_BNG[bMonthIndex]} ${convertN(bYear)}`,
    toStringStar: () => `${bDay} ${MONTHS_STAR[bMonthIndex]} ${bYear}`,
  };
}

interface IncaDate {
  day: number;
  monthName: string;
  weekName: string;      // The Quechua name
  weekTranslation: string; // The English translation
  festival: string;
  meaning: string;
  toStringEn: () => string;
}

/**
 * Converts a Gregorian Date to the Inca Traditional Calendar (Pacha).
 * Includes the three 10-day "weeks" (Decadas) with separated translations.
 */
function toIncaDate(date: Date): IncaDate {
  const INCA_MONTHS = [
    { name: "Capac Raymi", festival: "Great Feast of the Sun", meaning: "Summer solstice; coming-of-age rituals." },
    { name: "Zamay", festival: "Creation Month", meaning: "Penances and fasts; time to see the corn." },
    { name: "Jatunpucuy", festival: "Great Ripening", meaning: "Crops begin to mature; offerings of gold and silver." },
    { name: "Pachapucuy", festival: "Earth's Maturity", meaning: "First harvests; animal sacrifices for fertility." },
    { name: "Ariway", festival: "Corn Harvest", meaning: "Ripening of corn and potatoes." },
    { name: "Aymoray", festival: "Harvest Month", meaning: "Principal harvest month; storing of crops." },
    { name: "Inti Raymi", festival: "Sun Festival", meaning: "Winter solstice; honors the sun god Inti." },
    { name: "Chaguahuarquis", festival: "Land Distribution", meaning: "Dividing land; preparing for new planting." },
    { name: "Yapaquis", festival: "Sowing Month", meaning: "Main sowing season; renewal of the earth." },
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
    meaning: month.meaning,
    toStringEn: () => `${dayOfMonth} ${month.festival}`
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
        name: { original: "Gregorian calendar", translation: "Gregorian calendar" },
        group: "Italian",
        function: (x: Date) => ( { original: x.toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), translation: getGregorianTranslation(x) } )
    },
    {
        id: "AMCE",
        name: { original: "Tonalpohualli", translation: "Count of Days" },
        group: "Mexica",
        function: (x: Date) => ( { original: getTonalpohualli(x).toString(), translation: getTonalpohualli(x).toStringEn() } )
    },
    {
        id: "ASWE",
        name: { original: "ٱلتَّقْوِيم ٱلْهِجْرِيّ", transliteration: "Al-taqwīm al-hijrī", reverseTransliteration: "هجري كاليندر", translation: "Hijri calendar" },
        group: "Arabic",
        function: (x: Date) => ( { original: toIslamicDate(x).toStringArab(), transliteration: `${toIslamicDate(x).day} ${toIslamicDate(x).month} ${toIslamicDate(x).year}`, translation: toIslamicDate(x).toStringEn() } )
    },
    {
        id: "AFWE",
        name: { original: "Ọ̀gụ́àfọ̀ Ị̀gbò", translation: "Igbo calendar" },
        group: "Igbo",
        function: (x: Date) => ( { original: `${toIgboDate(x).marketDay} ${toIgboDate(x).month}`, translation: toIgboDate(x).toStringEn() } )
    },
    {
        id: "ASEA",
        name: { original: "農曆", transliteration: "Nónglì", reverseTransliteration: "艾格里卡爾卓羅 凱倫德", translation: "Agricultural calendar" },
        group: "Chinese",
        function: (x: Date) => ( { original: toChineseDate(x).toStringChinese(), transliteration: toChineseDate(x).toStringTranslit(), translation: toChineseDate(x).toStringEnglish() } )
    },
    {
        id: "OCPL",
        name: { original: "Kaulana Mahina", translation: "Position of the Moon" },
        group: "Hawaiian",
        function: (x: Date) => ( { original: `${toHawaiianLunarDate(x).dayOfCycle} ${toHawaiianLunarDate(x).moonPhase}`, translation: toHawaiianLunarDate(x).toStringEn() } )
    },
    {
        id: "ASSO",
        name: { original: "বঙ্গাব্দ", transliteration: "Bôṅgābdô", reverseTransliteration: "বেঙ্গলি এরা", translation: "Bengali era" },
        group: "Bengali",
        function: (x: Date) => ( { original: toTraditionalBengali(x).toStringBangla(), transliteration: toTraditionalBengali(x).toString(), translation: toTraditionalBengali(x).toStringStar() } )
    },
    {
        id: "AMWE",
        name: { original: "Intihuatana", translation: "Anchor of the Sun" },
        group: "Quechua",
        function: (x: Date) => ( { original: `${toIncaDate(x).day} ${toIncaDate(x).monthName}`, translation: toIncaDate(x).toStringEn() } )
    },
    {
        id: "AFNO",
        name: { original: "Taswast Tamaziɣt", translation: "Amazigh calendar" },
        group: "Amazigh",
        function: (x: Date) => ( { original: `${toBerberDate(x).day} ${toBerberDate(x).month} ${toBerberDate(x).year}` } )
    },
    {
        id: "OCML",
        name: { original: "Vula Vakaviti", translation: "Fijian Months" },
        group: "Fijian",
        function: (x: Date) => ( { original: toFijianAlmanac(x).monthName, translation: toFijianAlmanac(x).translation } )
    },
];