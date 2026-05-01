

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
    let tonNumber = ((diffDays % 13) + 13) % 13 + 1;

    // Calculate Tonalpohualli Sign (1-20)
    // Anchor was index 4 (Coatl). (4 + diff) % 20
    let tonSignIndex = (((4 + diffDays) % 20) + 20) % 20;
    let tonSign = daySigns[tonSignIndex];

    return {
        number: tonNumber,
        sign: tonSign,
        toString: () => `${tonNumber} ${tonSign}`
    };
}

export const calendars = [
    {
        name: "Gregorian Calendar",
        group: "Italian",
        function: getTonalpohualli
    },
    {
        name: "Tonalpohualli",
        group: "Aztec",
        function: getTonalpohualli
    },
];