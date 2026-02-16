import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
    const { profile } = useAuth();

    // Normalización de planes (soporta IDs de tabla, nombres comerciales y legado)
    const rawPlan = (profile?.plan_type || 'base').toLowerCase();
    const role = profile?.role || 'family';
    const status = (profile?.subscription_status || 'active').toLowerCase(); // Permisivo por defecto

    let plan = 'base';

    if (role === 'caregiver' || role === 'admin') {
        plan = 'cuidado+';
    } else {
        // Solo bloqueamos si el estado es explícitamente inactivo o expirado
        const isInactive = status === 'inactive' || status === 'expired' || status === 'cancelled';

        if (!isInactive) {
            // Si el nombre del plan en DB contiene estas palabras, asignamos el tier correspondiente
            if (rawPlan.includes('plus') || rawPlan.includes('cuidado') || rawPlan.includes('premium') || rawPlan.includes('gold')) {
                plan = 'cuidado+';
            } else if (rawPlan.includes('pulso') || rawPlan.includes('silver')) {
                plan = 'pulso';
            } else if (rawPlan === 'base' || rawPlan === 'free' || rawPlan === 'gratis') {
                plan = 'base';
            } else {
                // FALLBACK DE SEGURIDAD:
                // Si el status es 'active' (o no es inactivo) pero el rawPlan no es reconocido,
                // por defecto damos acceso a PULSO (el nivel mínimo pagado).
                // Esto previene bloqueos por IDs como 'basic', 'default', etc.
                plan = 'pulso';
            }
        }
    }

    // Logging para depuración en vivo
    console.log(`[Permissions] User:${profile?.id} Role:${role} RawPlan:${rawPlan} Status:${status} -> Resolved:${plan}`);

    // Matriz de Capacidades
    const capabilities = {
        // Nivel Gratuito (Libertades actuales)
        base: [
            'chat',
            'searchCaregivers',
            'directInvite',
            'manageFamily',
            'viewBasicCalendar',
            'serviceExplorer',      // Elegir tipos de ayuda (Higiene, etc.)
            'requestManagement',    // Aprobar/Rechazar postulantes
            'ratingSystem',         // Calificar con estrellas
            'fullHistory',          // Ver citas pasadas
            'notificationCenter',   // Alertas de sistema
            'flexibleEditing'       // Cambiar datos de cita antes de iniciar
        ],
        // Nivel Intermedio (Incluye Base)
        pulso: [
            'accessMonitoring',
            'viewWellnessStats',
            'manualAgendaUpdate',
            'generate7DayReport',
            'receiveAlerts'
        ],
        // Nivel Premium (Incluye Pulso)
        'cuidado+': [
            'useSmartWizard',
            'accessSpecializedPrograms',
            'viewFullHistory'
        ]
    };

    /**
     * Valida si el plan actual tiene la capacidad solicitada
     * @param {string} cap - Nombre de la capacidad
     * @returns {boolean}
     */
    const can = (cap) => {
        // Master Bypass: Admin y Caregiver tienen acceso a TODO
        if (role === 'admin' || role === 'caregiver') return true;

        // 1. Verificar en Base (Todos tienen estas funciones)
        if (capabilities.base.includes(cap)) return true;

        // 2. Verificar en Pulso (Pulso y Cuidado+ las tienen)
        if (plan === 'pulso' || plan === 'cuidado+') {
            if (capabilities.pulso.includes(cap)) return true;
        }

        // 3. Verificar en Cuidado+ (Solo el nivel más alto)
        if (plan === 'cuidado+') {
            if (capabilities['cuidado+'].includes(cap)) return true;
        }

        return false;
    };

    return {
        can,
        plan,
        isBase: plan === 'base',
        isPulso: plan === 'pulso',
        isCuidadoPlus: plan === 'cuidado+'
    };
};
