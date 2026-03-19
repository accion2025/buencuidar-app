import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Star, Globe, Home, Briefcase, Loader2, Award, Shield, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import CaregiverDetailModal from '../../components/dashboard/CaregiverDetailModal';
import { formatLocation } from '../../utils/location';
import { CAREGIVER_SPECIALTIES } from '../../constants/caregiver';
import { CENTRAL_AMERICA } from '../../constants/locations';

const CaregiverList = () => {
    const [caregivers, setCaregivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCaregiver, setSelectedCaregiver] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        country: '',
        department: '',
        municipality: '',
        specialty: '',
        priceRange: 50,
        experience: '' // 'under1', '1-3', '3-5', 'over5'
    });

    const [availableDepartments, setAvailableDepartments] = useState([]);
    const [availableMunicipalities, setAvailableMunicipalities] = useState([]);
    const navigate = useNavigate();

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
    }, [filters.experience, filters.priceRange, filters.country, filters.department, filters.municipality, filters.specialty]);

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
                .eq('email_confirmed', true)
                .eq('is_active', true)
                .eq('is_available', true);

            // Apply location filters
            if (filters.country) {
                query = query.eq('country', filters.country);
            }
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
            if (filters.priceRange < 50) {
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

            query = query.order('rating', { foreignTable: 'caregiver_details', ascending: false, nullsFirst: false });

            const { data, error } = await query;

            // Sort in memory to ensure parent list is ordered by child rating
            const sortedData = (data || []).sort((a, b) => {
                const detailsA = Array.isArray(a.caregiver_details) ? a.caregiver_details[0] : a.caregiver_details;
                const detailsB = Array.isArray(b.caregiver_details) ? b.caregiver_details[0] : b.caregiver_details;

                // Sanitize rating: Force 0 if reviews_count is 0 (ignore DB quirks)
                const ratingA = (detailsA?.reviews_count > 0) ? (detailsA?.rating || 0) : 0;
                const ratingB = (detailsB?.reviews_count > 0) ? (detailsB?.rating || 0) : 0;

                // 1. Sort by rating descending (Point 1: Priorities equal ratings)
                if (ratingB !== ratingA) {
                    return ratingB - ratingA;
                }

                // 2. TIE-BREAKER: Priority to BC PRO (Consistency with Search)
                const isAPremium = a.plan_type === 'premium' || a.plan_type === 'professional_pro';
                const isBPremium = b.plan_type === 'premium' || b.plan_type === 'professional_pro';
                if (isAPremium && !isBPremium) return -1;
                if (!isAPremium && isBPremium) return 1;

                // 3. TIE-BREAKER: Activity Level (updated_at)
                const activityA = new Date(a.updated_at || 0).getTime();
                const activityB = new Date(b.updated_at || 0).getTime();
                return activityB - activityA;
            });

            setCaregivers(sortedData);
        } catch (error) {
            console.error('Error fetching caregivers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleContact = (caregiver) => {
        startChat(caregiver);
    };

    const startChat = async (caregiver) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check conversation
            const { data: conversations } = await supabase
                .from('conversations')
                .select('id')
                .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${caregiver.id}),and(participant1_id.eq.${caregiver.id},participant2_id.eq.${user.id})`);

            let conversationId;
            if (conversations && conversations.length > 0) {
                conversationId = conversations[0].id;
            } else {
                // Create
                const { data: newConv } = await supabase
                    .from('conversations')
                    .insert([{
                        participant1_id: user.id,
                        participant2_id: caregiver.id,
                        last_message: 'Hola, estoy interesado en tu perfil.',
                        last_message_at: new Date()
                    }])
                    .select()
                    .single();
                conversationId = newConv.id;

                // Initial message
                await supabase
                    .from('messages')
                    .insert([{
                        conversation_id: conversationId,
                        sender_id: user.id,
                        content: 'Hola, estoy interesado en tu perfil.'
                    }]);
            }
            navigate('/dashboard/messages', { state: { conversationId } });

        } catch (error) {
            console.error("Error starting chat", error);
            alert("Error al iniciar chat");
        }
    };

    const filteredCaregivers = caregivers.filter(c => {
        const details = Array.isArray(c.caregiver_details) ? c.caregiver_details[0] : c.caregiver_details;
        const bio = c.bio || details?.bio || '';
        return c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
            details?.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleExperienceChange = (range) => {
        setFilters(prev => ({
            ...prev,
            experience: prev.experience === range ? '' : range
        }));
    };

    const handleClearFilters = () => {
        setFilters({
            country: '',
            department: '',
            municipality: '',
            specialty: '',
            priceRange: 50,
            experience: ''
        });
        setSearchTerm('');
    };

    return (
        <>
            <CaregiverDetailModal
                isOpen={!!selectedCaregiver}
                onClose={() => setSelectedCaregiver(null)}
                caregiver={selectedCaregiver}
                onContact={handleContact}
            />
            <div className="max-w-7xl mx-auto animate-fade-in">

                <div className="mb-10">
                    <h1 className="text-3xl font-brand font-bold text-slate-800 mb-2 tracking-tight">Cuidadores Disponibles</h1>
                    <p className="text-lg text-slate-500 font-secondary font-medium max-w-2xl">Encuentra al profesional ideal para el cuidado y bienestar de tus seres queridos.</p>
                </div>

                {/* Search & Location Selectors */}
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="relative group col-span-1 md:col-span-2 lg:col-span-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--secondary-color)] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar cuidador..."
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-50 rounded-[12px] focus:border-[var(--secondary-color)] outline-none font-bold text-sm bg-gray-50/50 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <select
                            className="border-2 border-gray-50 rounded-[12px] px-4 py-3 focus:border-[var(--secondary-color)] outline-none font-bold text-sm bg-gray-50/50 transition-all cursor-pointer"
                            value={filters.country}
                            onChange={(e) => setFilters({ ...filters, country: e.target.value, department: '', municipality: '' })}
                        >
                            <option value="">Todos los Países</option>
                            {CENTRAL_AMERICA.map(country => (
                                <option key={country.id} value={country.id} disabled={!country.active}>
                                    {country.name} {!country.active && '(Próx.)'}
                                </option>
                            ))}
                        </select>

                        <select
                            className="border-2 border-gray-50 rounded-[12px] px-4 py-3 focus:border-[var(--secondary-color)] outline-none font-bold text-sm bg-gray-50/50 transition-all cursor-pointer"
                            value={filters.department}
                            onChange={(e) => setFilters({ ...filters, department: e.target.value, municipality: '' })}
                        >
                            <option value="">Departamento</option>
                            {availableDepartments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>

                        <select
                            className="border-2 border-gray-50 rounded-[12px] px-4 py-3 focus:border-[var(--secondary-color)] outline-none font-bold text-sm bg-gray-50/50 transition-all cursor-pointer"
                            value={filters.specialty}
                            onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                        >
                            <option value="">Especialidad</option>
                            {CAREGIVER_SPECIALTIES.map(specialty => (
                                <option key={specialty} value={specialty}>{specialty}</option>
                            ))}
                        </select>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-8 py-3 rounded-[12px] text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 ${showFilters ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-gray-50 hover:border-gray-200'}`}
                        >
                            <Filter size={18} />
                            <span>{showFilters ? 'Cerrar Filtros' : 'Filtros Pro'}</span>
                        </button>
                    </div>

                    {/* Advanced Filters Drawer/Panel */}
                    {showFilters && (
                        <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Experiencia</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'under1', label: '< 1 año' },
                                        { id: '1-3', label: '1-3 años' },
                                        { id: '3-5', label: '3-5 años' },
                                        { id: 'over5', label: '+ 5 años' }
                                    ].map(range => (
                                        <button
                                            key={range.id}
                                            onClick={() => handleExperienceChange(range.id)}
                                            className={`px-3 py-2 rounded-[10px] text-[10px] font-bold transition-all border ${filters.experience === range.id ? 'bg-[var(--secondary-color)] text-white border-[var(--secondary-color)]' : 'bg-gray-50 text-gray-500 border-transparent hover:border-gray-200'}`}
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inversión Máx.</h4>
                                    <span className="text-xs font-bold text-[var(--secondary-color)]">${filters.priceRange}{filters.priceRange >= 50 && '+'}</span>
                                </div>
                                <input
                                    type="range"
                                    min="3"
                                    max="50"
                                    step="1"
                                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[var(--secondary-color)]"
                                    value={filters.priceRange}
                                    onChange={(e) => setFilters({ ...filters, priceRange: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={handleClearFilters}
                                    className="w-full py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <X size={14} className="group-hover:rotate-90 transition-transform" />
                                    Limpiar Todo
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Grid */}
                <div className="flex justify-between items-center mb-6 px-1">
                    <p className="text-sm font-bold text-slate-400">{filteredCaregivers.length} RESULTADOS ENCONTRADOS</p>
                    {(filters.country || filters.specialty || filters.experience || filters.priceRange < 50) && (
                        <div className="flex gap-2">
                            {filters.specialty && <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[9px] font-black uppercase rounded-md tracking-tighter">{filters.specialty}</span>}
                            {filters.experience && <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-md tracking-tighter">Exp. Activa</span>}
                        </div>
                    )}
                </div>
                {loading ? (
                    <div className="text-center py-20 text-gray-400">Cargando cuidadores...</div>
                ) : filteredCaregivers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCaregivers.map(bg => {
                            const details = Array.isArray(bg.caregiver_details) ? bg.caregiver_details[0] : bg.caregiver_details;
                            const displayBio = bg.bio || details?.bio;
                            const displayLocationFormatted = formatLocation(bg, details);
                            const isPro = bg.plan_type === 'premium' || bg.plan_type === 'professional_pro';

                            return (
                                <div key={bg.id} className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all flex flex-col items-center text-center relative overflow-hidden group">
                                    {isPro && (
                                        <div className="absolute top-4 right-4 bg-emerald-50 text-[var(--secondary-color)] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                            BC PRO
                                        </div>
                                    )}

                                    <div className="w-28 h-28 rounded-full border-4 border-gray-50 mb-6 overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-500">
                                        {bg.avatar_url ? (
                                            <img src={bg.avatar_url} alt={bg.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-black text-2xl bg-slate-100 text-slate-400">
                                                {bg.full_name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="font-brand font-bold text-slate-800 text-xl mb-1 tracking-tight">{bg.full_name}</h3>

                                    <div className="flex items-center gap-1.5 mb-4">
                                        <div className="flex items-center bg-amber-400/10 px-2 py-1 rounded-[8px]">
                                            {/* Point 2: Unfilled star if no rating */}
                                            {/* Robust check: use reviews_count to avoid DB defaults */}
                                            <Star
                                                size={14}
                                                className={(details?.reviews_count > 0 && details?.rating > 0) ? "fill-amber-400 text-amber-400" : "text-slate-300 fill-none"}
                                            />
                                            {/* Point 3: X/5 format, no rounding */}
                                            <span className={`text-sm font-black ml-1.5 ${(details?.reviews_count > 0 && details?.rating > 0) ? 'text-amber-600' : 'text-slate-400'}`}>
                                                {(details?.reviews_count > 0 && details?.rating > 0) ? `${details.rating} / 5` : '0.0 / 5'}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-[8px] border border-slate-100">
                                            {details?.reviews_count > 0 ? `${details.reviews_count} val.` : 'Sin cal.'}
                                        </span>
                                    </div>
                                    <p className="text-cyan-700 text-xs font-black uppercase tracking-[0.15em] mb-4 flex items-center justify-center gap-2 opacity-80">
                                        <MapPin size={14} className="text-rose-400" /> {displayLocationFormatted}
                                    </p>

                                    <p className="text-slate-500 text-base font-secondary leading-relaxed mb-8 line-clamp-2">
                                        {displayBio || 'Este cuidador aún no ha añadido su biografía.'}
                                    </p>

                                    <button
                                        onClick={() => setSelectedCaregiver(bg)}
                                        className="w-full py-4 bg-[#0F4C5C] text-[#FAFAF7] font-black rounded-[16px] hover:bg-[#0a3541] hover:shadow-xl transition-all uppercase tracking-widest text-[11px] shadow-lg shadow-[#0F4C5C]/20 flex items-center justify-center gap-2 group/btn"
                                    >
                                        <span>Ver Perfil Completo</span>
                                        <Star size={14} className="group-hover/btn:rotate-90 transition-transform" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-400">
                        No se encontraron cuidadores disponibles.
                    </div>
                )}
            </div>
        </>
    );
};

export default CaregiverList;
