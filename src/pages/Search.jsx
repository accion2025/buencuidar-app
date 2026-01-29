import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { supabase } from '../lib/supabase';
import { Star, MapPin, Briefcase, Loader2, Search as SearchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CaregiverDetailModal from '../components/dashboard/CaregiverDetailModal';

const Search = () => {
    const navigate = useNavigate();
    const [caregivers, setCaregivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCaregiver, setSelectedCaregiver] = useState(null);
    const [filters, setFilters] = useState({
        location: '',
        specialty: '',
        priceRange: 500,
        experience: '' // 'under1', '1-3', '3-5', 'over5'
    });

    useEffect(() => {
        fetchCaregivers();
    }, [filters]); // Added filters to dependency array to re-fetch when filters change

    const fetchCaregivers = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('profiles')
                .select(`
                    *,
                    caregiver_details!inner (*)
                `)
                .eq('role', 'caregiver');

            // Apply location filter (profiles)
            if (filters.location) {
                query = query.ilike('caregiver_details.location', `%${filters.location}%`);
            }

            // Apply specialty filter
            if (filters.specialty) {
                query = query.eq('caregiver_details.specialization', filters.specialty);
            }

            // Apply price range filter
            if (filters.priceRange < 500) {
                query = query.lte('caregiver_details.hourly_rate', filters.priceRange);
            }

            // Apply experience filters
            if (filters.experience) {
                if (filters.experience === 'under1') {
                    query = query.lt('caregiver_details.experience', 1);
                } else if (filters.experience === '1-3') {
                    query = query.gte('caregiver_details.experience', 1).lte('caregiver_details.experience', 3);
                } else if (filters.experience === '3-5') {
                    query = query.gt('caregiver_details.experience', 3).lte('caregiver_details.experience', 5);
                } else if (filters.experience === 'over5') {
                    query = query.gt('caregiver_details.experience', 5);
                }
            }

            // SORT BY RATING (HIGHEST FIRST, NULLS LAST)
            query = query.order('rating', { foreignTable: 'caregiver_details', ascending: false, nullsFirst: false });

            const { data, error } = await query;

            if (error) throw error;

            // Map and flatten data for easier UI usage
            const formattedData = (data || [])
                .filter(p => p.caregiver_details) // Ensure they have details
                .map(p => {
                    const details = Array.isArray(p.caregiver_details) ? p.caregiver_details[0] : p.caregiver_details;
                    return {
                        id: p.id,
                        name: p.full_name,
                        role: details?.specialization || 'Cuidador Profesional',
                        rating: details?.rating || 5.0,
                        reviews: details?.reviews_count || 0,
                        experience: (details?.experience || 0) + ' años',
                        location: details?.location || 'Ubicación no disponible',
                        price: details?.hourly_rate || 150,
                        image: p.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                        tags: details?.skills || ['Acompañamiento', 'Cuidado Integral'],
                        raw: p // Keep raw data for the modal
                    };
                })
                .sort((a, b) => {
                    // 1. Priority to those who HAVE reviews (real work)
                    if (a.reviews > 0 && b.reviews === 0) return -1;
                    if (a.reviews === 0 && b.reviews > 0) return 1;

                    // 2. If both have reviews OR both have 0 reviews, sort by rating
                    if (b.rating !== a.rating) {
                        return b.rating - a.rating;
                    }

                    // 3. TIE-BREAKER: Priority to PREMIUM caregivers (Suscripción PRO)
                    const isAPremium = a.raw?.plan_type === 'premium';
                    const isBPremium = b.raw?.plan_type === 'premium';
                    if (isAPremium && !isBPremium) return -1;
                    if (!isAPremium && isBPremium) return 1;

                    return 0;
                });

            setCaregivers(formattedData);
        } catch (err) {
            console.error('Error fetching caregivers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExperienceChange = (range) => {
        setFilters(prev => ({
            ...prev,
            experience: prev.experience === range ? '' : range
        }));
    };

    const handleClearFilters = () => {
        setFilters({
            location: '',
            specialty: '',
            priceRange: 500,
            experience: ''
        });
    };

    const handleContact = (caregiver) => {
        // Since this is a public search, we should check if the user is authenticated
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                alert("Por favor, inicia sesión para contactar a un cuidador.");
                navigate('/login');
            } else {
                // If logged in, redirect to dashboard caregivers to start chat
                navigate('/dashboard/caregivers');
            }
        });
    };

    return (
        <div className="min-h-screen bg-[var(--bg-color)] flex flex-col">
            <Navbar />

            {/* Header / Search Bar */}
            <div className="bg-[var(--primary-color)] !text-[#FAFAF7] py-8">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold mb-6">Encuentra al cuidador ideal</h2>

                    <div className="bg-white p-4 rounded-[16px] shadow-md flex flex-col lg:flex-row gap-4 text-gray-800 items-center">
                        <div className="flex-grow">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ubicación</label>
                            <input
                                type="text"
                                placeholder="Ej. Ciudad de México"
                                className="w-full border-b-2 border-transparent focus:border-[var(--primary-color)] outline-none font-medium"
                                value={filters.location}
                                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                            />
                        </div>
                        <div className="w-px bg-gray-200 hidden md:block"></div>
                        <div className="flex-grow">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Especialidad</label>
                            <select
                                className="w-full border-b-2 border-transparent focus:border-[var(--primary-color)] outline-none font-medium bg-transparent"
                                value={filters.specialty}
                                onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                            >
                                <option value="">Todas</option>
                                <option value="Acompañamiento Integral">Acompañamiento</option>
                                <option value="Cuidado Personal Avanzado">Cuidado Personal</option>
                                <option value="Recuperación Funcional">Recuperación</option>
                                <option value="Terapeuta Ocupacional">Terapia</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={fetchCaregivers}
                                className="btn btn-primary w-full md:w-auto px-8 flex items-center justify-center gap-2"
                            >
                                <SearchIcon size={18} />
                                <span>Buscar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Filters Sidebar */}
                    <aside className="w-full lg:w-1/4">
                        <div className="bg-white p-6 rounded-[16px] shadow-sm border border-gray-200 sticky top-24">
                            <h3 className="font-bold text-lg mb-4">Filtrar Resultados</h3>

                            <div className="mb-6">
                                <h4 className="font-medium mb-2 text-sm text-gray-600">Experiencia</h4>
                                <label className="flex items-center mb-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="experience"
                                        className="mr-2 accent-[var(--primary-color)]"
                                        checked={filters.experience === 'under1'}
                                        onChange={() => handleExperienceChange('under1')}
                                    /> Menos de 1 año
                                </label>
                                <label className="flex items-center mb-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="experience"
                                        className="mr-2 accent-[var(--primary-color)]"
                                        checked={filters.experience === '1-3'}
                                        onChange={() => handleExperienceChange('1-3')}
                                    /> 1 - 3 años
                                </label>
                                <label className="flex items-center mb-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="experience"
                                        className="mr-2 accent-[var(--primary-color)]"
                                        checked={filters.experience === '3-5'}
                                        onChange={() => handleExperienceChange('3-5')}
                                    /> 3 - 5 años
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="experience"
                                        className="mr-2 accent-[var(--primary-color)]"
                                        checked={filters.experience === 'over5'}
                                        onChange={() => handleExperienceChange('over5')}
                                    /> + 5 años
                                </label>
                            </div>

                            <div className="mb-6">
                                <h4 className="font-medium mb-2 text-sm text-gray-600">Rango de Precio / Hr</h4>
                                <input
                                    type="range"
                                    min="50"
                                    max="500"
                                    step="10"
                                    className="w-full accent-[var(--primary-color)]"
                                    value={filters.priceRange}
                                    onChange={(e) => setFilters({ ...filters, priceRange: parseInt(e.target.value) })}
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>$50</span>
                                    <span className="font-bold text-[var(--primary-color)] bg-[var(--primary-light)]/10 px-2 rounded-full">${filters.priceRange}{filters.priceRange >= 500 && '+'}</span>
                                    <span>$500+</span>
                                </div>
                            </div>

                            <button
                                onClick={handleClearFilters}
                                className="text-[var(--primary-light)] text-sm font-medium hover:underline w-full text-center"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    </aside>

                    {/* Results Grid */}
                    <div className="w-full lg:w-3/4">
                        <div className="mb-4 flex justify-between items-center">
                            <span className="text-gray-600"><span>{caregivers.length}</span> cuidadores encontrados</span>
                            <span className="text-sm font-bold text-[var(--primary-color)] bg-[var(--primary-light)]/10 px-4 py-1.5 rounded-full border border-[var(--primary-light)]/20 shadow-sm flex items-center gap-2 animate-fade-in">
                                <Star size={14} className="fill-[var(--primary-color)]" />
                                Ordenados por Mejor Calificación
                            </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 relative min-h-[400px]">
                            {loading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-[16px] z-10">
                                    <Loader2 size={48} className="animate-spin text-[var(--primary-color)] mb-4" />
                                    <p className="font-brand font-bold text-[var(--primary-color)] uppercase tracking-widest text-xs">Cargando cuidadores reales...</p>
                                </div>
                            ) : caregivers.length > 0 ? (
                                caregivers.map((caregiver) => (
                                    <div key={caregiver.id} className="bg-white rounded-[16px] shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
                                        <div className="p-6 flex-grow">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100 shrink-0">
                                                    <img
                                                        src={caregiver.image}
                                                        alt={caregiver.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-[var(--primary-color)] transition-colors">{caregiver.name}</h3>
                                                    <p className="text-[var(--primary-light)] text-xs font-black uppercase tracking-widest">{caregiver.role}</p>
                                                    <div className="flex items-center mt-1">
                                                        <Star size={14} className={`${caregiver.reviews > 0 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                                        <span className="text-sm font-bold text-gray-700 ml-1">{caregiver.rating}</span>
                                                        <span className="text-xs text-gray-400 ml-1"><span>({caregiver.reviews}</span> <span>reseñas)</span></span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {caregiver.tags.map(tag => (
                                                    <span key={tag} className="bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-gray-100">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="text-sm text-gray-500 space-y-2 font-medium">
                                                <p className="flex items-center gap-2">
                                                    <MapPin size={14} className="text-orange-400" /> {caregiver.location}
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <Briefcase size={14} className="text-blue-400" /> {caregiver.experience} de exp.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1">Tarifa</p>
                                                <p className="text-xl font-brand font-bold text-[var(--primary-color)]"><span>${caregiver.price}</span><span className="text-sm font-normal text-gray-500 ml-1">/hr</span></p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedCaregiver(caregiver.raw)}
                                                className="btn btn-secondary text-[10px] font-black uppercase tracking-widest px-6 py-3 shadow-lg shadow-green-100"
                                            >
                                                Ver Perfil
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 py-20 text-center">
                                    <p className="text-gray-400 font-medium">No se encontraron cuidadores disponibles en este momento.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <CaregiverDetailModal
                isOpen={!!selectedCaregiver}
                onClose={() => setSelectedCaregiver(null)}
                caregiver={selectedCaregiver}
                onContact={handleContact}
            />

            <Footer />
        </div>
    );
};

export default Search;
