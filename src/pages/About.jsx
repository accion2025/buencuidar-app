import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Target, Eye, Users } from 'lucide-react';

const About = () => {
    return (
        <div className="min-h-screen flex flex-col font-sans">
            <Navbar />

            <header className="bg-[var(--primary-color)] !text-[#FAFAF7] py-20 px-6 text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Nacemos del corazón</h1>
                <p className="text-xl text-green-100 max-w-2xl mx-auto">
                    No solo somos una plataforma, somos familias ayudando a otras familias.
                </p>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-16 space-y-24">
                {/* Mission Vision */}
                <div className="grid md:grid-cols-3 gap-12 text-center">
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                            <Target size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Nuestro Propósito</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Que ninguna familia mexicana se sienta sola en el camino del cuidado, garantizando dignidad para quienes cuidan y paz para quienes aman.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto">
                            <Eye size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Visión</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Ser la plataforma líder en Latinoamérica para servicios de bienestar y cuidado a domicilio, reconocida por su ética y calidez humana.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <Users size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Lo que nos une</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Empatía, integridad y compromiso real. Para nosotros, cuidar es el acto más noble y profesional que existe.
                        </p>
                    </div>
                </div>

                {/* Story Section */}
                <div className="bg-gray-50 rounded-[16px] p-8 md:p-12 flex flex-col md:flex-row items-center gap-12">
                    <div className="md:w-1/2 space-y-6">
                        <h2 className="text-3xl font-bold text-gray-900">¿Por qué creamos BuenCuidar?</h2>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            BuenCuidar nació en 2024 de una experiencia personal. Cuando mi abuela enfermó, mi familia sufrió para encontrar a alguien de confianza que pudiera ayudarnos. Las agencias eran carísimas y los recomendados informales no siempre cumplían.
                        </p>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            Decidimos crear una solución que combinara la tecnología con el factor humano. Una plataforma transparente donde las familias pudieran ver credenciales reales y los cuidadores recibieran un pago justo.
                        </p>
                    </div>
                    <div className="md:w-1/2">
                        <img
                            src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                            alt="Equipo trabajando"
                            className="rounded-[16px] shadow-xl w-full object-cover h-64 md:h-96"
                        />
                    </div>
                </div>

                {/* Team Placeholder */}
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-12">El Equipo Detrás</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { name: "Ana Martínez", role: "Fundadora & CEO" },
                            { name: "Dr. Carlos Ruiz", role: "Director Médico" },
                            { name: "Laura Sánchez", role: "Coord. de Cuidadores" },
                            { name: "Miguel Ángel", role: "Tecnología" }
                        ].map((member, idx) => (
                            <div key={idx} className="space-y-3">
                                <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto overflow-hidden">
                                    <img
                                        src={`https://i.pravatar.cc/150?u=${member.name}`}
                                        alt={member.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">{member.name}</h4>
                                    <p className="text-[var(--primary-color)] text-sm">{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default About;
