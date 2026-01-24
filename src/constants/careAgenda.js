export const CARE_AGENDA_CATEGORIES = [
    {
        id: 'cognitive',
        name: 'Acompañamiento Cognitivo',
        description: 'Mente, memoria, conversación, orientación',
        icon: 'Brain',
        activities: [
            'Conversación guiada sobre el día',
            'Lectura acompañada',
            'Juegos de memoria sencillos',
            'Recordatorio de fechas y rutinas',
            'Revisión de fotos familiares',
            'Escritura o dibujo libre',
            'Escuchar música preferida',
            'Orientación de tiempo y lugar'
        ]
    },
    {
        id: 'mobility',
        name: 'Asistencia de Movilidad',
        description: 'Movimiento, seguridad física, independencia',
        icon: 'Activity',
        activities: [
            'Caminata supervisada',
            'Apoyo al levantarse y sentarse',
            'Traslado cama–silla',
            'Apoyo en baño seguro',
            'Colocación de calzado',
            'Manejo de silla de ruedas',
            'Desplazamiento dentro del hogar',
            'Acompañamiento en salidas'
        ]
    },
    {
        id: 'dependent_life',
        name: 'Gestión de Vida Dependiente',
        description: 'Rutina integral, cuidados continuos',
        icon: 'ClipboardList',
        activities: [
            'Organización del día',
            'Supervisión de descanso',
            'Acompañamiento en comidas',
            'Higiene personal',
            'Cambio de ropa',
            'Supervisión general',
            'Rutina nocturna',
            'Comunicación con familia'
        ]
    },
    {
        id: 'technical_advanced',
        name: 'Apoyo Técnico Avanzado',
        description: 'Procedimientos y seguimiento especializado',
        icon: 'ShieldCheck',
        activities: [
            'Apoyo en procedimientos indicados',
            'Seguimiento de indicaciones externas',
            'Apoyo en curaciones básicas',
            'Supervisión de hidratación especial',
            'Uso de equipos autorizados',
            'Registro de indicadores básicos',
            'Coordinación con profesionales',
            'Observación especializada'
        ]
    },
    {
        id: 'connective',
        name: 'Cuidado Conectivo',
        description: 'Compañía, ánimo, vínculo emocional',
        icon: 'Heart',
        activities: [
            'Conversación afectiva',
            'Compartir merienda',
            'Juegos de mesa',
            'Ver programas juntos',
            'Paseo corto al aire libre',
            'Manualidades',
            'Cantar o escuchar música',
            'Videollamada con familia'
        ]
    },
    {
        id: 'technical_routine',
        name: 'Cuidado Técnico',
        description: 'Apoyo certificado en rutinas complejas',
        icon: 'Stethoscope',
        activities: [
            'Organización de rutinas especiales',
            'Apoyo en ejercicios guiados',
            'Preparación adaptada de alimentos',
            'Registro detallado de actividades',
            'Uso de apoyos técnicos',
            'Higiene asistida avanzada',
            'Supervisión estructurada',
            'Acompañamiento especializado'
        ]
    },
    {
        id: 'high_specialized',
        name: 'Cuidado de Alta Especialización',
        description: 'Cuidado Especial Avanzado',
        icon: 'UserCog',
        activities: [
            'Seguimiento de planes externos',
            'Supervisión continua',
            'Apoyo en procesos delicados',
            'Registro ampliado',
            'Atención prolongada',
            'Cuidados técnicos avanzados',
            'Observación continua',
            'Coordinación institucional'
        ]
    },
    {
        id: 'home_food',
        name: 'Apoyo en el Hogar y Alimentación',
        description: 'Alimentación, orden y logística',
        icon: 'Home',
        sections: [
            {
                name: 'Alimentación',
                activities: [
                    'Preparación sencilla de alimentos',
                    'Calentado y servido de comidas',
                    'Preparación de meriendas',
                    'Corte y adaptación de alimentos',
                    'Supervisión durante comidas',
                    'Organización de horarios de comida',
                    'Hidratación asistida',
                    'Limpieza básica post-comida'
                ]
            },
            {
                name: 'Orden Básico',
                activities: [
                    'Organización del espacio personal',
                    'Limpieza ligera del área usada',
                    'Cambio de sábanas',
                    'Lavado básico de ropa',
                    'Doblado y guardado',
                    'Organización de medicamentos (no administración)'
                ]
            },
            {
                name: 'Apoyo Logístico',
                activities: [
                    'Compras pequeñas cercanas',
                    'Recepción de pedidos',
                    'Organización de despensa',
                    'Preparación de lista de compras',
                    'Acompañamiento a mercado'
                ]
            }
        ]
    }
];
