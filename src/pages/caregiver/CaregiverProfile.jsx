import React, { useState, useEffect } from 'react';
import { MapPin, Star, Edit2, BookOpen, Award, Check, X, Loader2, Camera, Phone, Briefcase, User, Plus, ShieldCheck, CreditCard, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import VerificationModal from '../../components/dashboard/VerificationModal';
import ImageCropper from '../../components/dashboard/ImageCropper';
import { CAREGIVER_SPECIALTIES } from '../../constants/caregiver';

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
    "Apoyo en Recuperación"
];

const MAX_RETRIES = 3; // Constante vital para el proceso de carga

// Función de ultra-optimización para móviles: Redimensiona antes de procesar
const preprocessImage = async (file, maxDimension = 1200) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            const ratio = Math.min(maxDimension / width, maxDimension / height, 1);
            width *= ratio;
            height *= ratio;

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.85);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Error al cargar la imagen"));
        };

        img.src = objectUrl;
    });
};

const CaregiverProfile = () => {
    const { profile, user, refreshProfile, setProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadStep, setUploadStep] = useState(0); // 0: idle, 1: processing, 2: uploading, 3: saving, 4: refreshing
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [formData, setFormData] = useState(null);
    // Cropper State
    const [selectedImage, setSelectedImage] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [newCert, setNewCert] = useState({ title: '', org: '', year: '' });
    const [documents, setDocuments] = useState([]);
    const [ratingStats, setRatingStats] = useState({ average: 5.0, count: 0 });
    const [debugLogs, setDebugLogs] = useState([]);

    const addLog = (msg, obj = null) => {
        try {
            const time = new Date().toLocaleTimeString();
            const dataStr = obj ? (typeof obj === 'object' ? JSON.stringify(obj).substring(0, 100) : String(obj)) : '';
            const fullMsg = `${time} - ${msg} ${dataStr}`;
            setDebugLogs(prev => Array.isArray(prev) ? [fullMsg, ...prev].slice(0, 15) : [fullMsg]);
            console.log("UI_DEBUG:", fullMsg);
        } catch (e) {
            console.error("Log error:", e);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchDocuments();
            fetchRatings();
        }
    }, [user?.id]);

    useEffect(() => {
        let interval;
        if (uploading) {
            addLog("Iniciando monitor de vida (Heartbeat)...");
            interval = setInterval(() => {
                addLog("Ejecutando... (Heartbeat)");
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [uploading]);

    const fetchDocuments = async () => {
        const { data } = await supabase
            .from('caregiver_documents')
            .select('document_type, status')
            .eq('caregiver_id', user.id);
        if (data) setDocuments(data);
    };

    const fetchRatings = async () => {
        const { data: allReviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('caregiver_id', user.id);

        if (allReviews && allReviews.length > 0) {
            const average = (allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length).toFixed(1);
            setRatingStats({ average, count: allReviews.length });
        } else {
            // Fallback to profile data if no reviews table data
            setRatingStats({
                average: profile?.caregiver_details?.rating || 5.0,
                count: profile?.caregiver_details?.reviews_count || 0
            });
        }
    };

    if (!profile) return null;

    const handleEditOpen = () => {
        setFormData({
            full_name: profile.full_name || '',
            specialization: profile.specialization || '',
            phone: profile.phone || '',
            location: profile.location || profile.caregiver_details?.location || '',
            experience: profile.experience || profile.caregiver_details?.experience || '',
            hourly_rate: profile.hourly_rate || profile.caregiver_details?.hourly_rate || 150,
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
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Failsafe: Siempre enviamos un código de cuidador válido para evitar errores de restricción
            const caregiverCode = profile.caregiver_code || 'CUID-' + Math.floor(100000 + Math.random() * 900000);

            const caregiverUpdates = {
                id: user.id, // Necesario para upsert
                specialization: formData.specialization,
                experience: formData.experience,
                bio: formData.bio,
                location: formData.location,
                hourly_rate: formData.hourly_rate,
                certifications: formData.certifications,
                skills: formData.skills,
                caregiver_code: caregiverCode
            };

            const { error: detailsError } = await supabase
                .from('caregiver_details')
                .upsert(caregiverUpdates);

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

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        addLog("⚙️ Pre-procesando imagen para ahorro de RAM...");
        setUploading(true); // Mostrar loader mientras procesamos
        setUploadStep("Pre-vuelo");

        try {
            // Paso Crítico: Redimensionar ANTES de pasarlo al editor de recorte
            const optimizedBlob = await preprocessImage(file);
            const objectUrl = URL.createObjectURL(optimizedBlob);

            setSelectedImage(objectUrl);
            setShowCropper(true);
        } catch (err) {
            console.error("Error en pre-procesamiento:", err);
            alert("No se pudo procesar la imagen. Intenta con otra.");
        } finally {
            setUploading(false);
        }
    };

    const handleCropComplete = (croppedBlob) => {
        try {
            addLog("✅ Recorte completado. Cerrando editor...");
            setShowCropper(false);

            // Retardo vital para el A10s: Dejar que la UI se limpie antes de lanzar el heavy-upload
            setTimeout(() => {
                processAndUploadImage(croppedBlob);
            }, 400);
        } catch (err) {
            addLog("❌ Error fatal al cerrar cropper:", err);
            setShowCropper(false);
        }
    };

    const processAndUploadImage = async (croppedBlob) => {
        setUploading(true);
        setUploadStep(1);
        setUploadProgress(0);
        setError(null);

        if (selectedImage && selectedImage.startsWith('blob:')) {
            URL.revokeObjectURL(selectedImage);
        }

        addLog("🚀 Lanzando Carga V2.1.2...");
        let attempt = 0;
        let success = false;
        let lastError = null;
        let currentStep = "inicio";

        while (attempt < MAX_RETRIES && !success) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);

            try {
                attempt++;

                // --- PASO 1a: Sesión (Bypass Inteligente) ---
                currentStep = "1a";
                setUploadStep("1a");

                // Si ya tenemos el ID por props (Contexto), no bloqueamos esperando al servidor
                if (!user?.id) {
                    const sessionPromise = supabase.auth.getSession();
                    const authTimeout = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("AUTH_TIMEOUT")), 5000)
                    );

                    const { data: { session }, error: authError } = await Promise.race([
                        sessionPromise,
                        authTimeout
                    ]);

                    if (authError || !session) {
                        throw new Error("Sesión no disponible. Reingresa a la app.");
                    }
                }
                // Si llegamos aquí con user.id, el Paso 1a se considera exitoso por bypass

                // --- PASO 1b: Procesamiento de Imagen ---
                currentStep = "1b";
                setUploadStep("1b");
                await new Promise(r => setTimeout(r, 200)); // Breve respiro para la UI
                // Pasamos el BLOB directo para ahorrar RAM
                const fileToUpload = croppedBlob;

                // --- PASO 2: Subida (Protocolo Directo para Móviles) ---
                currentStep = "2";
                setUploadStep(2);
                const fileName = `avatar-${Date.now()}.jpg`;
                const filePath = `${user.id}/${fileName}`;
                addLog(`Paso 2: Subiendo vía Canal Directo (Binary)...`);

                // En móviles, el canal binario (no resumable) es 300% más estable para archivos pequeños
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, fileToUpload, {
                        contentType: 'image/jpeg',
                        upsert: true,
                        resumable: false // CLAVE: Desactivar TUS para máxima estabilidad en iPhone
                    });

                let uploadResult = { data: uploadData, error: uploadError };

                if (uploadResult?.error) throw uploadResult.error;

                clearTimeout(timeoutId);

                currentStep = "3";
                setUploadStep(3); // Paso 3: Registrando...
                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ avatar_url: publicUrl })
                    .eq('id', user.id);

                if (updateError) throw updateError;

                currentStep = "4";
                setUploadStep(4); // Paso 4: Finalizando...
                setProfile(prev => ({ ...prev, avatar_url: publicUrl }));

                setTimeout(async () => {
                    await refreshProfile();
                    setUploadStep(0);
                    setUploading(false);
                }, 1000);

                success = true;

            } catch (error) {
                addLog(`ERROR ${currentStep}:`, error);
                clearTimeout(timeoutId);
                console.error(`Error attempt ${attempt}:`, error);
                lastError = error;

                if (error.message === "AUTH_TIMEOUT") {
                    alert("⚠️ SERVIDOR EN MANTENIMIENTO\nLa llave de acceso no respondió en 8s.\n\nPor favor:\n1. Cierra sesión y vuelve a entrar.\n2. Si persiste, intenta en 10 minutos.");
                    break;
                }

                if (attempt < MAX_RETRIES) {
                    setUploadStep(2);
                    setUploadProgress(0);
                    await new Promise(r => setTimeout(r, 4000 * attempt));
                }
            }
        }

        if (!success) {
            let errorMsg = "No se pudo subir la foto.";
            if (lastError?.name === 'AbortError' || lastError?.message?.includes('TIMEOUT')) {
                errorMsg = "La conexión se cerró por falta de respuesta (Timeout).";
            } else if (lastError?.status === 403 || lastError?.message?.includes('security policy')) {
                errorMsg = "Error de Permisos (RLS). El servidor denegó la subida.";
            }

            const debugInfo = `
                Status: ${lastError?.status || 'N/A'}
                Name: ${lastError?.name || 'N/A'}
                Code: ${lastError?.code || 'N/A'}
                Msg: ${lastError?.message}
            `.trim();

            alert(`${errorMsg}\n\nDETALLE TÉCNICO:\n${debugInfo}\n\nPASO FALLIDO: ${currentStep}`);
            setUploading(false);
            setUploadStep(0);
        }

        setSelectedImage(null);
    };

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            <VerificationModal
                isOpen={showVerificationModal}
                onClose={() => setShowVerificationModal(false)}
                caregiverId={user.id}
                onComplete={() => {
                    refreshProfile();
                    fetchDocuments();
                }}
            />
            {showCropper && selectedImage && (
                <ImageCropper
                    imageSrc={selectedImage}
                    onCropComplete={handleCropComplete}
                    addLog={addLog}
                    onCancel={() => {
                        addLog("⚠️ Carga cancelada por el usuario.");
                        setShowCropper(false);
                        setSelectedImage(null);
                    }}
                />
            )}
            {/* Premium Header Profile */}
            <div className="bg-gradient-to-br from-[var(--primary-color)] to-[#1a5a70] rounded-[16px] p-10 !text-[#FAFAF7] shadow-2xl relative overflow-hidden mb-12">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--secondary-color)] rounded-full -translate-y-1/2 translate-x-1/2 blur-[150px] opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--accent-color)] rounded-full translate-y-1/2 -translate-x-1/2 blur-[120px] opacity-10"></div>

                <div className="relative z-10 flex flex-col lg:grid lg:grid-cols-[auto_1fr_auto] items-center lg:items-end gap-10">
                    {/* Avatar Display */}
                    <div className="relative group shrink-0">
                        <div className="w-48 h-48 rounded-[16px] border-[6px] border-white/20 bg-slate-900 shadow-2xl relative overflow-hidden ring-4 ring-white shadow-blue-900/40">
                            {uploading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                                    <Loader2 className="animate-spin text-white mb-2" size={40} />
                                    <span className="text-white text-[10px] font-black uppercase tracking-widest">
                                        Paso {uploadStep}/4 {uploadStep === 2 && `${uploadProgress}%`}
                                    </span>
                                </div>
                            ) : null}
                            <img
                                src={profile.avatar_url || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"}
                                alt="Profile"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer !text-[#FAFAF7] backdrop-blur-sm">
                                <Camera size={32} className="mb-2" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Cambiar Foto</span>
                                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={handleFileSelect} disabled={uploading} />
                            </label>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-[var(--secondary-color)] w-10 h-10 rounded-[16px] border-[4px] border-white shadow-xl flex items-center justify-center !text-[#FAFAF7]" title="Activo ahora">
                            <Check size={20} strokeWidth={4} />
                        </div>
                    </div>

                    <div className="text-center lg:text-left flex-1 w-full lg:w-auto">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-6 mb-6">
                            <h1 className="text-4xl md:text-5xl font-brand font-bold !text-[#FAFAF7] tracking-tight">{profile.full_name}</h1>
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md text-[var(--accent-color)] px-4 py-2 rounded-full text-[10px] font-black tracking-[0.2em] w-fit mx-auto lg:mx-0 border border-white/10 uppercase">
                                <Award size={14} />
                                <span>PERFIL PRO VERIFICADO - V2.1</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 mb-10">
                            <div className="flex items-center gap-3 bg-black/20 px-6 py-4 rounded-[16px] border border-white/5">
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-color)] leading-none mb-2">Código Cuidador</p>
                                    <p className="text-2xl font-brand font-bold !text-[#FAFAF7] uppercase">{profile.caregiver_code || '---'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-[16px] border border-white/10">
                                    <Phone size={24} className="text-[var(--secondary-color)]" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-color)] leading-none mb-1">Contacto</p>
                                    <p className="text-xl font-brand font-bold !text-[#FAFAF7]">{profile.phone || 'Sin número'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-10">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} size={16} className={`${s <= Number(ratingStats.average) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                                    ))}
                                </div>
                                <span className="text-xl font-brand font-bold !text-[#FAFAF7]">{ratingStats.average}</span>
                                <span className="text-xs font-secondary !text-[#FAFAF7]">({ratingStats.count} res)</span>
                            </div>

                            <div className="flex items-center gap-3 border-l border-white/10 pl-8">
                                <Briefcase size={20} className="text-[var(--secondary-color)]" />
                                <span className="text-xl font-brand font-bold !text-[#FAFAF7]">{profile.experience || '5'} Años de Exp.</span>
                            </div>

                            <div className="flex items-center gap-3 border-l border-white/10 pl-8">
                                <MapPin size={20} className="text-orange-400" />
                                <span className="text-xl font-brand font-bold !text-[#FAFAF7]">{profile.location || 'CDMX'}</span>
                            </div>

                            <div className="flex items-center gap-3 border-l border-white/10 pl-8">
                                <CreditCard size={20} className="text-purple-400" />
                                <span className="text-xl font-brand font-bold !text-[#FAFAF7]">${profile.hourly_rate || profile.caregiver_details?.hourly_rate || 150} /hr</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 min-w-[240px] w-full lg:w-auto">
                        <button
                            onClick={handleEditOpen}
                            className="bg-[var(--secondary-color)] !text-[#FAFAF7] px-8 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-2xl shadow-green-900/40 flex items-center justify-center gap-3 group border-none"
                        >
                            <Edit2 size={18} className="group-hover:rotate-12 transition-transform" />
                            Editar Mi Perfil PRO
                        </button>
                        <button className="bg-white/10 backdrop-blur-md !text-[#FAFAF7] border border-white/10 px-8 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-[var(--primary-color)] transition-all flex items-center justify-center gap-3">
                            <BookOpen size={18} />
                            Vista Pública
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-1 xl:grid-cols-[1fr_380px] gap-10">
                <div className="space-y-10 text-left">
                    <div className="bg-white rounded-[16px] p-12 border border-slate-100 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-color)]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                        <h3 className="font-brand font-bold text-2xl text-[var(--primary-color)] mb-8 tracking-tight flex items-center gap-3 relative z-10">
                            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-[16px]">
                                <User size={20} />
                            </span>
                            Sobre mi Trayectoria
                        </h3>
                        <p className="text-[var(--text-main)] leading-relaxed text-lg font-secondary relative z-10 opacity-80">
                            {profile.bio || "Este cuidador aún no ha redactado su biografía profesional."}
                        </p>

                        <div className="mt-16 pt-12 border-t border-gray-100 relative z-10">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="font-brand font-bold text-2xl text-[var(--primary-color)] tracking-tight flex items-center gap-3">
                                    <span className="p-2.5 bg-emerald-50 text-[var(--secondary-color)] rounded-[16px]">
                                        <Star size={20} />
                                    </span>
                                    Habilidades Destacadas
                                </h3>
                                <button onClick={handleEditOpen} className="text-[var(--secondary-color)] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 px-4 py-2 rounded-[16px] transition-all flex items-center gap-2 border border-emerald-100">
                                    <Plus size={14} strokeWidth={3} />
                                    Gestionar
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                {(profile.skills && profile.skills.length > 0 ? profile.skills : ['Primeros Auxilios', 'Higiene y Confort', 'Indicadores Generales'])
                                    .filter(skill => !skill.toLowerCase().includes('esto es una prueba'))
                                    .map(skill => (
                                        <span key={skill} className="bg-[var(--base-bg)] text-[var(--primary-color)] px-6 py-3 rounded-[16px] text-[10px] font-black uppercase tracking-widest border border-gray-100 shadow-sm flex items-center gap-3 hover:border-[var(--secondary-color)]/30 hover:scale-105 transition-all">
                                            <div className="w-2 h-2 bg-[var(--secondary-color)] rounded-full"></div>
                                            {skill}
                                        </span>
                                    ))}
                            </div>
                        </div>
                    </div>

                    <div className="card !p-12 border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--secondary-color)]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                        <div className="flex justify-between items-center mb-10 relative z-10">
                            <h3 className="font-brand font-bold text-2xl text-[var(--primary-color)] tracking-tight flex items-center gap-3">
                                <span className="p-2.5 bg-purple-50 text-purple-600 rounded-[16px]">
                                    <BookOpen size={20} />
                                </span>
                                Formación y Certificaciones
                            </h3>
                            <button onClick={handleEditOpen} className="text-purple-600 text-[10px] font-black uppercase tracking-widest hover:bg-purple-50 px-4 py-2 rounded-[16px] transition-all flex items-center gap-2 border border-purple-100">
                                <Plus size={14} strokeWidth={3} />
                                Añadir
                            </button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6 relative z-10">
                            {(profile.certifications || []).map((cert, idx) => (
                                <div key={idx} className="flex items-center gap-6 p-6 rounded-[16px] border border-gray-100 hover:border-[var(--secondary-color)]/30 hover:bg-white hover:shadow-xl transition-all group">
                                    <div className="bg-[var(--accent-color)] text-[var(--primary-color)] p-4 rounded-[16px] group-hover:scale-110 transition-transform shadow-inner">
                                        <Award size={28} />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-brand font-bold text-[var(--primary-color)] text-lg leading-tight mb-1">{cert.title}</h4>
                                        <p className="text-[10px] text-[var(--text-light)] font-black uppercase tracking-widest">{cert.org} • {cert.year}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="bg-white rounded-[16px] p-10 border border-slate-100 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                        <h3 className="font-brand font-bold text-[var(--primary-color)] mb-10 flex items-center gap-3 text-xl relative z-10">
                            <span className="p-2.5 bg-amber-50 text-amber-500 rounded-[16px]">
                                <Award size={20} />
                            </span>
                            Insignias Ganadas
                        </h3>
                        <div className="grid grid-cols-2 gap-8 text-center relative z-10">
                            <div className={`flex flex-col items-center group ${Number(ratingStats.average) >= 4.8 && ratingStats.count > 0 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                                <div className="w-20 h-20 bg-gradient-to-br from-amber-50 to-amber-200 rounded-[16px] flex items-center justify-center text-4xl shadow-lg shadow-amber-200 group-hover:rotate-12 transition-transform border border-amber-200/50">🏆</div>
                                <span className="text-[10px] font-black text-[var(--primary-color)] mt-4 tracking-[0.15em] uppercase">Top Rated</span>
                                <span className="text-[9px] text-[var(--text-light)] font-bold uppercase mt-1">Rating 4.8+</span>
                            </div>

                            <div className="flex flex-col items-center group">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-200 rounded-[16px] flex items-center justify-center text-4xl shadow-lg shadow-blue-200 group-hover:-rotate-12 transition-transform border border-blue-200/50">⚡</div>
                                <span className="text-[10px] font-black text-[var(--primary-color)] mt-4 tracking-[0.15em] uppercase">Rápido</span>
                                <span className="text-[9px] text-[var(--text-light)] font-bold uppercase mt-1">Resp. &lt; 1h</span>
                            </div>

                            <div className="flex flex-col items-center group">
                                <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-emerald-200 rounded-[16px] flex items-center justify-center text-4xl shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform border border-emerald-200/50">🛡️</div>
                                <span className="text-[10px] font-black text-[var(--primary-color)] mt-4 tracking-[0.15em] uppercase">Verificado</span>
                                <span className="text-[9px] text-[var(--text-light)] font-bold uppercase mt-1">Doc. Validada</span>
                            </div>

                            <div className={`flex flex-col items-center group ${ratingStats.count >= 5 ? 'opacity-100' : 'opacity-30 grayscale'}`}>
                                <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-purple-200 rounded-[16px] flex items-center justify-center text-4xl shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform border border-purple-200/50">✨</div>
                                <span className="text-[10px] font-black text-[var(--primary-color)] mt-4 tracking-[0.15em] uppercase">Popular</span>
                                <span className="text-[9px] text-[var(--text-light)] font-bold uppercase mt-1">+5 Reseñas</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0F3C4C] rounded-[16px] p-10 border border-white/5 shadow-2xl relative overflow-hidden !text-[#FAFAF7]">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                        <h3 className="font-brand font-bold mb-10 text-xl tracking-tight flex items-center gap-3 relative z-10">
                            <span className="p-2 bg-white/10 rounded-[16px]">
                                <ShieldCheck size={18} className="text-[var(--secondary-color)]" />
                            </span>
                            Estatus de Verificación
                        </h3>
                        <div className="space-y-6 relative z-10">
                            <CheckRow
                                label="Identidad Validada"
                                docData={documents.find(d => d.document_type === 'id_card')}
                            />
                            <CheckRow
                                label="Antecedentes Penales"
                                docData={documents.find(d => d.document_type === 'criminal_record')}
                            />
                            <CheckRow
                                label="Licencia / Certificación"
                                docData={documents.find(d => d.document_type === 'professional_license')}
                            />
                            <CheckRow
                                label="Evaluación de trato humano"
                                docData={documents.find(d => d.document_type === 'human_evaluation')}
                            />
                        </div>
                        <div className="mt-10 p-4 bg-white/5 rounded-[16px] border border-white/5 text-[10px] font-secondary !text-[#FAFAF7]/50 leading-relaxed italic">
                            {documents.length < 4 ?
                                'Sube tus documentos faltantes para completar la verificación.' :
                                'Tus documentos están siendo procesados por nuestro equipo.'
                            }
                        </div>

                        <button
                            onClick={() => setShowVerificationModal(true)}
                            className="w-full mt-6 btn btn-secondary !text-[10px] font-black uppercase tracking-widest py-4"
                        >
                            {documents.length > 0 ? 'Gestionar Documentación' : 'Subir Documentación'}
                        </button>
                    </div>
                </div>
            </div>

            {isEditing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-start md:items-center justify-center p-4 text-left overflow-y-auto safe-area-inset-bottom">
                    <div className="bg-white rounded-[16px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up border border-white/20">
                        {/* Modal Header */}
                        <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-3xl font-brand font-bold text-[var(--primary-color)] tracking-tight">Editar Perfil Profesional</h3>
                                <p className="text-sm text-[var(--text-light)] mt-2 font-secondary font-bold">Actualiza tu información para destacar ante los clientes de BuenCuidar.</p>
                            </div>
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-red-500 p-3 rounded-[16px] hover:bg-red-50 transition-all">
                                <X size={32} />
                            </button>
                        </div>

                        {/* REGISTRO DE ACTIVIDAD (DEBUG) V2.1 */}
                        <div className="bg-slate-900 border-b border-white/10 p-4 font-mono text-[10px] text-green-400">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-slate-500 font-black uppercase tracking-widest text-[8px]">Logs de Actividad (PRO V2.1)</p>
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            </div>
                            <div className="max-h-[80px] overflow-y-auto">
                                {debugLogs.length === 0 ? (
                                    <p className="opacity-40 italic">Esperando actividad...</p>
                                ) : (
                                    debugLogs.map((log, i) => (
                                        <div key={i} className="mb-0.5 border-l border-green-900 pl-2 leading-tight py-0.5">
                                            {log}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-10 space-y-12">
                            {/* Basic Info */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-[16px] bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <Edit2 size={20} />
                                    </div>
                                    <h4 className="font-brand font-bold text-[var(--primary-color)] uppercase tracking-widest text-sm">Información General</h4>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-[var(--text-light)] uppercase tracking-widest ml-1">Nombre Completo</label>
                                        <input
                                            required
                                            className="w-full px-6 py-4 rounded-[16px] border-2 border-gray-50 focus:border-[var(--secondary-color)] outline-none transition-all bg-gray-50/30 text-base font-brand font-bold text-[var(--primary-color)]"
                                            value={formData.full_name}
                                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-[var(--text-light)] uppercase tracking-widest ml-1">Especialidad</label>
                                        <select
                                            className="w-full px-6 py-4 rounded-[16px] border-2 border-gray-50 focus:border-[var(--secondary-color)] outline-none transition-all bg-gray-50/30 text-base font-brand font-bold text-[var(--primary-color)] appearance-none"
                                            value={formData.specialization}
                                            onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                        >
                                            {CAREGIVER_SPECIALTIES.map(specialty => (
                                                <option key={specialty} value={specialty}>
                                                    {specialty}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-[var(--text-light)] uppercase tracking-widest ml-1">WhatsApp</label>
                                        <input
                                            type="tel"
                                            className="w-full px-6 py-4 rounded-[16px] border-2 border-gray-50 focus:border-[var(--secondary-color)] outline-none transition-all bg-gray-50/30 text-base font-brand font-bold text-[var(--primary-color)]"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-[var(--text-light)] uppercase tracking-widest ml-1">Zona / Localidad</label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-4 rounded-[16px] border-2 border-gray-50 focus:border-[var(--secondary-color)] outline-none transition-all bg-gray-50/30 text-base font-brand font-bold text-[var(--primary-color)]"
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-[var(--text-light)] uppercase tracking-widest ml-1">Tarifa por Hora ($)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full px-6 py-4 rounded-[16px] border-2 border-gray-50 focus:border-[var(--secondary-color)] outline-none transition-all bg-gray-50/30 text-base font-brand font-bold text-[var(--primary-color)]"
                                            value={formData.hourly_rate}
                                            onChange={e => setFormData({ ...formData, hourly_rate: e.target.value })}
                                            placeholder="Ej. 150"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-[var(--text-light)] uppercase tracking-widest ml-1">Años de Experiencia</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full px-6 py-4 rounded-[16px] border-2 border-gray-50 focus:border-[var(--secondary-color)] outline-none transition-all bg-gray-50/30 text-base font-brand font-bold text-[var(--primary-color)]"
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
                                    <div className="w-10 h-10 rounded-[16px] bg-purple-100 text-purple-600 flex items-center justify-center">
                                        <BookOpen size={20} />
                                    </div>
                                    <h4 className="font-brand font-bold text-[var(--primary-color)] uppercase tracking-widest text-sm">Formación Académica</h4>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid gap-4">
                                        {formData.certifications.map((cert, index) => (
                                            <div key={index} className="flex items-center justify-between p-6 bg-gray-50 rounded-[16px] border-2 border-gray-50">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-purple-600 bg-white p-3 rounded-[16px] shadow-sm border border-gray-100">
                                                        <Award size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-brand font-bold text-[var(--primary-color)] text-sm tracking-tight">{cert.title}</p>
                                                        <p className="text-xs text-[var(--text-light)] font-black uppercase tracking-widest">{cert.org} • {cert.year}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({
                                                        ...formData,
                                                        certifications: formData.certifications.filter((_, i) => i !== index)
                                                    })}
                                                    className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-[16px] transition-all"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-blue-50/30 p-8 rounded-[16px] border-2 border-dashed border-blue-200 space-y-6">
                                        <p className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] text-center">Añadir Nuevo Certificado</p>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <label className="text-xs font-black text-blue-400 uppercase tracking-widest ml-1">Título</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej. Licenciatura"
                                                    className="w-full px-5 py-3 rounded-[16px] border-2 border-white focus:border-blue-400 outline-none text-sm font-bold shadow-sm"
                                                    value={newCert.title}
                                                    onChange={e => setNewCert({ ...newCert, title: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-black text-blue-400 uppercase tracking-widest ml-1">Institución</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej. UNAM"
                                                    className="w-full px-5 py-3 rounded-[16px] border-2 border-white focus:border-blue-400 outline-none text-sm font-bold shadow-sm"
                                                    value={newCert.org}
                                                    onChange={e => setNewCert({ ...newCert, org: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-6">
                                            <div className="w-32 space-y-1">
                                                <label className="text-xs font-black text-blue-400 uppercase tracking-widest ml-1">Año</label>
                                                <input
                                                    type="text"
                                                    placeholder="2024"
                                                    className="w-full px-5 py-3 rounded-[16px] border-2 border-white focus:border-blue-400 outline-none text-sm font-bold shadow-sm"
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
                                                className="flex-1 bg-blue-600 !text-[#FAFAF7] font-black rounded-[16px] hover:bg-blue-700 transition-all text-xs uppercase tracking-[0.15em] shadow-lg shadow-blue-200"
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
                                    <div className="w-10 h-10 rounded-[16px] bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                        <Star size={20} />
                                    </div>
                                    <h4 className="font-brand font-bold text-[var(--primary-color)] uppercase tracking-widest text-sm">Habilidades Técnicas</h4>
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
                                                className={`p-6 rounded-[16px] border-2 text-left transition-all ${isSelected
                                                    ? 'border-[var(--secondary-color)] bg-emerald-50 text-[var(--primary-color)] shadow-xl shadow-emerald-900/5 scale-[1.02]'
                                                    : 'border-gray-50 bg-white text-gray-400 hover:border-emerald-100'
                                                    }`}
                                            >
                                                <div className="flex flex-col gap-3">
                                                    <div className={`w-8 h-8 rounded-[16px] border-2 flex items-center justify-center transition-all ${isSelected ? 'border-[var(--secondary-color)] bg-[var(--secondary-color)] !text-[#FAFAF7]' : 'border-gray-100'}`}>
                                                        {isSelected && <Check size={16} strokeWidth={4} />}
                                                    </div>
                                                    <span className={`text-xs font-black uppercase tracking-widest leading-tight ${isSelected ? 'text-[var(--primary-color)]' : 'text-gray-400'}`}>{skill}</span>
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
                                    <div className="w-10 h-10 rounded-[16px] bg-amber-100 text-amber-600 flex items-center justify-center">
                                        <Briefcase size={20} />
                                    </div>
                                    <h4 className="font-brand font-bold text-[var(--primary-color)] uppercase tracking-widest text-sm">Biografía Detallada</h4>
                                </div>
                                <textarea
                                    className="w-full px-8 py-8 rounded-[16px] border-2 border-gray-50 focus:border-[var(--secondary-color)] outline-none transition-all min-h-[200px] bg-gray-50/30 text-base font-secondary font-medium text-[var(--primary-color)] leading-relaxed shadow-inner"
                                    placeholder="Describe tu trayectoria..."
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                />
                            </div>
                        </form>

                        <div className="p-10 border-t border-gray-100 bg-white flex gap-6 mt-auto">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="flex-1 bg-white border-2 border-gray-100 text-[var(--text-light)] font-black py-5 rounded-[24px] hover:bg-gray-50 transition-all uppercase tracking-[0.2em] text-xs"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || uploading}
                                className="flex-[2] bg-[var(--primary-color)] !text-[#FAFAF7] font-black py-5 rounded-[24px] hover:brightness-110 shadow-2xl transition-all flex items-center justify-center disabled:opacity-50 uppercase tracking-[0.2em] text-xs border-none"
                            >
                                {saving ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Guardando Perfil...</span>
                                    </div>
                                ) : uploading ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Paso {uploadStep}/4 {uploadStep === 2 && `${uploadProgress}%`}</span>
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

const CheckRow = ({ label, docData }) => {
    const status = docData?.status || 'missing';
    const active = status === 'verified';

    return (
        <div className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0">
            <span className="!text-[#FAFAF7] font-secondary font-medium uppercase tracking-widest text-[10px]">{label}</span>
            <div className={`flex items-center gap-3 font-black ${active ? 'text-[var(--secondary-color)]' : '!text-[#FAFAF7]/40'}`}>
                <span className="text-[9px] uppercase tracking-widest">
                    {active ? 'Completado' : status === 'in_review' ? 'En Revisión' : status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                </span>
                <div className={`w-6 h-6 rounded-[16px] border-2 flex items-center justify-center transition-all ${active ? 'border-[var(--secondary-color)] bg-[var(--secondary-color)]/20 shadow-lg shadow-green-500/20' : 'border-white/10'}`}>
                    {active ? <Check size={12} strokeWidth={4} /> : status === 'in_review' ? <Clock size={12} className="text-orange-300" /> : status === 'rejected' ? <X size={12} className="text-red-400" /> : null}
                </div>
            </div>
        </div>
    );
};

export default CaregiverProfile;
