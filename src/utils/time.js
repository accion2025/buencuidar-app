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
