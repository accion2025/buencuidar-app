import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, Check, X, FileText, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

const AdminVerification = () => {
    const [pendingDocs, setPendingDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState(null);

    useEffect(() => {
        fetchPendingDocuments();
    }, []);

    const fetchPendingDocuments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('caregiver_documents')
                .select('*, profiles(full_name, avatar_url)')
                .eq('status', 'pending')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setPendingDocs(data || []);
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (docId, caregiverId, status, reason = '') => {
        setActioning(docId);
        try {
            // 1. Update document status
            const { error: docError } = await supabase
                .from('caregiver_documents')
                .update({
                    status,
                    rejection_reason: reason,
                    updated_at: new Date().toISOString()
                })
                .eq('id', docId);

            if (docError) throw docError;

            // 2. If all docs are verified, update profile
            if (status === 'verified') {
                const { data: remaining } = await supabase
                    .from('caregiver_documents')
                    .select('id')
                    .eq('caregiver_id', caregiverId)
                    .neq('status', 'verified');

                if (!remaining || remaining.length === 0) {
                    await supabase
                        .from('profiles')
                        .update({
                            verification_status: 'verified',
                            verified_at: new Date().toISOString()
                        })
                        .eq('id', caregiverId);
                }
            } else if (status === 'rejected') {
                await supabase
                    .from('profiles')
                    .update({
                        verification_status: 'rejected',
                        rejection_reason: reason
                    })
                    .eq('id', caregiverId);
            }

            setPendingDocs(prev => prev.filter(d => d.id !== docId));
        } catch (error) {
            console.error("Error handling action:", error);
            alert("No se pudo procesar la acción.");
        } finally {
            setActioning(null);
        }
    };

    const handleViewDocument = async (path) => {
        try {
            const { data, error } = await supabase.storage
                .from('documents')
                .createSignedUrl(path, 3600); // 1 hour expiry

            if (error) throw error;
            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank');
            }
        } catch (error) {
            console.error("Error generating signed URL:", error);
            alert("No se pudo generar el enlace al documento.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-[var(--secondary-color)]" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-brand font-bold text-2xl text-gray-800 flex items-center gap-3">
                    <ShieldCheck className="text-[var(--secondary-color)]" size={32} />
                    Documentos por Verificar
                </h3>
                <span className="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {pendingDocs.length} Pendientes
                </span>
            </div>

            {pendingDocs.length === 0 ? (
                <div className="bg-white p-20 rounded-[16px] border border-dashed border-gray-200 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-[16px] flex items-center justify-center mx-auto mb-6">
                        <Check size={40} className="text-gray-200" />
                    </div>
                    <p className="text-gray-400 font-secondary text-lg font-bold">No hay documentos pendientes de revisión.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {pendingDocs.map((doc) => (
                        <div key={doc.id} className="bg-white p-8 rounded-[16px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--secondary-color)]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10 text-left">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[16px] overflow-hidden border-2 border-[var(--base-bg)] shadow-md">
                                        <img
                                            src={doc.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${doc.profiles?.full_name}`}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-brand font-bold text-xl text-[var(--primary-color)] leading-tight">{doc.profiles?.full_name}</h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">{doc.document_type}</span>
                                            <span className="text-[10px] font-secondary text-gray-400">Enviado: {new Date(doc.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleViewDocument(doc.file_path)}
                                        className="btn btn-outline flex items-center gap-2 py-4 px-6 text-[10px] font-black uppercase tracking-widest"
                                    >
                                        <FileText size={18} />
                                        Ver Documento
                                        <ExternalLink size={14} />
                                    </button>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAction(doc.id, doc.caregiver_id, 'verified')}
                                            disabled={actioning === doc.id}
                                            className="bg-emerald-500 hover:bg-emerald-600 !text-[#FAFAF7] p-4 rounded-[16px] shadow-lg shadow-emerald-100 transition-all border-none"
                                            title="Aprobar"
                                        >
                                            {actioning === doc.id ? <Loader2 className="animate-spin" size={24} /> : <Check size={24} strokeWidth={3} />}
                                        </button>
                                        <button
                                            onClick={() => {
                                                const reason = prompt("Razón del rechazo:");
                                                if (reason) handleAction(doc.id, doc.caregiver_id, 'rejected', reason);
                                            }}
                                            disabled={actioning === doc.id}
                                            className="bg-red-500 hover:bg-red-600 !text-[#FAFAF7] p-4 rounded-[16px] shadow-lg shadow-red-100 transition-all border-none"
                                            title="Rechazar"
                                        >
                                            <X size={24} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminVerification;
