import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Filter, MapPin, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CaregiverDetailModal from '../../components/dashboard/CaregiverDetailModal';

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
                .eq('is_available', true);

            if (error) throw error;
            setCaregivers(data || []);
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
        <div className="max-w-7xl mx-auto animate-fade-in">
            <CaregiverDetailModal
                isOpen={!!selectedCaregiver}
                onClose={() => setSelectedCaregiver(null)}
                caregiver={selectedCaregiver}
                onContact={handleContact}
            />

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Cuidadores Disponibles</h1>
                <p className="text-gray-500">Encuentra al profesional ideal para el cuidado de tus seres queridos.</p>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4 mb-8">
                <div className="relative flex-grow max-w-lg">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o especialidad..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 flex items-center gap-2 font-medium">
                    <Filter size={18} />
                    Filtros
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
                        const displayLocation = bg.address || details?.location;

                        return (
                            <div key={bg.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden">
                                    {bg.avatar_url ? (
                                        <img src={bg.avatar_url} alt={bg.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-xl text-gray-400">
                                            {bg.full_name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-bold text-gray-800 text-lg mb-1">{bg.full_name}</h3>
                                {details?.rating && (
                                    <div className="flex items-center gap-1 mb-2">
                                        <Star size={14} className="fill-orange-400 text-orange-400" />
                                        <span className="font-bold text-gray-700">{details.rating}</span>
                                        <span className="text-xs text-gray-400">({details.reviews_count || 0})</span>
                                    </div>
                                )}
                                <p className="text-blue-600 text-sm font-medium mb-4 flex items-center justify-center gap-1">

                                    <MapPin size={14} /> {displayLocation || 'Ubicación no disponible'}
                                </p>

                                <p className="text-gray-500 text-sm mb-6 line-clamp-2">
                                    {displayBio || 'Cuidador verificado de la plataforma BuenCuidar.'}
                                </p>

                                <button
                                    onClick={() => setSelectedCaregiver(bg)}
                                    className="w-full py-2 border border-[var(--primary-color)] text-[var(--primary-color)] font-bold rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    Ver Perfil
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
    );
};

export default CaregiverList;
