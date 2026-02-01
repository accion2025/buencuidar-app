import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Check, AlertCircle, Loader2, FileText, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const DOCUMENT_TYPES = [
    { id: 'id_card', label: 'Identificación Oficial (INE/Pasaporte)', icon: FileText, description: 'Sube una foto clara de ambos lados de tu identificación.' },
    { id: 'criminal_record', label: 'Antecedentes Penales', icon: ShieldCheck, description: 'Certificado de no antecedentes penales con vigencia menor a 3 meses.' },
    { id: 'professional_license', label: 'Cédula o Certificación', icon: Check, description: 'Título o cédula profesional que avale tus conocimientos.' },
    { id: 'human_evaluation', label: 'Evaluación de trato humano', icon: ShieldCheck, description: 'Certificado de evaluación de confianza y trato al paciente.' }
];

const VerificationModal = ({ isOpen, onClose, caregiverId, onComplete }) => {
    const [uploading, setUploading] = useState(null);
    const [uploadStep, setUploadStep] = useState(0);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [userDocs, setUserDocs] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    React.useEffect(() => {
        if (isOpen && caregiverId) {
            fetchUserDocs();
        }
    }, [isOpen, caregiverId]);

    const fetchUserDocs = async () => {
        setLoadingDocs(true);
        try {
            const { data, error } = await supabase
                .from('caregiver_documents')
                .select('*')
                .eq('caregiver_id', caregiverId);

            if (error) throw error;
            setUserDocs(data || []);
        } catch (err) {
            console.error("Error fetching docs:", err);
        } finally {
            setLoadingDocs(false);
        }
    };

    if (!isOpen) return null;

    const handleUpload = async (e, docType) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Punto 2: Limitar tamaño a 5MB
        if (file.size > 5 * 1024 * 1024) {
            setError("⚠️ El archivo es demasiado grande. El límite permitido es de 5MB.");
            return;
        }

        setUploading(docType);
        setUploadStep(1); // Paso 1: Procesando...
        setError(null);
        setSuccess(null);

        try {
            // Conversión Binaria
            const arrayBuffer = await file.arrayBuffer();

            setUploadStep(2); // Paso 2: Subiendo...
            const fileExt = file.name.split('.').pop();
            const fileName = `${docType}-${Date.now()}.${fileExt}`;
            const filePath = `${caregiverId}/${fileName}`;

            const isPdf = fileExt.toLowerCase() === 'pdf';
            const contentType = isPdf ? 'application/pdf' : `image/${fileExt === 'png' ? 'png' : 'jpeg'}`;

            const uploadTask = supabase.storage
                .from('documents')
                .upload(filePath, arrayBuffer, {
                    contentType: contentType,
                    upsert: true
                });

            // Timeout de 60 segundos
            const { error: uploadError } = await Promise.race([
                uploadTask,
                new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 60000))
            ]);

            if (uploadError) throw uploadError;

            setUploadStep(3); // Paso 3: Guardando registro...
            const { error: dbError } = await supabase
                .from('caregiver_documents')
                .upsert({
                    caregiver_id: caregiverId,
                    document_type: docType,
                    file_path: filePath,
                    status: 'pending'
                }, { onConflict: 'caregiver_id,document_type' }); // Ensure unique doc per type

            if (dbError) throw dbError;

            await supabase
                .from('profiles')
                .update({ verification_status: 'in_review' })
                .eq('id', caregiverId)
                .eq('verification_status', 'pending');

            setUploadStep(4); // Paso 4: Finalizando...
            setSuccess(`Documento "${docType}" subido correctamente.`);
            await fetchUserDocs();
            if (onComplete) onComplete();
        } catch (err) {
            console.error(err);
            let errorMsg = `No se pudo subir el documento "${docType}".`;
            if (err.message === 'TIMEOUT') {
                errorMsg = "La subida tardó más de 1 minuto. El servidor está saturado o tu conexión falló.";
            } else {
                if (err.message?.includes('storage')) errorMsg += " Error en el servidor de archivos.";
            }
            setError(`${errorMsg}\n(Detalle: ${err.message} - Paso ${uploadStep})`);
        } finally {
            setUploading(null);
            setUploadStep(0);
        }
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[9999] flex items-center justify-center p-0 md:p-6 text-left overflow-hidden">
            <div className="bg-white rounded-none md:rounded-[24px] shadow-2xl w-full max-w-2xl h-full md:h-auto md:max-h-[90dvh] flex flex-col animate-slide-up border-none md:border border-white/20 relative">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
                    <div>
                        <h3 className="text-xl font-brand font-bold text-[var(--primary-color)] flex items-center gap-2">
                            <ShieldCheck size={24} className="text-[var(--secondary-color)]" />
                            Portal de Verificación
                        </h3>
                        <p className="text-xs text-[var(--text-light)] mt-1 font-secondary font-bold">Documentación oficial requerida.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-[16px] text-red-600 flex items-center gap-3 text-sm animate-shake">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-[16px] text-[var(--secondary-color)] flex items-center gap-3 text-sm animate-fade-in">
                            <Check size={20} />
                            {success}
                        </div>
                    )}

                    <div className="grid gap-4">
                        {DOCUMENT_TYPES.map((doc) => {
                            const existingDoc = userDocs.find(d => d.document_type === doc.id);

                            return (
                                <div key={doc.id} className={`p-6 rounded-[24px] border transition-all ${existingDoc ? 'bg-emerald-50/20 border-emerald-100' : 'bg-[var(--base-bg)]/30 border-gray-100'
                                    } hover:shadow-md group relative overflow-hidden`}>
                                    {existingDoc?.status === 'verified' && (
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                                    )}

                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-[16px] shadow-sm border transition-transform group-hover:scale-105 ${existingDoc?.status === 'verified' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white text-[var(--primary-color)] border-gray-100'
                                                }`}>
                                                {existingDoc?.status === 'verified' ? <Check size={24} strokeWidth={3} /> : <doc.icon size={24} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-brand font-bold text-[var(--primary-color)] text-sm tracking-tight">{doc.label}</h4>
                                                    {existingDoc && (
                                                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border ${existingDoc.status === 'verified' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                            existingDoc.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                                'bg-orange-100 text-orange-700 border-orange-200'
                                                            }`}>
                                                            {existingDoc.status === 'verified' ? 'Verificado' :
                                                                existingDoc.status === 'rejected' ? 'Rechazado' :
                                                                    'En Revisión'}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[var(--text-light)] font-secondary mt-1 leading-relaxed max-w-md">{doc.description}</p>
                                                {existingDoc?.rejection_reason && (
                                                    <p className="text-[10px] text-red-600 font-bold mt-2 bg-red-50 p-2 rounded-lg border border-red-100">
                                                        Motivo: {existingDoc.rejection_reason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <label className={`relative shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-[16px] font-black text-xs uppercase tracking-widest transition-all cursor-pointer ${uploading === doc.id
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : existingDoc?.status === 'verified'
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                                                : 'bg-[var(--primary-color)] !text-[#FAFAF7] hover:brightness-110 shadow-lg shadow-blue-900/10'
                                            }`}>
                                            {uploading === doc.id ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Paso {uploadStep}/4...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={16} />
                                                    {existingDoc ? 'Actualizar' : 'Elegir Archivo'}
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                accept="image/*,application/pdf"
                                                onChange={(e) => handleUpload(e, doc.id)}
                                                disabled={uploading !== null}
                                            />
                                        </label>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-6 bg-blue-50/50 rounded-[16px] border border-blue-100">
                        <div className="flex gap-4">
                            <AlertCircle size={24} className="text-blue-600 shrink-0" />
                            <div>
                                <h5 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Información de Seguridad</h5>
                                <p className="text-xs text-blue-700/70 leading-relaxed font-secondary">
                                    Tus documentos son procesados de forma segura y solo son visibles para nuestro equipo de auditoría para fines de validación de perfil.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-gray-100 bg-white">
                    <button
                        onClick={onClose}
                        className="w-full bg-[var(--base-bg)] text-[var(--primary-color)] font-black py-4 rounded-[16px] hover:bg-gray-100 transition-all uppercase tracking-widest text-xs"
                    >
                        Cerrar y Revisar Después
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default VerificationModal;
