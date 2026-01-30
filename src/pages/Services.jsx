import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Heart, Activity, UserCheck, Clock, ShieldCheck, Home as HomeIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Services = () => {
    const navigate = useNavigate();

    const services = [
        {
            icon: Heart,
            title: 'Acompañamiento Personal y Compañía',
            desc: 'Cuidado cercano y humano para personas que necesitan apoyo en su día a día. Brindamos compañía, asistencia en la rutina diaria, apoyo en movilidad básica y presencia constante para que tu familiar no esté solo.',
            idealFor: ['Personas mayores', 'Adultos con autonomía parcial', 'Familias que buscan tranquilidad']
        },
        {
            icon: Activity,
            title: 'Apoyo en Procesos de Recuperación Funcional',
            desc: 'Acompañamiento durante periodos de recuperación en casa o fuera de ella. Apoyo en la rutina indicada por la familia, cuidado personal, asistencia en actividades cotidianas y seguimiento básico del bienestar general.',
            idealFor: ['Periodos posteriores a eventos físicos exigentes', 'Recuperación en casa', 'Acompañamiento temporal con mayor atención']
        },
        {
            icon: UserCheck,
            title: 'Acompañamiento en Estancias Fuera del Hogar',
            desc: 'Presencia constante y apoyo emocional para personas que deben permanecer fuera de casa. Nuestros cuidadores ofrecen compañía, asistencia personal y comunicación con la familia durante la estancia.',
            idealFor: ['Estancias en centros de atención', 'Noches fuera del hogar', 'Familias con tiempo limitado']
        },
        {
            icon: HomeIcon,
            title: 'Apoyo en el Hogar y Rutinas Diarias',
            desc: 'Asistencia práctica para el bienestar del hogar y la persona acompañada. Incluye apoyo en tareas domésticas ligeras, compras, preparación de alimentos y organización básica del día.',
            idealFor: ['Personas que viven solas', 'Familias que necesitan apoyo diario', 'Rutinas estructuradas y seguras']
        },
        {
            icon: Clock,
            title: 'Cuidado Flexible por Horas o Jornadas Extendidas',
            desc: 'Un servicio adaptable a tu ritmo. Contrata acompañamiento por horas, turnos nocturnos, fines de semana o jornadas extendidas según tus necesidades.',
            idealFor: ['Necesidades variables', 'Apoyo continuo', 'Organización semanal o mensual']
        },
        {
            icon: ShieldCheck,
            title: 'Soporte Funcional Avanzado (bajo evaluación)',
            desc: 'Disponible solo para casos específicos que requieren cuidadores con experiencia técnica validada. Este servicio se evalúa de forma individual y siempre se presta como acompañamiento, sin intervención clínica directa.',
            idealFor: ['Casos específicos complejos', 'Requerimiento de experiencia técnica', 'Evaluación individual'],
            isSpecial: true
        }
    ];

    return (
        <div className="min-h-screen flex flex-col font-sans bg-gray-50">
            <Navbar />

            <header className="bg-[var(--primary-color)] !text-[#FAFAF7] h-[35px] flex items-center justify-center px-4 overflow-hidden relative z-10">
                <p className="text-xs md:text-sm whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                    <span className="font-bold mr-2">Cuidamos lo que más amas:</span>
                    <span className="text-green-100/90">Porque sabemos que cada familia es un mundo, diseñamos servicios que se adaptan a tu ritmo y a las necesidades de tu hogar.</span>
                </p>
            </header>

            <main className="w-full px-8 py-16">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, idx) => (
                        <div
                            key={idx}
                            className={`rounded-[16px] p-8 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 border group flex flex-col ${service.isSpecial
                                ? 'bg-amber-50 border-amber-200'
                                : 'bg-white border-gray-100'
                                }`}
                        >
                            <div className={`w-14 h-14 rounded-[16px] flex items-center justify-center mb-6 transition-colors ${service.isSpecial
                                ? 'bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white'
                                : 'bg-green-50 text-[var(--primary-color)] group-hover:bg-[var(--primary-color)] group-hover:text-white'
                                }`}>
                                <service.icon size={28} />
                            </div>

                            <h3 className="text-xl font-bold text-gray-800 mb-3 min-h-[56px] flex items-center">{service.title}</h3>
                            <p className="text-gray-600 mb-6 leading-relaxed flex-grow">{service.desc}</p>

                            <div className="mb-6 p-4 rounded-[16px] bg-gray-50/80">
                                <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide text-xs">Ideal para:</h4>
                                <ul className="space-y-2">
                                    {service.idealFor.map((item, i) => (
                                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${service.isSpecial ? 'bg-amber-400' : 'bg-green-400'
                                                }`} />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className={`pt-6 border-t flex flex-col gap-4 ${service.isSpecial ? 'border-amber-200' : 'border-gray-100'
                                }`}>
                                <p className="text-xs text-gray-500 italic text-center leading-relaxed">
                                    El costo depende de la ubicación, duración y nivel de acompañamiento.
                                </p>
                                <button
                                    onClick={() => navigate('/search')}
                                    className={`w-full py-2 rounded-[16px] font-bold text-sm transition-colors ${service.isSpecial
                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                        : 'bg-green-50 text-[var(--primary-color)] hover:bg-green-100'
                                        }`}
                                >
                                    Reservar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* FAQ Section aligned strictly under the center column */}
                <div className="mt-24 w-full">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="hidden md:block"></div>
                        <div className="flex flex-col">
                            <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">Queremos que te sientas seguro</h2>
                            <p className="text-gray-600 text-center mb-12">Resolvemos tus dudas para que des el paso con total confianza.</p>
                            <div className="space-y-4">
                                {[
                                    { q: "¿Qué incluye la verificación de cuidadores?", a: "Todos nuestros cuidadores pasan por revisión de antecedentes penales, verificación de identidad, validación de certificados y entrevistas psicológicas." },
                                    { q: "¿Puedo cambiar de cuidador si no estoy satisfecho?", a: "Absolutamente. Tu tranquilidad es primero. Si no hay 'química', te ayudamos a encontrar un reemplazo sin costo adicional." },
                                    { q: "¿Cómo funcionan los pagos?", a: "Los pagos se realizan de forma segura a través de la plataforma. El cuidador recibe su pago solo después de completar el servicio satisfactoriamente." }
                                ].map((faq, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-[16px] shadow-sm border border-gray-100">
                                        <h4 className="font-bold text-lg mb-2 text-gray-800">{faq.q}</h4>
                                        <p className="text-gray-600">{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="hidden md:block"></div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Services;
