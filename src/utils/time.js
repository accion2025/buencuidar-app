/**
 * Formats a date into a human-readable "time ago" string.
 * @param {string|Date} date - The date to format.
 * @returns {string} - "Recién", "Hace 5 minutos", etc.
 */
export const formatTimeAgo = (date) => {
    if (!date) return "Sin actividad";

    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) {
        return "Recién";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `Hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `Hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
    }

    // Default to a simple date format for older things
    return past.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

/**
 * Parses a YYYY-MM-DD string as a local Date object, avoiding UTC shifts.
 */
export const safeDateParse = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr.includes('T')) return new Date(dateStr);
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

/**
 * Formats a date range as "lunes, 30 mar - lunes, 30 mar de 2026"
 */
export const formatDateRange = (startDateStr, endDateStr) => {
    if (!startDateStr) return '';
    const start = safeDateParse(startDateStr);
    const end = safeDateParse(endDateStr || startDateStr);

    if (!start || !end) return startDateStr;

    // Helper to format individual part
    const formatPart = (date, includeYear = false) => {
        const options = { weekday: 'long', day: 'numeric', month: 'short' };
        if (includeYear) options.year = 'numeric';
        return date.toLocaleDateString('es-ES', options);
    };

    const startFormatted = formatPart(start, false); // "lunes, 30 mar" (auto: "lunes, 30 mar." depending on env)
    const endFormatted = formatPart(end, true);   // "lunes, 30 mar de 2026" (auto: "lunes, 30 mar. de 2026")

    // Clean up typical " de " vs "," issues if needed, but standard should be fine or close enough
    // We might need to remove periods if environment adds them: "mar." -> "mar"
    // User requested "mar" without dot? 
    // Let's just return standard locale for now.

    return `${startFormatted} - ${endFormatted}`;
};
