import React, { useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { ShieldCheck, Scale, FileText, UserCheck, AlertCircle, Heart, Shield } from 'lucide-react';

const Terms = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen flex flex-col font-sans bg-gray-50">
            <Navbar />

            {/* Hero Section */}
            <header className="bg-[var(--primary-color)] text-[#FAFAF7] pt-[100px] pb-[80px] px-8 md:px-[60px] text-center w-full flex flex-col items-center justify-center">
                <h1
                    className="text-4xl md:text-5xl font-bold mb-6 w-full tracking-tight"
                    style={{ color: '#FAFAF7' }}
                >
                    Términos y Condiciones de Uso
                </h1>

                <div className="bg-[#0F3C4C]/30 backdrop-blur-sm border border-[#2FAE8F]/30 p-6 rounded-xl inline-block mt-4 mx-auto max-w-2xl">
                    <p className="text-lg text-gray-100 italic">
                        Bienvenidos a BuenCuidar. Al utilizar nuestra plataforma, te unes a una comunidad basada en la confianza y el respeto mutuo.
                    </p>
                </div>
            </header>

            <main className="w-full flex-grow">
                {/* 1. Naturaleza de la plataforma */}
                <section className="py-16 md:py-24 px-8 md:px-[60px] bg-white w-full">
                    <div className="max-w-[1440px] mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-brand font-bold text-[var(--primary-color)] mb-8 tracking-tighter">1. Naturaleza de la plataforma</h2>
                            <p className="text-xl text-gray-600 mb-12 leading-relaxed font-medium">
                                BuenCuidar (BC) es una plataforma digital cuyo propósito es facilitar la conexión entre personas que requieren servicios de cuidado y personas que ofrecen dichos servicios.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-10">
                            <div className="bg-gray-50 p-8 rounded-xl border border-gray-100 shadow-sm">
                                <h3 className="text-xl font-bold text-[var(--primary-color)] mb-6 flex items-center gap-3">
                                    <Shield size={24} className="text-[var(--secondary-color)]" /> Lo que BuenCuidar NO es:
                                </h3>
                                <ul className="space-y-4 text-gray-600 text-lg">
                                    <li className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-red-400 mt-2.5 shrink-0"></div>
                                        <span>No es empleador de los cuidadores.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-red-400 mt-2.5 shrink-0"></div>
                                        <span>No contrata cuidadores en nombre de las familias.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-red-400 mt-2.5 shrink-0"></div>
                                        <span>No actúa como agencia de empleo.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-red-400 mt-2.5 shrink-0"></div>
                                        <span>No intermedia ni procesa pagos entre usuarios.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="flex flex-col justify-center">
                                <p className="text-xl text-gray-600 leading-relaxed font-medium italic p-10 bg-blue-50 rounded-xl border border-blue-100 h-full flex items-center">
                                    "La relación laboral o de servicio se establece exclusivamente entre las partes involucradas. BuenCuidar actúa únicamente como un medio de conexión humano y tecnológico."
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Creación de cuenta & 3. Responsabilidad */}
                <section className="py-16 md:py-24 px-8 md:px-[60px] bg-gray-50 w-full">
                    <div className="max-w-[1440px] mx-auto">
                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="flex flex-col">
                                <h2 className="text-3xl font-brand font-bold text-[var(--primary-color)] mb-8 tracking-tighter">2. Creación de cuenta</h2>
                                <div className="bg-white p-8 md:p-10 rounded-xl border border-gray-100 shadow-sm flex-grow">
                                    <p className="text-lg text-gray-600 mb-8 font-medium">Para utilizar la plataforma, te comprometes a:</p>
                                    <ul className="space-y-4">
                                        {[
                                            'Proporcionar información veraz, completa y actualizada.',
                                            'Ser mayor de 18 años.',
                                            'Crear una sola cuenta personal.',
                                            'Mantener la confidencialidad de tu contraseña.'
                                        ].map((text, i) => (
                                            <li key={i} className="flex items-start gap-4">
                                                <ShieldCheck size={24} className="text-[var(--secondary-color)] shrink-0" />
                                                <span className="text-gray-700 font-medium">{text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <h2 className="text-3xl font-brand font-bold text-[var(--primary-color)] mb-8 tracking-tighter">3. Responsabilidad del usuario</h2>
                                <div className="bg-white p-8 md:p-10 rounded-xl border border-gray-100 shadow-sm flex-grow">
                                    <p className="text-lg text-gray-600 mb-8 font-medium">Cada usuario es soberano y responsable de:</p>
                                    <div className="space-y-6">
                                        <p className="italic text-gray-600 leading-relaxed text-lg">
                                            "La información que publica en su perfil y las decisiones que tome al contactar o contratar a otra persona."
                                        </p>
                                        <p className="italic text-gray-600 leading-relaxed text-lg">
                                            "Verificar personalmente la idoneidad de cualquier cuidador o familia."
                                        </p>
                                        <p className="italic text-gray-600 leading-relaxed text-lg">
                                            "Establecer sus propios acuerdos, condiciones y pagos de forma transparente."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Verificación & 5. Uso adecuado */}
                <section className="py-16 md:py-24 px-8 md:px-[60px] bg-white w-full">
                    <div className="max-w-[1440px] mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-brand font-bold text-[var(--primary-color)] mb-8 tracking-tighter">Confianza y Respeto</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="bg-[var(--primary-color)]/5 p-10 rounded-xl border border-[var(--primary-color)]/10 h-full">
                                <h3 className="text-2xl font-bold text-[var(--primary-color)] mb-4">4. Verificación de información</h3>
                                <p className="text-lg text-gray-600 leading-relaxed font-medium">
                                    BuenCuidar puede solicitar documentos para mejorar la confianza dentro de la plataforma (Identidad, antecedentes, referencias).
                                </p>
                                <p className="mt-4 text-gray-500 italic text-sm">
                                    Sin embargo, BuenCuidar no garantiza la exactitud absoluta de dicha información. La verificación es un proceso de confianza mutua.
                                </p>
                            </div>

                            <div className="bg-red-50 p-10 rounded-xl border border-red-100 h-full">
                                <h3 className="text-2xl font-bold text-red-800 mb-4">5. Uso adecuado</h3>
                                <p className="text-lg text-red-900/70 mb-6 font-medium">Está estrictamente prohibido:</p>
                                <div className="grid grid-cols-2 gap-4 text-sm font-bold uppercase tracking-wider text-red-800">
                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Mentir</div>
                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Suplantar</div>
                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Ilegalidad</div>
                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Hostigar</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. Suscripciones & 7. Limitación */}
                <section className="py-16 md:py-24 px-8 md:px-[60px] bg-gray-50 w-full">
                    <div className="max-w-[1440px] mx-auto text-center">
                        <h2 className="text-3xl md:text-5xl font-brand font-bold text-[var(--primary-color)] mb-12 tracking-tighter">Políticas del Servicio</h2>

                        <div className="grid md:grid-cols-2 gap-12 w-full">
                            <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[var(--primary-color)] mb-6">
                                    <FileText size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-4">6. Suscripciones</h3>
                                <p className="text-gray-600 text-lg">
                                    El uso esencial de BC es gratuito. Los planes opcionales (PULSO/PRO) mejoran la visibilidad pero no garantizan contrataciones. Puedes cancelar cuando quieras.
                                </p>
                            </div>

                            <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-6">
                                    <AlertCircle size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-4">7. Limitación de responsabilidad</h3>
                                <p className="text-gray-600 text-lg">
                                    BuenCuidar no es responsable por acuerdos realizados entre usuarios, pagos, incumplimientos o daños. La prudencia es tu mejor aliada.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 8, 9, 10 - Grid de 3 */}
                <section className="py-16 md:py-24 px-8 md:px-[60px] bg-white w-full">
                    <div className="max-w-[1440px] mx-auto">
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { title: '8. Privacidad', icon: ShieldCheck, desc: 'Protegemos tu información personal. Se usa solo para el funcionamiento vital de nuestra red.' },
                                { title: '9. Suspensión', icon: AlertCircle, desc: 'Nos reservamos el derecho de eliminar cuentas que representen un riesgo para la comunidad de BC.' },
                                { title: '10. Modificaciones', icon: Scale, desc: 'Estos términos pueden actualizarse. Seguir usando BC implica que aceptas las nuevas versiones.' }
                            ].map((item, i) => (
                                <div key={i} className="bg-gray-50 p-8 rounded-xl border border-gray-100 text-center hover:bg-gray-100 transition-colors">
                                    <item.icon size={32} className="mx-auto mb-6 text-[var(--secondary-color)]" />
                                    <h3 className="text-xl font-bold text-gray-800 mb-4 tracking-tight uppercase text-xs tracking-widest">{item.title}</h3>
                                    <p className="text-gray-600">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Sección Final - Aceptación */}
                <section className="py-20 px-8 md:px-[60px] bg-[var(--primary-color)] text-white w-full flex items-center justify-center">
                    <div className="max-w-[1440px] w-full flex flex-col items-center text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight text-white uppercase">
                            11. Aceptación del Compromiso
                        </h2>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-16 max-w-4xl">
                            <div className="flex-shrink-0">
                                <UserCheck className="w-16 h-16 md:w-24 md:h-24 text-[var(--secondary-color)]" />
                            </div>
                            <div className="text-left">
                                <p className="text-xl md:text-2xl text-blue-100 italic leading-relaxed">
                                    "Al crear una cuenta, confirmas que has leído estos términos, los comprendes y aceptas cumplirlos. BuenCuidar existe para construir un entorno de confianza."
                                </p>
                            </div>
                        </div>

                        <p className="text-2xl md:text-3xl font-bold text-[var(--secondary-color)] mb-8 tracking-tight">
                            ¡Gracias por ser parte de la red de cuidado más humana!
                        </p>

                        <Heart className="w-12 h-12 text-[var(--secondary-color)] animate-pulse" />
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Terms;
