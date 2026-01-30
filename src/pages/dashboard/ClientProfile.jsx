import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Save, Plus, X, Trash2, Edit2, Loader2, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const ClientProfile = () => {
    const { profile, profileLoading, refreshProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Initial state from profile
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    // Update state when profile loads
    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.full_name || '',
                email: profile.email || '',
                phone: profile.phone || '',
                address: profile.address || ''
            });
        }
    }, [profile]);

    // Patients State
    const [patients, setPatients] = useState([]);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [showAddPatientModal, setShowAddPatientModal] = useState(false);
    const [newPatient, setNewPatient] = useState({
        full_name: '',
        relation: '',
        birth_date: '',
        condition: ''
    });
    const [addingPatient, setAddingPatient] = useState(false);
    const [editingPatientId, setEditingPatientId] = useState(null);

    // Fetch Patients
    const fetchPatients = async () => {
        try {
            setLoadingPatients(true);
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('family_id', profile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPatients(data || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setLoadingPatients(false);
        }
    };

    useEffect(() => {
        if (profile?.id) {
            fetchPatients();
        }
    }, [profile]);

    const handleAddPatient = async (e) => {
        e.preventDefault();
        if (!profile?.id) {
            alert("Error: No se ha podido cargar la información del perfil. Por favor recarga la página.");
            return;
        }
        setAddingPatient(true);
        try {
            const validDate = newPatient.birth_date;

            // Relation goes to notes (missing column), Care Needs goes to its own column
            const notesContent = `Parentesco: ${newPatient.relation}`;

            const payload = {
                family_id: profile.id,
                full_name: newPatient.full_name,
                name: newPatient.full_name, // Redundant backup
                age: newPatient.age ? parseInt(newPatient.age, 10) : 0,
                birth_date: validDate || null,
                condition: newPatient.condition || '',
                notes: notesContent
            };

            if (editingPatientId) {
                // UPDATE Logic
                const { error } = await supabase
                    .from('patients')
                    .update(payload)
                    .eq('id', editingPatientId);

                if (error) throw error;
                alert('Familiar actualizado correctamente');
            } else {
                // INSERT Logic
                const { error } = await supabase
                    .from('patients')
                    .insert([payload]);

                if (error) throw error;
                alert('Familiar agregado correctamente');
            }

            // Update list immediately
            await fetchPatients();

            // Reset form and close
            setNewPatient({ full_name: '', relation: '', birth_date: '', condition: '', age: '' });
            setEditingPatientId(null);
            setShowAddPatientModal(false);

        } catch (error) {
            console.error('Error saving patient:', error);
            alert('Error al guardar: ' + error.message);
        } finally {
            setAddingPatient(false);
        }
    };

    const handleDeletePatient = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este familiar?')) return;

        try {
            const { error } = await supabase
                .from('patients')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchPatients();
        } catch (error) {
            console.error('Error deleting patient:', error);
            alert('Error al eliminar');
        }
    };

    const startEditPatient = (patient) => {
        let relation = '';
        // Parse "Parentesco: X" from notes
        if (patient.notes && patient.notes.includes('Parentesco:')) {
            relation = patient.notes.split('Parentesco:')[1].split('.')[0].trim();
        }

        setNewPatient({
            full_name: patient.full_name || patient.name,
            age: patient.age,
            relation: relation,
            condition: patient.condition || '',
            birth_date: patient.birth_date || ''
        });
        setEditingPatientId(patient.id);
        setShowAddPatientModal(true);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setIsSaving(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.name,
                    phone: formData.phone,
                    address: formData.address,
                })
                .eq('id', profile.id);

            if (error) throw error;

            if (refreshProfile) {
                await refreshProfile();
            }

            setIsEditing(false);
            alert('Perfil actualizado correctamente');

        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error al actualizar el perfil');
        } finally {
            setIsSaving(false);
        }
    };

    if (profileLoading && !profile) {
        return <div className="p-8 text-center text-gray-500">Cargando perfil...</div>;
    }

    const formRef = React.useRef(null);

    // Helper to calculate age from birth_date
    const calculateAge = (birthDateString) => {
        if (!birthDateString) return 'N/A';
        const today = new Date();
        const birthDate = new Date(birthDateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    return (
        <div className="space-y-12 animate-fade-in pb-12">
            {/* Header */}
            <div className="bg-gradient-to-br from-[var(--primary-color)] to-[#1a5a70] rounded-[16px] p-10 !text-[#FAFAF7] shadow-2xl relative overflow-hidden mb-12">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--secondary-color)] rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px] opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--accent-color)] rounded-full translate-y-1/2 -translate-x-1/2 blur-[100px] opacity-10"></div>

                <div className="relative z-10">
                    <span className="bg-white/10 text-[var(--accent-color)] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block border border-white/10 backdrop-blur-md">
                        Configuración de Cuenta
                    </span>
                    <h1 className="text-4xl md:text-5xl font-brand font-bold tracking-tight mb-2 text-left !text-[#FAFAF7]">
                        Mi Perfil
                    </h1>
                    <p className="text-[var(--accent-color)] text-lg font-secondary max-w-xl">
                        Gestiona tu información personal y los perfiles de tus familiares.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Personal Info Card */}
                <div className="card !p-10 border-none shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-color)]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 relative z-10">
                        <h3 className="text-2xl font-brand font-bold text-[var(--primary-color)] tracking-tight flex items-center gap-3">
                            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-[16px]">
                                <User size={24} />
                            </span>
                            Información Personal
                        </h3>
                        <button
                            onClick={() => isEditing ? formRef.current?.requestSubmit() : setIsEditing(true)}
                            disabled={isSaving}
                            className={`flex items-center gap-3 px-8 py-3.5 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${isEditing
                                ? 'bg-[var(--secondary-color)] !text-[#FAFAF7] hover:bg-emerald-600 shadow-green-100'
                                : 'bg-[var(--base-bg)] text-[var(--primary-color)] hover:bg-gray-100'
                                }`}
                        >
                            {isSaving ? (
                                <span className="flex items-center gap-2 italic">Guardando...</span>
                            ) : (
                                isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <span onClick={(e) => {
                                            e.stopPropagation();
                                            setIsEditing(false);
                                            // Reset form data to original profile values
                                            if (profile) {
                                                setFormData({
                                                    name: profile.full_name || '',
                                                    email: profile.email || '',
                                                    phone: profile.phone || '',
                                                    address: profile.address || ''
                                                });
                                            }
                                        }} className="cursor-pointer hover:underline opacity-80 mr-2 text-[9px]">CANCELAR</span>
                                        <span className="flex items-center gap-2"><Save size={16} /> Guardar Cambios</span>
                                    </div>
                                ) : (
                                    <span className="flex items-center gap-2"><Edit2 size={16} /> Editar Perfil</span>
                                )
                            )}
                        </button>
                    </div>

                    <form ref={formRef} id="profile-form" onSubmit={handleSave} className="space-y-8 relative z-10">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Nombre Completo</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej. Juan Pérez"
                                        className="w-full pl-6 pr-12 py-4 rounded-[16px] border border-gray-100 disabled:bg-gray-50 disabled:text-gray-400 text-[var(--primary-color)] font-bold text-lg focus:ring-4 focus:ring-[var(--secondary-color)]/10 focus:border-[var(--secondary-color)]/30 outline-none transition-all shadow-sm"
                                    />
                                    <User size={20} className={`absolute right-5 top-5 transition-colors ${isEditing ? 'text-[var(--secondary-color)]' : 'text-gray-300'}`} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Teléfono</label>
                                <div className="relative group">
                                    <input
                                        type="tel"
                                        disabled={!isEditing}
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Ej. 555-1234"
                                        className="w-full pl-6 pr-12 py-4 rounded-[16px] border border-gray-100 disabled:bg-gray-50 disabled:text-gray-400 text-[var(--primary-color)] font-bold text-lg focus:ring-4 focus:ring-[var(--secondary-color)]/10 focus:border-[var(--secondary-color)]/30 outline-none transition-all shadow-sm"
                                    />
                                    <Phone size={20} className={`absolute right-5 top-5 transition-colors ${isEditing ? 'text-[var(--secondary-color)]' : 'text-gray-300'}`} />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Email</label>
                                <div className="relative opacity-60">
                                    <input
                                        type="email"
                                        disabled={true}
                                        value={formData.email}
                                        className="w-full pl-6 pr-12 py-4 rounded-[16px] border border-gray-100 bg-gray-50 text-[var(--text-light)] font-bold text-lg cursor-not-allowed outline-none"
                                    />
                                    <Mail size={20} className="absolute right-5 top-5 text-gray-300" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Dirección Principal</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Calle Principal 123"
                                        className="w-full pl-6 pr-12 py-4 rounded-[16px] border border-gray-100 disabled:bg-gray-50 disabled:text-gray-400 text-[var(--primary-color)] font-bold text-lg focus:ring-4 focus:ring-[var(--secondary-color)]/10 focus:border-[var(--secondary-color)]/30 outline-none transition-all shadow-sm"
                                    />
                                    <MapPin size={20} className={`absolute right-5 top-5 transition-colors ${isEditing ? 'text-[var(--secondary-color)]' : 'text-gray-300'}`} />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Family Column Wrapper */}
                <div className="flex flex-col gap-8">
                    {/* Family Members Card */}
                    <div className="card !p-10 border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--secondary-color)]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl"></div>

                        <div className="flex justify-between items-center mb-10 relative z-10">
                            <h3 className="text-2xl font-brand font-bold text-[var(--primary-color)] tracking-tight flex items-center gap-3">
                                <span className="p-2.5 bg-purple-50 text-purple-600 rounded-[16px]">
                                    <Plus size={24} />
                                </span>
                                Familiares
                            </h3>
                            {!showAddPatientModal && (
                                <button
                                    onClick={() => {
                                        setNewPatient({ full_name: '', relation: '', birth_date: '', condition: '', age: '' });
                                        setEditingPatientId(null);
                                        setShowAddPatientModal(true);
                                    }}
                                    className="bg-[var(--secondary-color)] !text-[#FAFAF7] px-6 py-3 rounded-[16px] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-green-100"
                                >
                                    <Plus size={16} strokeWidth={3} />
                                    Agregar Nuevo
                                </button>
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                            {loadingPatients ? (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center bg-[var(--base-bg)]/50 rounded-[16px] border border-dashed border-gray-200">
                                    <Loader2 className="animate-spin text-[var(--secondary-color)] mb-4" size={32} />
                                    <p className="text-[var(--text-light)] text-sm font-secondary italic">Cargando familiares...</p>
                                </div>
                            ) : patients.length === 0 ? (
                                <div className="col-span-full py-24 flex flex-col items-center justify-center bg-[var(--base-bg)]/50 rounded-[16px] border border-dashed border-gray-200">
                                    <User className="text-gray-300 mb-6 opacity-30" size={64} />
                                    <p className="text-[var(--text-light)] text-lg font-secondary italic">No has agregado familiares todavía.</p>
                                </div>
                            ) : (
                                patients.map(patient => (
                                    <div key={patient.id} className="p-8 bg-white rounded-[16px] border border-gray-100 hover:border-[var(--secondary-color)]/30 hover:shadow-2xl transition-all group relative overflow-hidden">
                                        <div className="flex items-center gap-6 relative z-10">
                                            <div className="w-16 h-16 rounded-[16px] bg-[var(--accent-color)]/20 text-[var(--primary-color)] flex items-center justify-center font-brand font-bold text-2xl shadow-inner group-hover:bg-[var(--secondary-color)] group-hover:text-white transition-all transform group-hover:scale-105">
                                                {(patient.full_name || patient.name || '?').charAt(0)}
                                            </div>
                                            <div className="text-left flex-1">
                                                <p className="font-brand font-bold text-[var(--primary-color)] text-xl tracking-tight line-clamp-1">{patient.full_name || patient.name || '(Sin Nombre)'}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-[var(--secondary-color)] font-black uppercase tracking-[0.2em]">{(patient.notes || '').split('.')[0].replace('Parentesco:', '').trim() || 'Familiar'}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    <span className="text-[10px] text-[var(--text-light)] font-black uppercase tracking-[0.2em]">{patient.age || '---'} años</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 flex gap-3 opacity-100 relative z-10 w-full">
                                            <button
                                                onClick={() => startEditPatient(patient)}
                                                className="flex-1 bg-gray-100 text-[var(--primary-color)] py-3.5 rounded-[12px] text-[11px] font-black uppercase tracking-widest hover:bg-[var(--secondary-color)] hover:text-white transition-all flex items-center justify-center gap-2 border border-gray-200 shadow-sm"
                                            >
                                                <Edit2 size={16} /> Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeletePatient(patient.id)}
                                                className="aspect-square bg-red-50 text-red-400 p-3.5 rounded-[12px] hover:text-white hover:bg-red-500 border border-red-100 transition-all shadow-sm flex items-center justify-center"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent-color)]/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl group-hover:bg-[var(--secondary-color)]/5 transition-colors"></div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    {/* Add Patient Modal Overlay */}
                    {showAddPatientModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                            <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto !p-8 border-none shadow-2xl relative animate-fade-in-up bg-[#fcfdff]">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary-color)]/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-[80px]"></div>

                                <div className="flex justify-between items-center mb-8 relative z-10 sticky top-0 bg-[#fcfdff]/95 backdrop-blur-sm py-2 border-b border-gray-100">
                                    <h3 className="text-2xl md:text-3xl font-brand font-bold text-[var(--primary-color)] tracking-tight">
                                        {editingPatientId ? 'Actualizar Información' : 'Nuevo Familiar'}
                                    </h3>
                                    <button
                                        onClick={() => setShowAddPatientModal(false)}
                                        className="p-2 bg-gray-100 text-gray-500 hover:text-[var(--primary-color)] hover:bg-gray-200 rounded-full transition-all"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleAddPatient} className="space-y-6 relative z-10">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Nombre Completo</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-5 py-3 rounded-[12px] border border-gray-200 text-[var(--primary-color)] font-bold text-lg focus:ring-4 focus:ring-[var(--secondary-color)]/10 focus:border-[var(--secondary-color)]/30 outline-none transition-all shadow-sm"
                                            value={newPatient.full_name}
                                            onChange={e => setNewPatient({ ...newPatient, full_name: e.target.value })}
                                            placeholder="Nombre completo del familiar"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Parentesco</label>
                                            <div className="relative">
                                                <select
                                                    required
                                                    className="w-full px-5 py-3 rounded-[12px] border border-gray-200 text-[var(--primary-color)] font-bold text-lg focus:ring-4 focus:ring-[var(--secondary-color)]/10 focus:border-[var(--secondary-color)]/30 outline-none transition-all shadow-sm appearance-none bg-white"
                                                    value={newPatient.relation}
                                                    onChange={e => setNewPatient({ ...newPatient, relation: e.target.value })}
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    <option value="Padre/Madre">Padre/Madre</option>
                                                    <option value="Hermano/a">Hermano/a</option>
                                                    <option value="Abuelo/a">Abuelo/a</option>
                                                    <option value="Esposo/a">Esposo/a</option>
                                                    <option value="Hijo/a">Hijo/a</option>
                                                    <option value="Otro">Otro</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[var(--secondary-color)]">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">Edad Actual</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                className="w-full px-5 py-3 rounded-[12px] border border-gray-200 text-[var(--primary-color)] font-bold text-lg focus:ring-4 focus:ring-[var(--secondary-color)]/10 focus:border-[var(--secondary-color)]/30 outline-none transition-all shadow-sm"
                                                value={newPatient.age || ''}
                                                onChange={e => {
                                                    const age = e.target.value;
                                                    const currentYear = new Date().getFullYear();
                                                    const birthYear = currentYear - parseInt(age || 0);
                                                    const approxBirthDate = `${birthYear}-01-01`;
                                                    setNewPatient({ ...newPatient, age: age, birth_date: approxBirthDate });
                                                }}
                                                placeholder="Ej. 75"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6 mt-4 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddPatientModal(false)}
                                            className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 rounded-[12px] hover:bg-gray-200 transition-all border border-transparent"
                                        >
                                            Cancelar
                                        </button>

                                        {/* Delete Button (Only in Edit Mode) */}
                                        {editingPatientId && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (window.confirm('¿Estás seguro de eliminar este familiar?')) {
                                                        handleDeletePatient(editingPatientId);
                                                        setShowAddPatientModal(false);
                                                    }
                                                }}
                                                className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-red-500 bg-red-50 rounded-[12px] hover:bg-red-100 transition-all border border-red-100 flex items-center justify-center gap-2"
                                            >
                                                <Trash2 size={16} /> Eliminar
                                            </button>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={addingPatient || !newPatient.full_name || !newPatient.relation}
                                            className="flex-[2] py-4 text-[11px] font-black uppercase tracking-widest bg-[var(--secondary-color)] !text-[#FAFAF7] rounded-[12px] hover:bg-emerald-600 shadow-xl shadow-green-900/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-none"
                                        >
                                            {addingPatient ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" /> Guardando...
                                                </>
                                            ) : (
                                                editingPatientId ? (
                                                    <><Check size={18} strokeWidth={3} /> Actualizar Datos</>
                                                ) : (
                                                    <><Plus size={18} strokeWidth={3} /> Guardar Familiar</>
                                                )
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default ClientProfile;
