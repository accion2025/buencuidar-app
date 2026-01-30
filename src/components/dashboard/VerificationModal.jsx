import React, { useState } from 'react';
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
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    if (!isOpen) return null;

    const handleUpload = async (e, docType) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(docType);
        setError(null);
        setSuccess(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${docType}-${Date.now()}.${fileExt}`;
            const filePath = `${caregiverId}/${fileName}`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Register in database
            const { error: dbError } = await supabase
                .from('caregiver_documents')
                .insert({
                    caregiver_id: caregiverId,
                    document_type: docType,
                    file_path: filePath,
                    status: 'pending'
                });

            if (dbError) throw dbError;

            // Update profile overall status to in_review if it was pending
            await supabase
                .from('profiles')
                .update({ verification_status: 'in_review' })
                .eq('id', caregiverId)
                .eq('verification_status', 'pending');

            setSuccess(`Documento "${docType}" subido correctamente.`);
            if (onComplete) onComplete();
        } catch (err) {
            console.error(err);
            setError(`Error al subir ${docType}: ${err.message}`);
        } finally {
            setUploading(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[150] flex items-center justify-center p-4 text-left overflow-hidden">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl max-h-[90dvh] flex flex-col animate-slide-up border border-white/20 relative">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
                    <div>
                        <h3 className="text-xl font-brand font-bold text-[var(--primary-color)] flex items-center gap-2">
                            <ShieldCheck size={24} className="text-[var(--secondary-color)]" />
                            Portal de Verificación
                        </h3>
                        <p className="text-[10px] text-[var(--text-light)] mt-1 font-secondary font-bold">Documentación oficial requerida.</p>
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
                        {DOCUMENT_TYPES.map((doc) => (
                            <div key={doc.id} className="p-6 rounded-[16px] border border-gray-100 hover:border-[var(--secondary-color)]/20 transition-all bg-[var(--base-bg)]/30 group">
                                <div className="flex items-start justify-between gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white rounded-[16px] shadow-sm border border-gray-100 text-[var(--primary-color)] group-hover:scale-110 transition-transform">
                                            <doc.icon size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-brand font-bold text-[var(--primary-color)] text-sm tracking-tight">{doc.label}</h4>
                                            <p className="text-[10px] text-[var(--text-light)] font-secondary mt-1 leading-relaxed">{doc.description}</p>
                                        </div>
                                    </div>
                                    <label className={`shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-[16px] font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer ${uploading === doc.id
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-[var(--primary-color)] !text-[#FAFAF7] hover:brightness-110 shadow-lg shadow-blue-900/10'
                                        }`}>
                                        {uploading === doc.id ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Subiendo...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={16} />
                                                Elegir Archivo
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => handleUpload(e, doc.id)}
                                            disabled={uploading !== null}
                                        />
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 bg-blue-50/50 rounded-[16px] border border-blue-100">
                        <div className="flex gap-4">
                            <AlertCircle size={24} className="text-blue-600 shrink-0" />
                            <div>
                                <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Información de Seguridad</h5>
                                <p className="text-[10px] text-blue-700/70 leading-relaxed font-secondary">
                                    Tus documentos son procesados de forma segura y solo son visibles para nuestro equipo de auditoría para fines de validación de perfil.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-gray-100 bg-white">
                    <button
                        onClick={onClose}
                        className="w-full bg-[var(--base-bg)] text-[var(--primary-color)] font-black py-4 rounded-[16px] hover:bg-gray-100 transition-all uppercase tracking-widest text-[10px]"
                    >
                        Cerrar y Revisar Después
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerificationModal;
