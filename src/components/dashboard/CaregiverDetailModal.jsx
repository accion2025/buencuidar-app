import React, { useState, useEffect } from 'react';
import { X, MapPin, Star, Shield, Clock, Mail, MessageCircle, Award, Check, BookOpen, DollarSign, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatLocation } from '../../utils/location';

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
            // Scroll to top on mobile/all views when opening a new caregiver
            const scrollContainer = document.querySelector('.modal-scroll-container');
            if (scrollContainer) {
                scrollContainer.scrollTop = 0;
            }
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

    // Normalizar detalles (Supabase puede devolver un objeto o un array de un solo elemento en joins)
    const details = Array.isArray(caregiver.caregiver_details)
        ? caregiver.caregiver_details[0]
        : caregiver.caregiver_details;

    const specialization = details?.specialization || caregiver.specialization || "Cuidado General";
    const experience = details?.experience || caregiver.experience || "1";
    const location = details?.location || caregiver.location || "Ubicación no disponible";
    const bio = caregiver.bio || details?.bio || "Este cuidador se especializa en brindar atención compasiva y profesional, enfocándose en el bienestar integral del paciente.";
    const skills = details?.skills || caregiver.skills || ['Cuidados Básicos'];
    const certifications = details?.certifications || caregiver.certifications || [];
    const hourlyRate = details?.hourly_rate || caregiver.hourly_rate || 150;

    const isPro = caregiver.plan_type === 'premium' || caregiver.plan_type === 'professional_pro';

    // Construir ubicación detallada (Municipio, Departamento, ABBR)
    const getDetailedLocation = () => {
        const countryRaw = (details?.country || caregiver?.country || 'Nicaragua').toLowerCase();
        let abbr = 'NIC';
        if (countryRaw.includes('costa')) abbr = 'CR';
        else if (countryRaw.includes('hond')) abbr = 'HN';
        else if (countryRaw.includes('salv')) abbr = 'SV';
        else if (countryRaw.includes('guat')) abbr = 'GT';
        else if (countryRaw.includes('panam')) abbr = 'PA';

        const muni = details?.municipality || caregiver.municipality || '';
        const dept = details?.department || caregiver.department || '';

        const parts = [muni, dept, abbr].filter(Boolean);
        return parts.join(', ');
    };

    const locationDisplay = getDetailedLocation();

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-start justify-center sm:pt-5 sm:px-6 sm:pb-6 pt-0 px-0 pb-0 animate-fade-in overflow-y-auto">
            <div className="bg-white sm:rounded-[16px] rounded-none shadow-2xl w-full max-w-2xl sm:max-h-[90vh] max-h-screen overflow-hidden relative flex flex-col border border-white/20 h-full sm:h-auto">

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto modal-scroll-container">
                    {/* Redesigned Header */}
                    <div className="relative">
                        {/* 1. Banner with Avatar Centered Fully inside */}
                        <div className="h-44 bg-gradient-to-r from-[#0F3C4C] via-[#1a5a70] to-[#2FAE8F] relative overflow-hidden flex items-center justify-center">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]"></div>
                            <div className="absolute bottom-0 left-0 w-80 h-80 bg-black opacity-10 rounded-full translate-y-1/2 -translate-x-1/2 blur-[60px]"></div>

                            {/* Avatar (Centered Fully on Banner) */}
                            <div className="relative group/avatar">
                                <div className="w-32 h-32 lg:w-36 lg:h-36 rounded-full border-[6px] border-white/20 shadow-2xl bg-white/10 backdrop-blur-sm overflow-hidden relative ring-1 ring-white/30">
                                    {caregiver.avatar_url ? (
                                        <img src={caregiver.avatar_url} alt={caregiver.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/20 text-white text-4xl font-black">
                                            {caregiver.full_name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                {/* Verification Badge */}
                                <div className="absolute bottom-1 right-1 bg-[var(--secondary-color)] w-7 h-7 rounded-full border-[3px] border-[#0F3C4C] shadow-lg flex items-center justify-center text-white" title="Perfil Verificado">
                                    <Check size={14} strokeWidth={4} />
                                </div>
                            </div>

                            {/* Close Button stayed at top right of the overall component, not the banner center */}
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 bg-white/10 !text-[#FAFAF7] p-2.5 rounded-[16px] hover:bg-white/20 transition-all backdrop-blur-md z-30"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* 3. Name & Info Badges (Slightly less padding top since avatar moved up) */}
                        <div className="pt-8 pb-8 px-6 lg:px-12 text-center">
                            {/* Name */}
                            <h2 className="text-3xl font-brand font-bold text-slate-800 mb-2 tracking-tight">{caregiver.full_name}</h2>

                            {/* Badges Row */}
                            <div className="flex flex-col items-center gap-2 mb-8">
                                {isPro ? (
                                    <div className="flex items-center gap-2 bg-emerald-50 text-[var(--secondary-color)] border-emerald-100 px-4 py-1.5 rounded-full text-xs font-black tracking-[0.15em] border uppercase">
                                        <Award size={14} />
                                        <span>BC PRO</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-slate-50 text-slate-500 border-slate-200 px-4 py-1.5 rounded-full text-xs font-black tracking-[0.15em] border uppercase">
                                        <User size={14} />
                                        <span>Estándar</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-gray-400">
                                    <p className="text-cyan-700 font-bold font-mono text-xs opacity-80 uppercase tracking-widest mr-2">{specialization}</p>
                                    <div className="flex items-center">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                                key={s}
                                                size={14}
                                                className={`${realStats.count === 0
                                                    ? 'text-gray-300'
                                                    : (s <= Number(realStats.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200')
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    {realStats.count > 0 && <span className="text-xs font-bold text-slate-600">({realStats.count})</span>}
                                </div>
                            </div>

                            {/* 4. Stats Grid (Recuadros) */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8 w-full">
                                {/* Tarifa Box */}
                                <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center gap-2 border border-transparent hover:border-slate-100 hover:bg-white hover:shadow-lg transition-all text-center">
                                    <div className="flex items-center gap-2 text-green-600">
                                        <DollarSign size={14} />
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tarifa</p>
                                    </div>
                                    <p className="text-lg font-brand font-bold text-slate-800">${hourlyRate}<span className="text-xs text-slate-400 font-normal ml-1">/hr</span></p>
                                </div>

                                {/* Experiencia Box */}
                                <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center gap-2 border border-transparent hover:border-slate-100 hover:bg-white hover:shadow-lg transition-all text-center">
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <Clock size={14} />
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Experiencia</p>
                                    </div>
                                    <p className="text-lg font-brand font-bold text-slate-800">{experience} <span className="text-xs text-slate-400 font-normal ml-1">Años</span></p>
                                </div>

                                {/* Ubicación Box */}
                                <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center gap-2 border border-transparent hover:border-slate-100 hover:bg-white hover:shadow-lg transition-all text-center">
                                    <div className="flex items-center gap-2 text-rose-500">
                                        <MapPin size={14} />
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Ubicación</p>
                                    </div>
                                    <p className="text-xs lg:text-[13px] font-brand font-bold text-slate-800 leading-tight">
                                        {locationDisplay}
                                    </p>
                                </div>

                                {/* Contacto Box */}
                                <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center gap-2 border border-transparent hover:border-slate-100 hover:bg-white hover:shadow-lg transition-all text-center">
                                    <div className="flex items-center gap-2 text-purple-600">
                                        <MessageCircle size={14} />
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Contacto</p>
                                    </div>
                                    <a
                                        href={`tel:${caregiver.phone}`}
                                        className="text-sm font-brand font-bold text-[var(--secondary-color)] hover:underline truncate max-w-full"
                                    >
                                        {caregiver.phone || 'No disponible'}
                                    </a>
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
                            <p className="text-gray-600 leading-relaxed text-sm bg-gray-50/50 p-5 rounded-[16px] border border-gray-100">
                                {bio}
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
                                    {skills.map((skill, idx) => (
                                        <span key={idx} className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-[16px] border border-emerald-100/50">
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
                                    {certifications.slice(0, 3).map((cert, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-2.5 rounded-[16px] border border-gray-100 hover:bg-gray-50 transition-colors">
                                            <div className="mt-0.5 text-blue-400 bg-blue-50 p-1 rounded-md">
                                                <Award size={12} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-xs leading-tight">{cert.title}</p>
                                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{cert.org} • {cert.year}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(certifications.length === 0) && (
                                        <p className="text-xs text-gray-400 italic">Sin certificaciones registradas</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Featured Reviews */}
                        {reviews.length > 0 && (
                            <div className="bg-amber-50/30 rounded-[16px] p-6 border border-amber-100/50">
                                <h3 className="flex items-center gap-2 font-black text-gray-800 mb-4">
                                    <Star className="text-amber-400 fill-amber-400" size={20} />
                                    Reseñas Destacadas
                                </h3>
                                <div className="grid gap-3">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="bg-white p-4 rounded-[16px] border border-gray-100 shadow-sm relative">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                                                        {review.client?.avatar_url ? (
                                                            <img src={review.client.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
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
                        className="flex-1 bg-white border-2 border-slate-100 text-slate-500 font-bold py-4 rounded-[16px] hover:bg-slate-50 transition-colors uppercase tracking-widest text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onContact(caregiver)}
                        className="flex-[2] bg-[#0F4C5C] !text-[#FAFAF7] font-black py-4 rounded-[16px] hover:shadow-xl hover:shadow-[#0F4C5C]/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
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
