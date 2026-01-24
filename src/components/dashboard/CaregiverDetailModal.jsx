import React, { useState, useEffect } from 'react';
import { X, MapPin, Star, Shield, Clock, Mail, MessageCircle, Award, Check, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const CaregiverDetailModal = ({ isOpen, onClose, caregiver, onContact }) => {
    const [reviews, setReviews] = useState([]);
    const [realStats, setRealStats] = useState({ rating: '5.0', count: 0 });

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    useEffect(() => {
        if (caregiver?.id && isOpen) {
            fetchReviews();
        }
    }, [caregiver, isOpen]);

    const fetchReviews = async () => {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
                    *,
                    client:reviewer_id (full_name, avatar_url)
                `)
                .eq('caregiver_id', caregiver.id)
                .order('rating', { ascending: false })
                .order('created_at', { ascending: false });

            if (data) {
                const totalRating = data.reduce((acc, curr) => acc + curr.rating, 0);
                const avg = data.length > 0 ? (totalRating / data.length).toFixed(1) : '5.0';

                setRealStats({
                    rating: avg,
                    count: data.length
                });
                setReviews(data.slice(0, 3));
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        }
    };

    if (!isOpen || !caregiver) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-start justify-center pt-24 p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative flex flex-col border border-white/20">

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Header PRO Style */}
                    <div className="relative">
                        <div className="h-40 bg-gradient-to-br from-[#072a33] via-[#0F4C5C] to-[#125d6d] relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 bg-white/10 text-white p-2.5 rounded-lg hover:bg-white/20 transition-all backdrop-blur-md z-10"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Profile Summary Overlay */}
                        <div className="px-8 -mt-16 flex flex-col items-center relative z-20">
                            {/* Avatar */}
                            <div className="w-32 h-32 rounded-full border-[5px] border-white shadow-2xl bg-white overflow-hidden relative group">
                                {caregiver.avatar_url ? (
                                    <img src={caregiver.avatar_url} alt={caregiver.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[#0F4C5C] text-4xl font-black">
                                        {caregiver.full_name?.charAt(0)}
                                    </div>
                                )}
                                <div className="absolute bottom-2 right-2 bg-green-500 w-6 h-6 rounded-full border-[3px] border-white shadow-lg" title="Verificado"></div>
                            </div>

                            {/* Name & Badge */}
                            <div className="text-center mt-4 mb-2">
                                <h2 className="text-3xl font-black text-gray-800 tracking-tight">{caregiver.full_name}</h2>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                                        <Award size={12} strokeWidth={3} />
                                        <span>Cuidador PRO</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[11px] font-black border border-amber-200">
                                        <Star size={12} className="fill-current" />
                                        <span>{realStats.rating} ({realStats.count})</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-center text-cyan-700 font-bold mb-6 font-mono text-sm opacity-80">
                                {caregiver.caregiver_details?.specialization || caregiver.specialization || "Cuidado General"}
                            </p>

                            {/* Key Stats Row */}
                            <div className="flex justify-center gap-4 w-full mb-8">
                                <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center group hover:bg-white hover:shadow-lg transition-all">
                                    <div className="mb-1 text-blue-500 mx-auto w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Shield size={16} />
                                    </div>
                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Status</p>
                                    <p className="font-bold text-gray-800 text-xs">Verificado</p>
                                </div>
                                <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center group hover:bg-white hover:shadow-lg transition-all">
                                    <div className="mb-1 text-indigo-500 mx-auto w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Clock size={16} />
                                    </div>
                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Exp.</p>
                                    <p className="font-bold text-gray-800 text-xs">{caregiver.caregiver_details?.experience || caregiver.experience || '1'} Años</p>
                                </div>
                                <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center group hover:bg-white hover:shadow-lg transition-all">
                                    <div className="mb-1 text-rose-500 mx-auto w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <MapPin size={16} />
                                    </div>
                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Zona</p>
                                    <p className="font-bold text-gray-800 text-xs truncate max-w-[80px] mx-auto">{caregiver.caregiver_details?.location || caregiver.location || 'CDMX'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="px-8 pb-8 space-y-8">

                        {/* Bio Section */}
                        <div className="bg-white">
                            <h3 className="flex items-center gap-2 font-black text-gray-800 mb-3 text-lg">
                                <span className="w-1.5 h-6 bg-[#0F4C5C] rounded-full"></span>
                                Sobre Mí
                            </h3>
                            <p className="text-gray-600 leading-relaxed text-sm bg-gray-50/50 p-5 rounded-lg border border-gray-100">
                                {caregiver.bio || caregiver.caregiver_details?.bio || "Este cuidador se especializa en brindar atención compasiva y profesional, enfocándose en el bienestar integral del paciente."}
                            </p>
                        </div>

                        {/* Skills & Certs Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Skills */}
                            <div>
                                <h3 className="flex items-center gap-2 font-black text-gray-800 mb-4 text-sm uppercase tracking-wide">
                                    <Check className="text-emerald-500" size={18} strokeWidth={3} />
                                    Habilidades
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {(caregiver.skills || caregiver.caregiver_details?.skills || ['Cuidados Básicos']).map((skill, idx) => (
                                        <span key={idx} className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-emerald-100/50">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Certifications */}
                            <div>
                                <h3 className="flex items-center gap-2 font-black text-gray-800 mb-4 text-sm uppercase tracking-wide">
                                    <BookOpen className="text-blue-500" size={18} strokeWidth={3} />
                                    Certificaciones
                                </h3>
                                <div className="space-y-2">
                                    {(caregiver.certifications || caregiver.caregiver_details?.certifications || []).slice(0, 3).map((cert, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                            <div className="mt-0.5 text-blue-400 bg-blue-50 p-1 rounded-md">
                                                <Award size={12} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-xs leading-tight">{cert.title}</p>
                                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{cert.org} • {cert.year}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!caregiver.certifications && !caregiver.caregiver_details?.certifications) && (
                                        <p className="text-xs text-gray-400 italic">Sin certificaciones registradas</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Featured Reviews */}
                        {reviews.length > 0 && (
                            <div className="bg-amber-50/30 rounded-lg p-6 border border-amber-100/50">
                                <h3 className="flex items-center gap-2 font-black text-gray-800 mb-4">
                                    <Star className="text-amber-400 fill-amber-400" size={20} />
                                    Reseñas Destacadas
                                </h3>
                                <div className="grid gap-3">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm relative">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                                                        {review.client?.avatar_url ? (
                                                            <img src={review.client.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-slate-500">
                                                                {review.client?.full_name?.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">{review.client?.full_name}</span>
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={10} className={`${i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-100 text-gray-200'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 italic leading-relaxed">"{review.comment}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-white z-30 flex gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-white border-2 border-slate-100 text-slate-500 font-bold py-4 rounded-lg hover:bg-slate-50 transition-colors uppercase tracking-widest text-xs"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onContact(caregiver)}
                        className="flex-[2] bg-[#0F4C5C] text-white font-black py-4 rounded-lg hover:shadow-xl hover:shadow-[#0F4C5C]/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                    >
                        <Mail size={18} />
                        Enviar Mensaje
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CaregiverDetailModal;
