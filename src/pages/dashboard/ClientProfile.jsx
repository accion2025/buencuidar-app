import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Save, Plus, X, Trash2, Edit2 } from 'lucide-react';
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
        <div className="space-y-6 animate-fade-in relative">
            <h2 className="text-2xl font-bold text-gray-800">Mi Perfil</h2>

            <div className="space-y-6">
                {/* Personal Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-700">Información Personal</h3>
                        <button
                            onClick={() => isEditing ? formRef.current?.requestSubmit() : setIsEditing(true)}
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isEditing
                                ? 'bg-[var(--primary-color)] text-white hover:brightness-90'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <span>
                                {isSaving ? 'Guardando...' : (isEditing ? <span className="flex items-center gap-2"><Save size={16} /> Guardar Cambios</span> : 'Editar Perfil')}
                            </span>
                        </button>
                    </div>

                    <form ref={formRef} id="profile-form" onSubmit={handleSave} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Nombre Completo</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej. Juan Pérez"
                                        className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-300 disabled:bg-gray-50 disabled:text-gray-500 text-gray-900 font-semibold focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-color)] outline-none transition-all"
                                    />
                                    <User size={18} className="absolute right-3 top-3 text-gray-400" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Teléfono</label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        disabled={!isEditing}
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Ej. 555-1234"
                                        className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-300 disabled:bg-gray-50 disabled:text-gray-500 text-gray-900 font-semibold focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-color)] outline-none transition-all"
                                    />
                                    <Phone size={18} className="absolute right-3 top-3 text-gray-400" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        disabled={true}
                                        value={formData.email}
                                        className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                                    />
                                    <Mail size={18} className="absolute right-3 top-3 text-gray-400" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-500 mb-1">Dirección Principal</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Calle Principal 123"
                                        className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-300 disabled:bg-gray-50 disabled:text-gray-500 text-gray-900 font-semibold focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-color)] outline-none transition-all"
                                    />
                                    <MapPin size={18} className="absolute right-3 top-3 text-gray-400" />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Family Column Wrapper */}
                <div className="flex flex-col gap-6">
                    {/* Family Members Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-700">Familiares</h3>
                            {!showAddPatientModal && (
                                <button
                                    onClick={() => {
                                        setNewPatient({ full_name: '', relation: '', birth_date: '', condition: '', age: '' });
                                        setEditingPatientId(null);
                                        setShowAddPatientModal(true);
                                    }}
                                    className="text-[var(--primary-color)] hover:bg-[var(--primary-light)]/10 p-2 rounded-full transition-colors flex items-center gap-2 text-sm font-bold bg-blue-50"
                                >
                                    <Plus size={16} />
                                    Agregar
                                </button>
                            )}
                        </div>

                        <div className="space-y-4 flex-grow overflow-y-auto max-h-[400px] custom-scrollbar">
                            {loadingPatients ? (
                                <p className="text-gray-400 text-sm text-center italic">Cargando familiares...</p>
                            ) : patients.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center italic">No has agregado familiares.</p>
                            ) : (
                                patients.map(patient => (
                                    <div key={patient.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-gray-50 group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[var(--primary-color)] text-white flex items-center justify-center font-bold text-sm">
                                                {(patient.full_name || patient.name || '?').charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{patient.full_name || patient.name || '(Sin Nombre)'}</p>
                                                <p className="text-xs text-gray-500">{(patient.notes || '').split('.')[0]} • {patient.age || 'Edad desc.'} años</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEditPatient(patient)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePatient(patient.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}


                        </div>
                    </div>
                    {/* Add Patient Inline Form */}
                    {showAddPatientModal && (
                        <div className="bg-white rounded-xl shadow-lg border-l-4 border-l-[var(--primary-color)] overflow-hidden mt-4">
                            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800">
                                    {editingPatientId ? 'Editar Familiar' : 'Agregar Nuevo Familiar'}
                                </h3>
                                <button
                                    onClick={() => setShowAddPatientModal(false)}
                                    className="text-gray-400 hover:text-gray-600 hover:bg-white p-1 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAddPatient} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-light)] outline-none font-medium text-gray-800"
                                        value={newPatient.full_name}
                                        onChange={e => setNewPatient({ ...newPatient, full_name: e.target.value })}
                                        placeholder="Nombre del familiar"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Parentesco</label>
                                        <div className="relative">
                                            <select
                                                required
                                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg appearance-none outline-none font-medium text-gray-700"
                                                value={newPatient.relation}
                                                onChange={e => setNewPatient({ ...newPatient, relation: e.target.value })}
                                            >
                                                <option value="">Seleccionar...</option>
                                                <option value="Padre/Madre">Padre/Madre</option>
                                                <option value="Hermano/a">Hermano/a</option>
                                                <option value="Abuelo/a">Abuelo/a</option>
                                                <option value="Esposo/a">Esposo/a</option>
                                                <option value="Otro">Otro</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Edad</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg outline-none font-medium text-gray-800"
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



                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddPatientModal(false)}
                                        className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addingPatient}
                                        className="flex-1 py-2.5 text-sm bg-[var(--primary-color)] text-white rounded-lg font-bold hover:shadow-md hover:brightness-105 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                    >
                                        {addingPatient ? 'Guardando...' : (editingPatientId ? 'Actualizar Familiar' : 'Guardar Familiar')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default ClientProfile;
