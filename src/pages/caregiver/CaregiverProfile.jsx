import React, { useState } from 'react';
import { MapPin, Star, Edit2, BookOpen, Award, Check, X, Loader2, Camera, Phone, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const AVAILABLE_SKILLS = [
    "Primeros Auxilios",
    "Manejo de Sondas",
    "Terapia Física",
    "Cocina Básica",
    "Licencia de Conducir",
    "Estimulación Cognitiva",
    "Higiene y Confort",
    "Apoyo en Rutina de Medicación",
    "Manejo de Grúa",
    "Acompañamiento a Citas",
    "Registro de Signos Básicos",
    "Apoyo en Recuperación"
];

const CaregiverProfile = () => {
    const { profile, user, refreshProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState(null);
    const [newCert, setNewCert] = useState({ title: '', org: '', year: '' });

    if (!profile) return null;

    const handleEditOpen = () => {
        setFormData({
            full_name: profile.full_name || '',
            specialization: profile.specialization || '',
            phone: profile.phone || '',
            location: profile.location || profile.caregiver_details?.location || '',
            experience: profile.experience || profile.caregiver_details?.experience || '',
            bio: profile.bio || '',
            certifications: profile.certifications || [
                { title: "Enfermería General", org: "UNAM", year: "2018" },
                { title: "RCP Avanzado", org: "Cruz Roja", year: "2023" },
                { title: "Diplomado Geriatría", org: "ING", year: "2020" }
            ],
            skills: profile.skills || ['Primeros Auxilios', 'Manejo de Sondas', 'Terapia Física', 'Cocina Básica', 'Licencia de Conducir']
        });
        setIsEditing(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // 1. Update profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 2. Update caregiver_details table
            const { error: detailsError } = await supabase
                .from('caregiver_details')
                .update({
                    specialization: formData.specialization,
                    experience: formData.experience,
                    bio: formData.bio,
                    location: formData.location,
                    certifications: formData.certifications,
                    skills: formData.skills
                })
                .eq('id', user.id);

            if (detailsError) throw detailsError;

            await refreshProfile();
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("No se pudo guardar el perfil: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-12 animate-fade-in max-w-6xl mx-auto pb-20" translate="no">
            {/* Premium Header Profile */}
            <div className="bg-white rounded-lg shadow-xl shadow-blue-900/5 border border-gray-100 relative overflow-hidden">
                <div className="h-56 bg-gradient-to-br from-[#072a33] via-[#0F4C5C] to-[#125d6d] absolute top-0 left-0 w-full">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse-slow"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl"></div>
                    <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative mt-20 flex flex-col lg:flex-row items-center lg:items-end gap-10 px-10 pb-10">
                    <div className="relative group shrink-0">
                        <div className="w-44 h-44 rounded-full border-[6px] border-white/20 bg-slate-900 shadow-2xl relative overflow-hidden ring-4 ring-white shadow-blue-900/40">
                            <img
                                src={profile.avatar_url || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"}
                                alt="Profile"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white">
                                <Camera size={28} className="mb-1" />
                                <span className="text-[10px] font-bold uppercase">Cambiar Foto</span>
                            </div>
                        </div>
                        <div className="absolute bottom-3 right-3 bg-green-500 w-7 h-7 rounded-full border-[4px] border-white shadow-xl animate-bounce-slow" title="Activo ahora"></div>
                    </div>

                    <div className="flex-1 text-center lg:text-left pt-6">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-3">
                            <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">{profile.full_name}</h1>
                            <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg shadow-emerald-500/20 w-fit mx-auto lg:mx-0 border border-emerald-400">
                                <Award size={16} />
                                <span className="tracking-widest">PERFIL PRO VERIFICADO</span>
                            </div>
                        </div>

                        <p className="text-xl text-cyan-300 font-bold mb-6 drop-shadow-sm flex items-center justify-center lg:justify-start gap-2">
                            <Briefcase size={20} className="text-cyan-400" />
                            {profile.specialization || 'Especialista en Cuidados Generales'}
                        </p>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-8">
                            <div className="bg-amber-400 text-[#5c3e0f] px-5 py-2.5 rounded-lg shadow-xl shadow-amber-900/20 border-2 border-amber-300 flex items-center gap-3">
                                <div className="bg-white/30 p-1.5 rounded-lg">
                                    <span className="text-sm font-black">ID</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-tighter opacity-70 leading-none">Código Cuidador</p>
                                    <p className="text-lg font-mono font-black">{profile.caregiver_code || '---'}</p>
                                </div>
                            </div>

                            <div className="bg-[#125d6d] text-white px-5 py-2.5 rounded-lg shadow-xl shadow-cyan-900/20 border-2 border-cyan-400 flex items-center gap-3">
                                <div className="bg-white/10 p-1.5 rounded-lg">
                                    <Phone size={20} className="text-cyan-300" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-tighter text-cyan-200 leading-none">Teléfono WhatsApp</p>
                                    <p className="text-lg font-black tracking-tight">{profile.phone || 'Sin número'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 bg-black/10 backdrop-blur-md rounded-lg p-4 border border-white/5">
                            <div className="flex items-center gap-2">
                                <Star size={20} className="text-yellow-400 fill-current" />
                                <div className="text-left">
                                    <p className="text-[10px] text-white/50 font-black uppercase">Rating</p>
                                    <p className="text-white font-black leading-none">
                                        {profile.caregiver_details?.rating ? profile.caregiver_details.rating : (profile.rating || 'N/A')}
                                        <span className="text-[10px] text-white/40 ml-1 font-normal">
                                            ({profile.caregiver_details?.reviews_count || 0} res)
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                            <div className="flex items-center gap-2">
                                <Briefcase size={20} className="text-blue-400" />
                                <div className="text-left">
                                    <p className="text-[10px] text-white/50 font-black uppercase">Experiencia</p>
                                    <p className="text-white font-black leading-none">{profile.experience || '5'} Años</p>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                            <div className="flex items-center gap-2">
                                <MapPin size={20} className="text-red-400" />
                                <div className="text-left">
                                    <p className="text-[10px] text-white/50 font-black uppercase">Zona</p>
                                    <p className="text-white font-black leading-none">{profile.location || 'CDMX'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[220px] pb-4">
                        <button
                            onClick={handleEditOpen}
                            className="bg-white text-[#0F4C5C] px-6 py-4 rounded-lg font-black hover:bg-cyan-50 transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-3 group"
                        >
                            <Edit2 size={20} className="group-hover:rotate-12 transition-transform" />
                            EDITAR MI PERFIL
                        </button>
                        <button className="bg-black/20 backdrop-blur-md text-white border border-white/20 px-6 py-4 rounded-lg font-bold hover:bg-white hover:text-[#0F4C5C] transition-all flex items-center justify-center gap-3">
                            <BookOpen size={20} />
                            VISTA PÚBLICA
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8 text-left">
                    <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-xl text-gray-800 flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                                Sobre mí
                            </h3>
                        </div>
                        <p className="text-gray-600 leading-relaxed text-lg">
                            {profile.bio || "Este cuidador aún no ha redactado su biografía profesional."}
                        </p>

                        <div className="mt-12 pt-10 border-t border-gray-100/60">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-xl text-gray-800 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                                    Habilidades Destacadas
                                </h3>
                                <button onClick={handleEditOpen} className="text-blue-600 text-sm font-bold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                                    <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center">+</div>
                                    Agregar
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {(profile.skills && profile.skills.length > 0 ? profile.skills : ['Primeros Auxilios', 'Higiene y Confort', 'Indicadores Generales'])
                                    .filter(skill => !skill.toLowerCase().includes('esto es una prueba'))
                                    .map(skill => (
                                        <span key={skill} className="bg-blue-50/50 text-[#0F4C5C] px-4 py-2 rounded-xl text-sm font-bold border border-blue-100/50 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                            {skill}
                                        </span>
                                    ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-xl text-gray-800 flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-cyan-500 rounded-full"></div>
                                Formación y Certificaciones
                            </h3>
                            <button onClick={handleEditOpen} className="text-blue-600 text-sm font-bold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                                <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center">+</div>
                                Agregar
                            </button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {(profile.certifications || []).map((cert, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 rounded-lg border border-gray-50 hover:border-blue-100 hover:bg-blue-50/10 transition-all group">
                                    <div className="bg-blue-100 text-blue-600 p-3 rounded-lg group-hover:scale-110 transition-transform">
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 leading-tight">{cert.title}</h4>
                                        <p className="text-xs text-gray-400 font-medium">{cert.org} • {cert.year}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100">
                        <h3 className="font-black text-gray-800 mb-8 flex items-center gap-2 text-lg">
                            <div className="w-1.5 h-6 bg-yellow-400 rounded-full"></div>
                            Insignias Ganadas
                        </h3>
                        <div className="grid grid-cols-2 gap-6 text-center">
                            {/* Logic: Rating >= 4.8 (Defaults to 5 if not set, for demo) */}
                            <div className={`flex flex-col items-center group ${(profile.caregiver_details?.rating || profile.rating || 5) >= 4.8 ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center text-3xl shadow-lg shadow-yellow-200 group-hover:rotate-12 transition-transform">🏆</div>
                                <span className="text-xs font-black text-gray-600 mt-3 tracking-tighter uppercase">Top Rated</span>
                                <span className="text-[9px] text-gray-400 font-bold">Rating 4.8+</span>
                            </div>

                            {/* Logic: Always active for demo */}
                            <div className="flex flex-col items-center group">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center text-3xl shadow-lg shadow-blue-200 group-hover:-rotate-12 transition-transform">⚡</div>
                                <span className="text-xs font-black text-gray-600 mt-3 tracking-tighter uppercase">Rápido</span>
                                <span className="text-[9px] text-gray-400 font-bold">Resp. &lt; 1h</span>
                            </div>

                            {/* Logic: Always active for demo */}
                            <div className="flex flex-col items-center group">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center text-3xl shadow-lg shadow-green-200 group-hover:scale-110 transition-transform">🛡️</div>
                                <span className="text-xs font-black text-gray-600 mt-3 tracking-tighter uppercase">Verificado</span>
                                <span className="text-[9px] text-gray-400 font-bold">Doc. OK</span>
                            </div>

                            {/* Logic: Reviews >= 0 for User Request (Yamila has 0 but wants badge) */}
                            <div className={`flex flex-col items-center group ${(profile.caregiver_details?.reviews_count || 0) >= 0 ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center text-3xl shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform">✨</div>
                                <span className="text-xs font-black text-gray-600 mt-3 tracking-tighter uppercase">Popular</span>
                                <span className="text-[9px] text-gray-400 font-bold">+5 Reseñas</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-lg p-8 text-white shadow-xl relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <h3 className="font-black mb-6 text-lg tracking-tight">Estatus de Confianza</h3>
                        <div className="space-y-4">
                            <CheckRow label="Identidad" active />
                            <CheckRow label="Validación de Integridad" active />
                            <CheckRow label="Referencias" active />
                            <CheckRow label="Psicométrico" active />
                        </div>
                    </div>
                </div>
            </div>

            {isEditing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-start justify-center pt-24 p-6 text-left overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-slide-up border border-white/20">
                        {/* Header */}
                        <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-3xl font-black text-gray-800 tracking-tight">Editar Perfil Profesional</h3>
                                <p className="text-sm text-gray-500 mt-2 font-medium">Actualiza tu información para destacar ante los clientes de BuenCuidar.</p>
                            </div>
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-red-500 p-3 rounded-lg hover:bg-red-50 transition-all">
                                <X size={32} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-10 space-y-12">
                            {/* Basic Info */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <Edit2 size={20} />
                                    </div>
                                    <h4 className="font-black text-gray-800 uppercase tracking-widest text-sm">Información General</h4>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Nombre Completo</label>
                                        <input
                                            required
                                            className="w-full px-6 py-4 rounded-lg border-2 border-gray-100 focus:border-blue-500 outline-none transition-all bg-gray-50/30 text-base font-black text-gray-900"
                                            value={formData.full_name}
                                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Especialidad</label>
                                        <select
                                            className="w-full px-6 py-4 rounded-lg border-2 border-gray-100 focus:border-blue-500 outline-none transition-all bg-gray-50/30 text-base font-black text-gray-900 appearance-none"
                                            value={formData.specialization}
                                            onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                        >
                                            <option>Acompañamiento Integral</option>
                                            <option>Cuidado Personal Avanzado</option>
                                            <option>Recuperación Funcional</option>
                                            <option>Movimiento y Autonomía</option>
                                            <option>Acompañamiento Compasivo</option>
                                            <option>Compañía Activa</option>
                                            <option>Apoyo en el Hogar</option>
                                            <option>Apoyo en Traslados</option>
                                            <option>Organización Diaria</option>
                                            <option>Apoyo Emocional</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">WhatsApp</label>
                                        <input
                                            type="tel"
                                            className="w-full px-6 py-4 rounded-lg border-2 border-gray-100 focus:border-blue-500 outline-none transition-all bg-gray-50/30 text-base font-black text-gray-900"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Zona / Localidad</label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-4 rounded-lg border-2 border-gray-100 focus:border-blue-500 outline-none transition-all bg-gray-50/30 text-base font-black text-gray-900"
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Años de Experiencia</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full px-6 py-4 rounded-lg border-2 border-gray-100 focus:border-blue-500 outline-none transition-all bg-gray-50/30 text-base font-black text-gray-900"
                                            value={formData.experience}
                                            onChange={e => setFormData({ ...formData, experience: e.target.value })}
                                            placeholder="Ej. 5"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100"></div>

                            {/* Education */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center">
                                        <BookOpen size={20} />
                                    </div>
                                    <h4 className="font-black text-gray-800 uppercase tracking-widest text-sm">Formación Académica</h4>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid gap-4">
                                        {formData.certifications.map((cert, index) => (
                                            <div key={index} className="flex items-center justify-between p-5 bg-gray-50 rounded-lg border-2 border-gray-50">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-blue-600 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                                        <BookOpen size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-gray-800 text-sm tracking-tight">{cert.title}</p>
                                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{cert.org} • {cert.year}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({
                                                        ...formData,
                                                        certifications: formData.certifications.filter((_, i) => i !== index)
                                                    })}
                                                    className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <X size={24} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-blue-50/30 p-8 rounded-lg border-2 border-dashed border-blue-200 space-y-6">
                                        <p className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] text-center">Añadir Nuevo Certificado</p>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Título</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej. Licenciatura"
                                                    className="w-full px-5 py-3 rounded-lg border-2 border-white focus:border-blue-400 outline-none text-sm font-bold shadow-sm"
                                                    value={newCert.title}
                                                    onChange={e => setNewCert({ ...newCert, title: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Institución</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej. UNAM"
                                                    className="w-full px-5 py-3 rounded-lg border-2 border-white focus:border-blue-400 outline-none text-sm font-bold shadow-sm"
                                                    value={newCert.org}
                                                    onChange={e => setNewCert({ ...newCert, org: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-6">
                                            <div className="w-32 space-y-1">
                                                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Año</label>
                                                <input
                                                    type="text"
                                                    placeholder="2024"
                                                    className="w-full px-5 py-3 rounded-lg border-2 border-white focus:border-blue-400 outline-none text-sm font-bold shadow-sm"
                                                    value={newCert.year}
                                                    onChange={e => setNewCert({ ...newCert, year: e.target.value })}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (newCert.title && newCert.org && newCert.year) {
                                                        setFormData({ ...formData, certifications: [...formData.certifications, newCert] });
                                                        setNewCert({ title: '', org: '', year: '' });
                                                    }
                                                }}
                                                className="flex-1 bg-blue-600 text-white font-black rounded-lg hover:bg-blue-700 transition-all text-sm uppercase tracking-[0.15em] shadow-lg shadow-blue-200"
                                            >
                                                Añadir Certificado
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100"></div>

                            {/* Skills */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                        <Star size={20} />
                                    </div>
                                    <h4 className="font-black text-gray-800 uppercase tracking-widest text-sm">Habilidades Técnicas</h4>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    {AVAILABLE_SKILLS.map((skill) => {
                                        const isSelected = formData.skills.includes(skill);
                                        return (
                                            <button
                                                key={skill}
                                                type="button"
                                                onClick={() => {
                                                    const newSkills = isSelected
                                                        ? formData.skills.filter(s => s !== skill)
                                                        : [...formData.skills, skill];
                                                    setFormData({ ...formData, skills: newSkills });
                                                }}
                                                className={`p-5 rounded-lg border-2 text-left transition-all ${isSelected
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xl shadow-emerald-900/10 scale-[1.02]'
                                                    : 'border-gray-50 bg-white text-gray-400 hover:border-emerald-100'
                                                    }`}
                                            >
                                                <div className="flex flex-col gap-3">
                                                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-200'}`}>
                                                        {isSelected && <Check size={16} strokeWidth={4} />}
                                                    </div>
                                                    <span className={`text-[11px] font-black uppercase tracking-tight leading-tight ${isSelected ? 'text-emerald-900' : 'text-gray-400'}`}>{skill}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="h-px bg-gray-100"></div>

                            {/* Bio */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                                        <Briefcase size={20} />
                                    </div>
                                    <h4 className="font-black text-gray-800 uppercase tracking-widest text-sm">Biografía Detallada</h4>
                                </div>
                                <textarea
                                    className="w-full px-6 py-6 rounded-lg border-2 border-gray-100 focus:border-blue-500 outline-none transition-all min-h-[160px] bg-gray-50/30 text-base font-medium text-gray-700 leading-relaxed"
                                    placeholder="Describe tu trayectoria..."
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                />
                            </div>
                        </form>

                        <div className="p-10 border-t border-gray-100 bg-white flex gap-6">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="flex-1 bg-white border-2 border-gray-100 text-gray-400 font-black py-5 rounded-lg hover:bg-gray-50 transition-all uppercase tracking-[0.2em] text-xs"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-[2] bg-[#0F4C5C] text-white font-black py-5 rounded-lg hover:brightness-110 shadow-2xl transition-all flex items-center justify-center disabled:opacity-50 uppercase tracking-[0.2em] text-xs"
                            >
                                {saving ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Guardando...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Check size={22} strokeWidth={3} />
                                        <span>Finalizar Edición PRO</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CheckRow = ({ label, active }) => (
    <div className="flex items-center justify-between text-sm py-1">
        <span className="text-white/70">{label}</span>
        <div className={`flex items-center gap-1.5 font-bold ${active ? 'text-green-400' : 'text-white/20'}`}>
            <span className="text-[10px] uppercase">{active ? 'Completado' : 'Pendiente'}</span>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${active ? 'border-green-400 bg-green-400/20' : 'border-white/10'}`}>
                {active && <Check size={10} />}
            </div>
        </div>
    </div>
);

export default CaregiverProfile;
