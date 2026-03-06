/**
 * Utilidades para el manejo de números de teléfono dinámicos en BuenCuidar.
 */

export const PHONE_PREFIXES = {
    nicaragua: '+505 ',
    costa_rica: '+506 '
};

/**
 * Normaliza un número de teléfono asegurando el prefijo correcto según el país.
 * @param {string} value - El valor actual del input.
 * @param {string} country - El ID del país ('nicaragua', 'costa_rica', etc.)
 * @returns {string} - El teléfono formateado.
 */
export const formatPhoneNumber = (value, country = 'nicaragua') => {
    const prefix = PHONE_PREFIXES[country] || PHONE_PREFIXES.nicaragua;

    // Si está vacío, devolver el prefijo
    if (!value) return prefix;

    // Quitar todos los espacios para limpiar y procesar
    let cleanValue = value.replace(/\s+/g, '');

    // Si el usuario borra todo excepto el '+', restaurar prefijo
    if (cleanValue === '+') return prefix;

    // Lista de todos los prefijos numéricos conocidos (sin el '+')
    const allPrefixDigits = Object.values(PHONE_PREFIXES).map(p => p.replace(/\D/g, ''));

    // Extraer solo los dígitos del valor ingresado
    let digits = cleanValue.replace(/\D/g, '');

    // Verificar si el valor ya comienza con alguno de los prefijos conocidos
    for (const pDigits of allPrefixDigits) {
        if (digits.startsWith(pDigits)) {
            // Si coincide, quitamos ese prefijo de los dígitos para quedarnos solo con el número local
            digits = digits.slice(pDigits.length);
            break;
        }
    }

    // Retornar el prefijo del país actual + los dígitos restantes
    return prefix + digits;
};

/**
 * Valida si un número de teléfono tiene el prefijo correcto y una longitud mínima razonable.
 * @param {string} phone 
 * @param {string} country 
 */
export const isValidPhone = (phone, country = 'nicaragua') => {
    const prefix = (PHONE_PREFIXES[country] || PHONE_PREFIXES.nicaragua).trim();
    if (!phone || !phone.startsWith(prefix)) return false;

    const digits = phone.replace(/\D/g, '');
    const prefixDigits = prefix.replace(/\D/g, '');

    // Al menos 8 dígitos después del prefijo
    return (digits.length - prefixDigits.length) >= 8;
};
