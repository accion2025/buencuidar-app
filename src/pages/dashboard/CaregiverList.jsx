import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Filter, MapPin, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CaregiverDetailModal from '../../components/dashboard/CaregiverDetailModal';
import { formatLocation } from '../../utils/location';

const CaregiverList = () => {
    const [caregivers, setCaregivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCaregiver, setSelectedCaregiver] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCaregivers();
    }, []);

    const fetchCaregivers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    caregiver_details (*)
                `)
                .eq('role', 'caregiver')
                .eq('is_available', true)
                .order('rating', { foreignTable: 'caregiver_details', ascending: false, nullsFirst: false });

            if (error) throw error;

            // Sort in memory to ensure parent list is ordered by child rating
            const sortedData = (data || []).sort((a, b) => {
                const detailsA = Array.isArray(a.caregiver_details) ? a.caregiver_details[0] : a.caregiver_details;
                const detailsB = Array.isArray(b.caregiver_details) ? b.caregiver_details[0] : b.caregiver_details;

                const ratingA = detailsA?.rating || 0;
                const ratingB = detailsB?.rating || 0;

                // 1. Sort by rating descending (Point 1: Priorities equal ratings)
                if (ratingB !== ratingA) {
                    return ratingB - ratingA;
                }

                // 2. TIE-BREAKER: Priority to BC PRO (Consistency with Search)
                const isAPremium = a.plan_type === 'premium' || a.plan_type === 'professional_pro';
                const isBPremium = b.plan_type === 'premium' || b.plan_type === 'professional_pro';
                if (isAPremium && !isBPremium) return -1;
                if (!isAPremium && isBPremium) return 1;

                return 0;
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
            bio.toLowerCase().includes(searchTerm.toLowerCase());
    });

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

                {/* Search & Filter */}
                <div className="flex flex-col md:flex-row gap-4 mb-12">
                    <div className="relative flex-grow max-w-2xl group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--secondary-color)] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o especialidad..."
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-[16px] focus:border-[var(--secondary-color)] outline-none font-bold text-base bg-white/50 backdrop-blur-sm transition-all shadow-sm focus:shadow-lg focus:shadow-emerald-900/5"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="px-8 py-4 bg-white border-2 border-gray-100 rounded-[16px] text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all hover:border-slate-200 shadow-sm">
                        <Filter size={18} />
                        <span>Filtros Avanzados</span>
                    </button>
                </div>

                {/* Grid */}
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
                                            <Star
                                                size={14}
                                                className={details?.rating > 0 ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                                            />
                                            {/* Point 3: X/5 format, no rounding */}
                                            <span className={`text-sm font-black ml-1.5 ${details?.rating > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                                {details?.rating > 0 ? `${details.rating}/5` : '0/5'}
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
                                        {displayBio || 'Cuidador verificado de la plataforma BuenCuidar especializado en atención personalizada.'}
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
