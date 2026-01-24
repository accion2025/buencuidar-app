/**
 * Utilidad para traducir mensajes de error de Supabase al español
 */

export const translateSupabaseError = (errorMessage) => {
    if (!errorMessage) return 'Ha ocurrido un error desconocido';

    const translations = {
        // Errores de autenticación
        'Invalid login credentials': 'Credenciales de inicio de sesión inválidas',
        'Email not confirmed': 'Correo electrónico no confirmado',
        'User already registered': 'El usuario ya está registrado',
        'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
        'Unable to validate email address: invalid format': 'No se puede validar la dirección de correo electrónico: formato inválido',
        'Anonymous sign-ins are disabled': 'Los inicios de sesión anónimos están deshabilitados',
        'Email rate limit exceeded': 'Se ha excedido el límite de correos electrónicos',
        'Signup requires a valid password': 'El registro requiere una contraseña válida',

        // Errores de base de datos
        'duplicate key value violates unique constraint': 'Este valor ya existe en el sistema',
        'violates foreign key constraint': 'Referencia inválida en la base de datos',
        'new row violates row-level security policy': 'No tienes permisos para realizar esta acción',

        // Errores de red
        'Failed to fetch': 'Error de conexión. Verifica tu conexión a internet',
        'Network request failed': 'Falló la solicitud de red',

        // Otros errores comunes
        'User not found': 'Usuario no encontrado',
        'Invalid email or password': 'Correo electrónico o contraseña inválidos',
        'Session expired': 'La sesión ha expirado',
        'Unauthorized': 'No autorizado',
    };

    // Buscar coincidencia exacta
    if (translations[errorMessage]) {
        return translations[errorMessage];
    }

    // Buscar coincidencia parcial
    for (const [key, value] of Object.entries(translations)) {
        if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }

    // Si no hay traducción, devolver el mensaje original
    return errorMessage;
};

/**
 * Traduce estados de citas de inglés a español
 */
export const translateAppointmentStatus = (status) => {
    const statusMap = {
        'pending': 'Pendiente',
        'confirmed': 'Confirmada',
        'completed': 'Completada',
        'cancelled': 'Cancelada',
        'in_progress': 'En Progreso'
    };

    return statusMap[status] || status;
};

/**
 * Traduce tipos de citas de inglés a español
 */
export const translateAppointmentType = (type) => {
    const typeMap = {
        'medical': 'Acompañamiento a Cita',
        'therapy': 'Rutina de Ejercicios',
        'care': 'Cuidados / Acompañamiento',
        'emergency': 'Emergencia',
        'routine': 'Rutina',
        'followup': 'Seguimiento'
    };

    return typeMap[type] || type;
};
