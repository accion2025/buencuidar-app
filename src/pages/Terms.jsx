import React, { useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { ShieldCheck, Scale, FileText, UserCheck, AlertCircle } from 'lucide-react';

const Terms = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
            <Navbar />

            <main className="flex-grow pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-16 text-center animate-fade-in">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--secondary-color)]/10 rounded-2xl mb-6 text-[var(--secondary-color)]">
                            <Scale size={32} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-primary font-bold text-[var(--primary-color)] mb-4 tracking-tight">
                            Términos y Condiciones de Uso
                        </h1>
                        <p className="text-gray-500 font-secondary uppercase tracking-[0.2em] text-xs font-bold">
                            BuenCuidar (BC) • Última actualización: 2026
                        </p>
                    </div>

                    <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 p-8 md:p-16 border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--secondary-color)]/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

                        <div className="relative z-10 space-y-12 text-gray-700 leading-relaxed font-medium">
                            <section className="animate-fade-in-up">
                                <p className="text-lg md:text-xl text-[var(--primary-color)] font-semibold">
                                    Bienvenido a BuenCuidar. Al crear una cuenta y utilizar esta plataforma, aceptas los siguientes términos y condiciones. Te recomendamos leerlos cuidadosamente.
                                </p>
                            </section>

                            <hr className="border-slate-100" />

                            {/* Section 1 */}
                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-[var(--primary-color)] text-sm">1</span>
                                    Naturaleza de la plataforma
                                </h2>
                                <p>
                                    BuenCuidar es una plataforma digital cuyo propósito es facilitar la conexión entre personas que requieren servicios de cuidado y personas que ofrecen dichos servicios.
                                </p>
                                <div className="bg-slate-50 p-6 rounded-[24px] space-y-2 border border-slate-100">
                                    <p className="font-bold text-[var(--primary-color)] mb-2">BuenCuidar:</p>
                                    <ul className="grid md:grid-cols-2 gap-3 list-none">
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--secondary-color)]"></div> No es empleador de los cuidadores</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--secondary-color)]"></div> No contrata cuidadores en nombre de las familias</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--secondary-color)]"></div> No actúa como agencia de empleo</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--secondary-color)]"></div> No intermedia ni procesa pagos entre usuarios</li>
                                    </ul>
                                </div>
                                <p className="italic text-sm text-gray-500">
                                    La relación laboral o de servicio se establece exclusivamente entre las partes involucradas. BuenCuidar actúa únicamente como un medio de conexión.
                                </p>
                            </section>

                            {/* Section 2 */}
                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-[var(--primary-color)] text-sm">2</span>
                                    Creación de cuenta
                                </h2>
                                <p>Para utilizar la plataforma, debes:</p>
                                <ul className="space-y-3 pl-4">
                                    <li className="flex items-start gap-3"><ShieldCheck className="text-[var(--secondary-color)] mt-1 shrink-0" size={18} /> Proporcionar información veraz, completa y actualizada</li>
                                    <li className="flex items-start gap-3"><ShieldCheck className="text-[var(--secondary-color)] mt-1 shrink-0" size={18} /> Ser mayor de 18 años</li>
                                    <li className="flex items-start gap-3"><ShieldCheck className="text-[var(--secondary-color)] mt-1 shrink-0" size={18} /> Crear una sola cuenta personal</li>
                                    <li className="flex items-start gap-3"><ShieldCheck className="text-[var(--secondary-color)] mt-1 shrink-0" size={18} /> Mantener la confidencialidad de tu contraseña</li>
                                </ul>
                                <p className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-900 text-sm">
                                    Eres responsable de toda actividad realizada desde tu cuenta. BuenCuidar se reserva el derecho de suspender o eliminar cuentas que contengan información falsa o engañosa.
                                </p>
                            </section>

                            {/* Section 3 */}
                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-[var(--primary-color)] text-sm">3</span>
                                    Responsabilidad del usuario
                                </h2>
                                <p>Cada usuario es responsable de:</p>
                                <ul className="space-y-2 list-disc pl-6 text-sm">
                                    <li>La información que publica en su perfil</li>
                                    <li>Las decisiones que tome al contactar o contratar a otra persona</li>
                                    <li>Verificar personalmente la idoneidad de cualquier cuidador o familia</li>
                                    <li>Establecer sus propios acuerdos, condiciones y pagos</li>
                                </ul>
                                <p className="text-sm font-bold text-[var(--primary-color)] mt-4">
                                    BuenCuidar no garantiza la conducta, capacidad o disponibilidad de los usuarios.
                                </p>
                            </section>

                            {/* Section 4 */}
                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-[var(--primary-color)] text-sm">4</span>
                                    Verificación de información
                                </h2>
                                <p>
                                    BuenCuidar puede solicitar documentos para mejorar la confianza dentro de la plataforma, incluyendo documento de identidad, antecedentes penales, referencias y evaluaciones complementarias.
                                </p>
                                <div className="border-l-4 border-[var(--secondary-color)] pl-6 py-2 italic text-sm">
                                    Sin embargo, BuenCuidar no garantiza la exactitud absoluta de dicha información. La verificación es un proceso de confianza, no una certificación legal.
                                </div >
                            </section>

                            {/* Section 5 */}
                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-[var(--primary-color)] text-sm">5</span>
                                    Uso adecuado de la plataforma
                                </h2>
                                <p>Aceptas utilizar BuenCuidar de forma ética y respetuosa. Está prohibido:</p>
                                <ul className="grid md:grid-cols-2 gap-4">
                                    <li className="flex items-center gap-2 p-3 bg-red-50/50 rounded-xl text-xs"><AlertCircle className="text-red-400 shrink-0" size={14} /> Proporcionar información falsa</li>
                                    <li className="flex items-center gap-2 p-3 bg-red-50/50 rounded-xl text-xs"><AlertCircle className="text-red-400 shrink-0" size={14} /> Suplantar identidad</li>
                                    <li className="flex items-center gap-2 p-3 bg-red-50/50 rounded-xl text-xs"><AlertCircle className="text-red-400 shrink-0" size={14} /> Actividades ilegales</li>
                                    <li className="flex items-center gap-2 p-3 bg-red-50/50 rounded-xl text-xs"><AlertCircle className="text-red-400 shrink-0" size={14} /> Hostigar o discriminar</li>
                                </ul>
                            </section>

                            {/* Section 6 */}
                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-[var(--primary-color)] text-sm">6</span>
                                    Suscripciones
                                </h2>
                                <p>
                                    BuenCuidar ofrece planes gratuitos y planes opcionales de suscripción que pueden mejorar la visibilidad del perfil.
                                </p>
                                <ul className="space-y-2 text-sm text-gray-500">
                                    <li>• Son completamente opcionales</li>
                                    <li>• No garantizan empleo ni contratación</li>
                                    <li>• El usuario puede cancelar en cualquier momento</li>
                                </ul>
                            </section>

                            {/* Section 7 */}
                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-[var(--primary-color)] flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-[var(--primary-color)] text-sm">7</span>
                                    Limitación de responsabilidad
                                </h2>
                                <p className="uppercase text-[10px] font-black tracking-widest text-gray-400 mb-2">Advertencia Legal</p>
                                <p className="text-sm font-medium">
                                    BuenCuidar no es responsable por acuerdos realizados entre usuarios, pagos, incumplimientos o daños derivados de interacciones. Cada usuario es responsable de sus decisiones.
                                </p>
                            </section>

                            <hr className="border-slate-100" />

                            {/* Remaining Sections Simplified */}
                            <div className="grid md:grid-cols-2 gap-10">
                                <section className="space-y-3">
                                    <h3 className="font-bold text-[var(--primary-color)] flex items-center gap-2 uppercase tracking-widest text-xs">
                                        <FileText size={16} /> 8. Privacidad
                                    </h3>
                                    <p className="text-xs text-gray-500">Protegemos tu información personal. No será vendida a terceros y se usa solo para el funcionamiento de la plataforma.</p>
                                </section>
                                <section className="space-y-3">
                                    <h3 className="font-bold text-[var(--primary-color)] flex items-center gap-2 uppercase tracking-widest text-xs">
                                        <AlertCircle size={16} /> 9. Suspensión
                                    </h3>
                                    <p className="text-xs text-gray-500">Podemos eliminar cuentas que incumplan estos términos o representen un riesgo para otros usuarios.</p>
                                </section>
                            </div>

                            <section className="p-10 bg-[var(--primary-color)] rounded-[32px] text-center text-white space-y-6">
                                <UserCheck className="mx-auto text-[var(--secondary-color)]" size={48} />
                                <h2 className="text-2xl font-bold">11. Aceptación</h2>
                                <p className="text-blue-100 text-sm max-w-lg mx-auto leading-relaxed">
                                    Al crear una cuenta, confirmas que has leído estos términos, los comprendes y aceptas cumplirlos. BuenCuidar existe para construir un entorno de confianza y cuidado. Cada usuario forma parte de ese compromiso.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Terms;
