export const formatLocation = (caregiver, details) => {
    if (!caregiver && !details) return 'Ubicación no disponible';

    // Extract country and determine abbreviation
    const countryRaw = (details?.country || caregiver?.country || 'Nicaragua').toLowerCase();
    let abbr = 'NIC';

    if (countryRaw.includes('costa')) abbr = 'CR';
    else if (countryRaw.includes('hond')) abbr = 'HN';
    else if (countryRaw.includes('salv')) abbr = 'SV';
    else if (countryRaw.includes('guat')) abbr = 'GT';
    else if (countryRaw.includes('panam')) abbr = 'PA';
    else if (!countryRaw.includes('nica')) abbr = countryRaw.substring(0, 3).toUpperCase();

    // Extract municipality
    const municipality = details?.municipality || caregiver?.municipality || '';

    if (municipality) {
        // Ensure we only take the first part if it's a comma-separated string
        const city = municipality.split(',')[0].trim();
        return `${city}, ${abbr}`;
    }

    // Fallback to address/location strings
    const rawLocation = details?.location || caregiver?.address || caregiver?.location || '';
    if (rawLocation) {
        const city = rawLocation.split(',')[0].trim();
        return city ? `${city}, ${abbr}` : `Nicaragua, ${abbr}`;
    }

    return `Nicaragua, ${abbr}`;
};
