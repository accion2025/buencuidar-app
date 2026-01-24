import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

// Mock Data
const MOCK_CAREGIVERS = [
    {
        id: 1,
        name: 'Maria González',
        role: 'Enfermera Certificada',
        rating: 4.9,
        reviews: 24,
        experience: '8 años',
        location: 'Ciudad de México',
        price: 150,
        image: 'https://randomuser.me/api/portraits/women/44.jpg',
        tags: ['Enfermería', 'Rehabilitación', 'Alzheimer']
    },
    {
        id: 2,
        name: 'Carlos Rodriguez',
        role: 'Cuidador Geriátrico',
        rating: 4.7,
        reviews: 15,
        experience: '5 años',
        location: 'Guadalajara',
        price: 120,
        image: 'https://randomuser.me/api/portraits/men/32.jpg',
        tags: ['Acompañamiento', 'Movilidad', 'Nocturno']
    },
    {
        id: 3,
        name: 'Ana Sofia Martínez',
        role: 'Terapeuta Ocupacional',
        rating: 5.0,
        reviews: 32,
        experience: '12 años',
        location: 'Monterrey',
        price: 200,
        image: 'https://randomuser.me/api/portraits/women/68.jpg',
        tags: ['Terapia Física', 'Post-operatorio']
    },
    {
        id: 4,
        name: 'Roberto Diaz',
        role: 'Auxiliar de Enfermería',
        rating: 4.5,
        reviews: 8,
        experience: '3 años',
        location: 'Ciudad de México',
        price: 100,
        image: 'https://randomuser.me/api/portraits/men/85.jpg',
        tags: ['Básico', 'Acompañamiento']
    },
];

const Search = () => {
    const [filters, setFilters] = useState({
        location: '',
        specialty: '',
        priceRange: ''
    });

    return (
        <div className="min-h-screen bg-[var(--bg-color)] flex flex-col">
            <Navbar />

            {/* Header / Search Bar */}
            <div className="bg-[var(--primary-color)] text-white py-8">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold mb-6">Encuentra al cuidador ideal</h2>

                    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col md:flex-row gap-4 text-gray-800">
                        <div className="flex-grow">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ubicación</label>
                            <input
                                type="text"
                                placeholder="Ej. Ciudad de México"
                                className="w-full border-b-2 border-transparent focus:border-[var(--primary-color)] outline-none font-medium"
                            />
                        </div>
                        <div className="w-px bg-gray-200 hidden md:block"></div>
                        <div className="flex-grow">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Especialidad</label>
                            <select className="w-full border-b-2 border-transparent focus:border-[var(--primary-color)] outline-none font-medium bg-transparent">
                                <option value="">Todas</option>
                                <option value="enfermeria">Enfermería</option>
                                <option value="acompanamiento">Acompañamiento</option>
                                <option value="terapia">Terapia Física</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button className="btn btn-primary w-full md:w-auto px-8">
                                Buscar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Filters Sidebar */}
                    <aside className="w-full lg:w-1/4">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-24">
                            <h3 className="font-bold text-lg mb-4">Filtrar Resultados</h3>

                            <div className="mb-6">
                                <h4 className="font-medium mb-2 text-sm text-gray-600">Experiencia</h4>
                                <label className="flex items-center mb-2 cursor-pointer">
                                    <input type="checkbox" className="mr-2 text-[var(--primary-color)]" /> Menos de 1 año
                                </label>
                                <label className="flex items-center mb-2 cursor-pointer">
                                    <input type="checkbox" className="mr-2 text-[var(--primary-color)]" /> 1 - 3 años
                                </label>
                                <label className="flex items-center mb-2 cursor-pointer">
                                    <input type="checkbox" className="mr-2 text-[var(--primary-color)]" /> 3 - 5 años
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" className="mr-2 text-[var(--primary-color)]" /> + 5 años
                                </label>
                            </div>

                            <div className="mb-6">
                                <h4 className="font-medium mb-2 text-sm text-gray-600">Rango de Precio / Hr</h4>
                                <input type="range" min="50" max="500" className="w-full accent-[var(--primary-color)]" />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>$50</span>
                                    <span>$500+</span>
                                </div>
                            </div>

                            <button className="text-[var(--primary-light)] text-sm font-medium hover:underline w-full text-center">
                                Limpiar Filtros
                            </button>
                        </div>
                    </aside>

                    {/* Results Grid */}
                    <div className="w-full lg:w-3/4">
                        <div className="mb-4 flex justify-between items-center">
                            <span className="text-gray-600">{MOCK_CAREGIVERS.length} cuidadores encontrados</span>
                            <select className="border border-gray-300 rounded px-2 py-1 text-sm bg-white">
                                <option>Relevancia</option>
                                <option>Mejor Calificados</option>
                                <option>Precio: Menor a Mayor</option>
                            </select>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {MOCK_CAREGIVERS.map((caregiver) => (
                                <div key={caregiver.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                                    <div className="p-6 flex-grow">
                                        <div className="flex items-start gap-4 mb-4">
                                            <img
                                                src={caregiver.image}
                                                alt={caregiver.name}
                                                className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                                            />
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">{caregiver.name}</h3>
                                                <p className="text-[var(--primary-light)] text-sm font-medium">{caregiver.role}</p>
                                                <div className="flex items-center mt-1">
                                                    <span className="text-yellow-400 text-sm">★</span>
                                                    <span className="text-sm font-bold text-gray-700 ml-1">{caregiver.rating}</span>
                                                    <span className="text-xs text-gray-400 ml-1">({caregiver.reviews} reseñas)</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {caregiver.tags.map(tag => (
                                                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="text-sm text-gray-500 space-y-1">
                                            <p className="flex items-center gap-2">
                                                <span>📍</span> {caregiver.location}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span>💼</span> {caregiver.experience} de exp.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Tarifa</p>
                                            <p className="text-lg font-bold text-[var(--primary-color)]">${caregiver.price}<span className="text-sm font-normal text-gray-500">/hr</span></p>
                                        </div>
                                        <button className="btn btn-secondary text-sm px-4 py-2">
                                            Ver Perfil
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Search;
