import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { supabase } from '../lib/supabase';
import { Star, MapPin, Briefcase, Loader2, Search as SearchIcon, Globe, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CaregiverDetailModal from '../components/dashboard/CaregiverDetailModal';
import { CAREGIVER_SPECIALTIES } from '../constants/caregiver';
import { CENTRAL_AMERICA } from '../constants/locations';
import { formatLocation } from '../utils/location';

const Search = () => {
    const navigate = useNavigate();
    const [caregivers, setCaregivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCaregiver, setSelectedCaregiver] = useState(null);
    const [filters, setFilters] = useState({
        country: 'nicaragua',
        department: '',
        municipality: '',
        specialty: '',
        priceRange: 500,
        experience: '' // 'under1', '1-3', '3-5', 'over5'
    });

    const [availableDepartments, setAvailableDepartments] = useState([]);
    const [availableMunicipalities, setAvailableMunicipalities] = useState([]);

    useEffect(() => {
        const countryData = CENTRAL_AMERICA.find(c => c.id === filters.country);
        if (countryData && countryData.departments) {
            const depts = Object.keys(countryData.departments);
            setAvailableDepartments(depts);
        } else {
            setAvailableDepartments([]);
        }
    }, [filters.country]);

    useEffect(() => {
        const countryData = CENTRAL_AMERICA.find(c => c.id === filters.country);
        if (countryData && countryData.departments && filters.department) {
            const munis = countryData.departments[filters.department] || [];
            setAvailableMunicipalities(munis);
        } else {
            setAvailableMunicipalities([]);
        }
    }, [filters.department, filters.country]);

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
                .eq('role', 'caregiver')
                .eq('is_available', true);

            // Apply location filters (profiles table)
            if (filters.department) {
                query = query.eq('department', filters.department);
            }
            if (filters.municipality) {
                query = query.eq('municipality', filters.municipality);
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
                        location: formatLocation(p, details),
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
                    const isAPremium = a.raw?.plan_type === 'premium' || a.raw?.plan_type === 'professional_pro';
                    const isBPremium = b.raw?.plan_type === 'premium' || b.raw?.plan_type === 'professional_pro';
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
            country: 'nicaragua',
            department: '',
            municipality: '',
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
            <div className="bg-gradient-to-br from-[var(--primary-color)] via-[#1a5a70] to-[#2FAE8F] py-12 md:py-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--accent-color)]/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center mb-10">
                        <h2 className="text-3xl md:text-5xl font-brand font-bold !text-[#FAFAF7] mb-4 tracking-tight">Busca y Contrata Cuidadores PRO</h2>
                        <p className="text-blue-100 text-sm md:text-lg font-secondary font-medium opacity-90">Personal capacitado y verificado para el cuidado de tus seres queridos.</p>
                    </div>

                    <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-xl p-2 rounded-[32px] shadow-2xl border border-white/20">
                        <div className="bg-white p-6 md:p-8 rounded-[28px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 text-gray-800 items-end">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Globe size={14} className="text-blue-500" /> País
                                </label>
                                <select
                                    className="w-full border-2 border-gray-50 rounded-[16px] px-4 py-3 focus:border-[var(--secondary-color)] outline-none font-bold text-sm bg-gray-50/50 transition-all cursor-pointer"
                                    value={filters.country}
                                    onChange={(e) => setFilters({ ...filters, country: e.target.value, department: '', municipality: '' })}
                                >
                                    {CENTRAL_AMERICA.map(country => (
                                        <option key={country.id} value={country.id}>{country.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <MapPin size={14} className="text-orange-400" /> Departamento
                                </label>
                                <select
                                    className="w-full border-2 border-gray-50 rounded-[16px] px-4 py-3 focus:border-[var(--secondary-color)] outline-none font-bold text-sm bg-gray-50/50 transition-all cursor-pointer"
                                    value={filters.department}
                                    onChange={(e) => setFilters({ ...filters, department: e.target.value, municipality: '' })}
                                >
                                    <option value="">Cualquiera</option>
                                    {availableDepartments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Home size={14} className="text-blue-400" /> Municipio
                                </label>
                                <select
                                    className="w-full border-2 border-gray-50 rounded-[16px] px-4 py-3 focus:border-[var(--secondary-color)] outline-none font-bold text-sm bg-gray-50/50 transition-all cursor-pointer disabled:opacity-50"
                                    value={filters.municipality}
                                    disabled={!filters.department}
                                    onChange={(e) => setFilters({ ...filters, municipality: e.target.value })}
                                >
                                    <option value="">Cualquiera</option>
                                    {availableMunicipalities.map(muni => (
                                        <option key={muni} value={muni}>{muni}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Briefcase size={14} className="text-emerald-500" /> Especialidad
                                </label>
                                <select
                                    className="w-full border-2 border-gray-50 rounded-[16px] px-4 py-3 focus:border-[var(--secondary-color)] outline-none font-bold text-sm bg-gray-50/50 transition-all cursor-pointer"
                                    value={filters.specialty}
                                    onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                                >
                                    <option value="">Todas</option>
                                    {CAREGIVER_SPECIALTIES.map(specialty => (
                                        <option key={specialty} value={specialty}>
                                            {specialty}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={fetchCaregivers}
                                className="bg-[var(--primary-color)] !text-[#FAFAF7] w-full py-4 rounded-[18px] font-black text-xs uppercase tracking-[0.2em] hover:brightness-110 shadow-xl shadow-blue-900/10 transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                <SearchIcon size={18} strokeWidth={3} />
                                <span>Buscar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="flex-grow container mx-auto px-4 md:px-12 py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Filters Sidebar */}
                    <aside className="w-full lg:w-1/4">
                        <div className="bg-white p-8 rounded-[24px] shadow-xl shadow-gray-200/50 border border-gray-100 sticky top-24">
                            <h3 className="font-brand font-bold text-xl text-[var(--primary-color)] mb-6 tracking-tight">Filtrar por</h3>

                            <div className="mb-8">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Experiencia</h4>
                                <div className="space-y-3">
                                    {[
                                        { id: 'under1', label: 'Menos de 1 año' },
                                        { id: '1-3', label: '1 - 3 años' },
                                        { id: '3-5', label: '3 - 5 años' },
                                        { id: 'over5', label: '+ 5 años' }
                                    ].map(range => (
                                        <label key={range.id} className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="radio"
                                                    name="experience"
                                                    className="peer appearance-none w-5 h-5 border-2 border-gray-200 rounded-full checked:border-[var(--secondary-color)] transition-all cursor-pointer"
                                                    checked={filters.experience === range.id}
                                                    onChange={() => handleExperienceChange(range.id)}
                                                />
                                                <div className="absolute w-2.5 h-2.5 bg-[var(--secondary-color)] rounded-full opacity-0 peer-checked:opacity-100 transition-all"></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-600 group-hover:text-[var(--primary-color)] transition-colors">{range.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tarifa Máxima</h4>
                                    <span className="text-sm font-bold text-[var(--secondary-color)] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">${filters.priceRange}{filters.priceRange >= 500 && '+'}</span>
                                </div>
                                <input
                                    type="range"
                                    min="50"
                                    max="500"
                                    step="10"
                                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[var(--secondary-color)]"
                                    value={filters.priceRange}
                                    onChange={(e) => setFilters({ ...filters, priceRange: parseInt(e.target.value) })}
                                />
                                <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 px-1">
                                    <span>$50</span>
                                    <span>$500+</span>
                                </div>
                            </div>

                            <button
                                onClick={handleClearFilters}
                                className="w-full py-4 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-[var(--primary-color)] hover:bg-gray-50 rounded-[16px] transition-all border-2 border-transparent hover:border-gray-100"
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
                                    <p className="font-brand font-bold text-[var(--primary-color)] uppercase tracking-widest text-xs">Cargando cuidadores...</p>
                                </div>
                            ) : caregivers.length > 0 ? (
                                caregivers.map((caregiver) => (
                                    <div key={caregiver.id} className="bg-white rounded-[24px] shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 overflow-hidden flex flex-col group hover:-translate-y-2">
                                        <div className="p-8 flex-grow">
                                            <div className="flex items-start gap-5 mb-6">
                                                <div className="w-20 h-20 rounded-[20px] overflow-hidden border-4 border-gray-50 shadow-inner shrink-0 relative">
                                                    <img
                                                        src={caregiver.image}
                                                        alt={caregiver.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    />
                                                    {(caregiver.raw?.plan_type === 'premium' || caregiver.raw?.plan_type === 'professional_pro') && (
                                                        <div className="absolute bottom-0 right-0 bg-[var(--secondary-color)] text-white p-1 rounded-tl-[8px]">
                                                            <Award size={12} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-brand font-bold text-xl text-[var(--primary-color)] group-hover:text-[var(--secondary-color)] transition-colors truncate">{caregiver.name}</h3>
                                                    <p className="text-[var(--secondary-color)] text-[10px] font-black uppercase tracking-[0.2em] mb-2">{caregiver.role}</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center bg-yellow-400/10 px-2 py-0.5 rounded-full">
                                                            <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                                            <span className="text-xs font-black text-yellow-600 ml-1">{caregiver.rating}</span>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">({caregiver.reviews} reseñas)</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 mb-6">
                                                {caregiver.tags.slice(0, 3).map(tag => (
                                                    <span key={tag} className="bg-gray-50 text-gray-500 text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-[12px] border border-gray-100">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {caregiver.tags.length > 3 && (
                                                    <span className="bg-blue-50 text-blue-500 text-[9px] font-bold px-2 py-1.5 rounded-[12px]">+{caregiver.tags.length - 3}</span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <MapPin size={10} className="text-orange-400" /> Ubicación
                                                    </p>
                                                    <p className="text-xs font-bold text-gray-600 truncate">{caregiver.location}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Briefcase size={10} className="text-blue-400" /> Experiencia
                                                    </p>
                                                    <p className="text-xs font-bold text-gray-600">{caregiver.experience}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50/50 px-8 py-6 border-t border-gray-100 flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1">Inversión / Hr</p>
                                                <p className="text-2xl font-brand font-bold text-[var(--primary-color)] flex items-baseline">
                                                    <span>${caregiver.price}</span>
                                                    <span className="text-xs font-secondary font-bold text-gray-400 ml-1 uppercase tracking-widest">USD</span>
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedCaregiver(caregiver.raw)}
                                                className="bg-[var(--secondary-color)] !text-[#FAFAF7] text-[10px] font-black uppercase tracking-[0.2em] px-6 py-4 rounded-[16px] shadow-lg shadow-emerald-900/10 hover:brightness-110 active:scale-95 transition-all"
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
