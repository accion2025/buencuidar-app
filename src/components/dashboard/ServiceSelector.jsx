import React from 'react';
import { CheckCircle } from 'lucide-react';

const SERVICE_CATEGORIES = [
    {
        id: 'daily_life',
        icon: '🧍‍♂️',
        title: 'Vida Diaria y Autonomía',
        items: [
            { id: 'hygiene', label: 'Aseo personal básico', desc: 'Apoyo en higiene y cuidado diario.' },
            { id: 'mobility', label: 'Apoyo en movilidad', desc: 'Ayuda para caminar, sentarse o levantarse.' },
            { id: 'routine_org', label: 'Organización del día', desc: 'Apoyo en horarios y rutinas.' }
        ]
    },
    {
        id: 'home_routine',
        icon: '🏠',
        title: 'Hogar y Rutina',
        items: [
            { id: 'food_prep', label: 'Preparación sencilla de alimentos', desc: 'Ayuda para comidas básicas.' },
            { id: 'light_tasks', label: 'Apoyo en tareas ligeras', desc: 'Orden del espacio personal.' },
            { id: 'activity_reminders', label: 'Recordatorio de actividades', desc: 'Avisos para rutinas diarias.' }
        ]
    },
    {
        id: 'emotional',
        icon: '🤝',
        title: 'Compañía y Bienestar Emocional',
        items: [
            { id: 'active_company', label: 'Compañía activa', desc: 'Conversación y presencia.' },
            { id: 'emotional_support', label: 'Acompañamiento emocional', desc: 'Apoyo afectivo.' },
            { id: 'recreational', label: 'Actividades recreativas', desc: 'Juegos, lectura o música.' }
        ]
    },
    {
        id: 'mobility_trips',
        icon: '🚶',
        title: 'Movilidad y Traslados',
        items: [
            { id: 'outdoor_accompany', label: 'Acompañamiento fuera del hogar', desc: 'Salidas y paseos.' },
            { id: 'appointments_support', label: 'Apoyo en citas y gestiones', desc: 'Acompañar a trámites o visitas.' },
            { id: 'safe_transfers', label: 'Traslados seguros', desc: 'Apoyo durante recorridos.' }
        ]
    },
    {
        id: 'family_coord',
        icon: '📋',
        title: 'Apoyo Familiar y Coordinación',
        items: [
            { id: 'family_comm', label: 'Comunicación con la familia', desc: 'Reportes básicos del día.' },
            { id: 'routine_followup', label: 'Seguimiento de rutinas', desc: 'Verificar actividades.' },
            { id: 'agenda_org', label: 'Organización de agenda', desc: 'Apoyo con horarios.' }
        ]
    },
    {
        id: 'activation',
        icon: '🌿',
        title: 'Movimiento y Activación',
        items: [
            { id: 'gentle_walks', label: 'Caminatas suaves', desc: 'Paseos tranquilos.' },
            { id: 'light_exercises', label: 'Ejercicios ligeros', desc: 'Rutinas simples.' },
            { id: 'stretches', label: 'Estiramientos básicos', desc: 'Movimientos suaves.' }
        ]
    },
    {
        id: 'humanized_care',
        icon: '❤️',
        title: 'Cuidado Humanizado',
        items: [
            { id: 'close_presence', label: 'Presencia cercana', desc: 'Acompañamiento respetuoso.' },
            { id: 'personalized_attention', label: 'Atención personalizada', desc: 'Cuidado adaptado.' },
            { id: 'delicate_support', label: 'Apoyo en momentos delicados', desc: 'Presencia empática.' }
        ]
    }
];

const ServiceSelector = ({ selectedServices = [], onChange }) => {
    const handleToggle = (itemId) => {
        if (selectedServices.includes(itemId)) {
            onChange(selectedServices.filter(id => id !== itemId));
        } else {
            onChange([...selectedServices, itemId]);
        }
    };

    return (
        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {SERVICE_CATEGORIES.map((category) => (
                <div key={category.id} className="space-y-3">
                    <h4 className="text-sm font-black text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <span className="text-lg">{category.icon}</span>
                        {category.title.toUpperCase()}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                        {category.items.map((item) => {
                            const isSelected = selectedServices.includes(item.id);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleToggle(item.id)}
                                    className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer group ${isSelected
                                        ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                                        : 'border-gray-100 hover:border-gray-200 bg-white'
                                        }`}
                                >
                                    <div className={`mt-0.5 rounded-full p-0.5 transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>
                                        <CheckCircle size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-bold transition-colors ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                                            {item.label}
                                        </p>
                                        <p className={`text-[10px] mt-0.5 font-medium transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ServiceSelector;
export { SERVICE_CATEGORIES };

