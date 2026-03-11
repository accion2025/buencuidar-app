
import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, Shield, ShieldOff, User, Edit2, CheckCircle, XCircle, Eye, EyeOff, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, family, caregiver

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u => {
        if (u.role === 'admin') return false; // Excluimos administradores de la tabla visual
        if (filter === 'all') return true;
        return u.role === filter;
    });

    const handleToggleBan = async (userId, currentStatus) => {
        const action = currentStatus ? 'desbloquear' : 'bloquear';
        if (!window.confirm(`¿Estás seguro de que deseas ${action} a este usuario?`)) return;

        try {
            const { error } = await supabase.rpc('toggle_user_ban', { target_user_id: userId });

            if (error) throw error;

            // Optimistic update
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, is_banned: !currentStatus } : u
            ));

        } catch (error) {
            console.error('Error toggling ban:', error);
            alert('Error al cambiar el estado del usuario. Asegúrate de haber corrido el script SQL setup_blocking_policy.sql');
        }
    };

    const handleToggleActive = async (userId, currentStatus) => {
        // currentStatus representa is_active (true = visible, false = oculto)
        // Por defecto en la BD nueva o null, asumiremos true.
        const isActive = currentStatus !== false;
        const action = isActive ? 'ocultar' : 'mostrar';
        const description = isActive
            ? 'Este usuario será expulsado del buscador (baja lógica).'
            : 'Este usuario volverá a ser visible en el buscador.';

        if (!window.confirm(`¿Estás seguro de que deseas ${action} a este usuario?\n\n${description}`)) return;

        try {
            const { error } = await supabase.rpc('toggle_user_active_status', { target_user_id: userId });

            if (error) throw error;

            // Optimistic update
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, is_active: !isActive } : u
            ));

        } catch (error) {
            console.error('Error toggling active status:', error);
            alert('Error al cambiar la visibilidad del usuario. Asegúrate de ejecutar el script supabase_soft_delete.sql en Supabase.');
        }
    };

    const [editingId, setEditingId] = useState(null);
    const [tempRole, setTempRole] = useState(null);

    const handleStartEdit = (user) => {
        setEditingId(user.id);
        setTempRole(user.role);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setTempRole(null);
    };

    const handleSaveRole = async (user) => {
        if (!tempRole || tempRole === user.role) {
            handleCancelEdit();
            return;
        }

        const confirmMsg = tempRole === 'caregiver'
            ? `¿Estás seguro de cambiar a ${user.email} al rol de CUIDADOR?\n\nSe creará una ficha pública vacía para este usuario.`
            : `¿Estás seguro de cambiar el rol de ${user.email} a ${tempRole}?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            const { data, error } = await supabase.rpc('change_user_role', {
                target_email: user.email,
                new_role: tempRole
            });

            if (error) throw error;

            alert("Rol actualizado correctamente.");

            // Optimistic update
            setUsers(prev => prev.map(u =>
                u.id === user.id ? { ...u, role: tempRole } : u
            ));

            handleCancelEdit();

        } catch (error) {
            console.error("Error changing role:", error);
            alert("Error al cambiar el rol: " + (error.message || error.details));
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
                <div className="flex items-center gap-2 bg-white p-1 rounded-[16px] border border-gray-200 shadow-sm">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${filter === 'all' ? 'bg-slate-800 !text-[#FAFAF7]' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Todos <span className="ml-1 opacity-80 font-normal">({users.filter(u => u.role !== 'admin' && u.is_active !== false).length}/{users.filter(u => u.role !== 'admin').length})</span>
                    </button>
                    <button
                        onClick={() => setFilter('family')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${filter === 'family' ? 'bg-slate-800 !text-[#FAFAF7]' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Familias <span className="ml-1 opacity-80 font-normal">({users.filter(u => u.role === 'family' && u.is_active !== false).length}/{users.filter(u => u.role === 'family').length})</span>
                    </button>
                    <button
                        onClick={() => setFilter('caregiver')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${filter === 'caregiver' ? 'bg-slate-800 !text-[#FAFAF7]' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Cuidadores <span className="ml-1 opacity-80 font-normal">({users.filter(u => u.role === 'caregiver' && u.is_active !== false).length}/{users.filter(u => u.role === 'caregiver').length})</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
                <div className="overflow-auto flex-1 relative">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50">Usuario</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50">Rol</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50">Estado</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50">Suscripción</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right bg-gray-50">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="even:bg-white odd:bg-slate-100 hover:bg-slate-200 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    (user.full_name || user.email || '?').charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{user.full_name || 'Sin Nombre'}</p>
                                                <p className="text-xs text-gray-400">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {editingId === user.id ? (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={tempRole}
                                                    onChange={(e) => setTempRole(e.target.value)}
                                                    className="pl-2 pr-8 py-1 rounded-md text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                                                    autoFocus
                                                >
                                                    <option value="family">Familia</option>
                                                    <option value="caregiver">Cuidador</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                <button onClick={() => handleSaveRole(user)} className="text-green-600 hover:text-green-800" title="Guardar">
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button onClick={handleCancelEdit} className="text-red-400 hover:text-red-600" title="Cancelar">
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                className="group flex items-center gap-2 cursor-pointer"
                                                onClick={() => handleStartEdit(user)}
                                                title="Clic para editar rol"
                                            >
                                                <span className={`px-2 py-1 rounded-[16px] text-xs font-bold border ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                    user.role === 'caregiver' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        'bg-green-50 text-green-700 border-green-100'
                                                    }`}>
                                                    {user.role === 'admin' ? 'Administrador' :
                                                        user.role === 'caregiver' ? 'Cuidador' : 'Familia'}
                                                </span>
                                                <Edit2 size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-2">
                                            {user.is_banned ? (
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100 w-fit">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                                    Bloqueado
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 w-fit">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    Activo
                                                </span>
                                            )}

                                            {user.is_active === false && (
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200 w-fit" title="No aparece en el buscador">
                                                    <EyeOff size={10} />
                                                    Oculto
                                                </span>
                                            )}

                                            {user.email_confirmed === false && (
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 w-fit" title="No ha verificado su correo electrónico (Oculto del panel público)">
                                                    <AlertTriangle size={10} />
                                                    Sin Email Conf.
                                                </span>
                                            )}

                                            {user.role === 'caregiver' && user.is_available === false && (
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 w-fit" title="Apagó su disponibilidad para trabajar temporalmente (Oculto del panel de familias)">
                                                    <Clock size={10} />
                                                    No Disponible
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs text-gray-500 font-medium capitalize">
                                            {user.subscription_status || 'Free'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleToggleActive(user.id, user.is_active)}
                                                className={`p-2 rounded-[16px] transition-all border ${user.is_active === false
                                                    ? 'bg-orange-50 text-orange-500 border-orange-100 hover:bg-orange-100'
                                                    : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50 hover:text-[var(--primary-color)] hover:border-gray-200'
                                                    }`}
                                                title={user.is_active === false ? "Mostrar usuario" : "Ocultar usuario (Soft Delete)"}
                                            >
                                                {user.is_active === false ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>

                                            <button
                                                onClick={() => handleToggleBan(user.id, user.is_banned)}
                                                className={`p-2 rounded-[16px] transition-all border ${user.is_banned
                                                    ? 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100'
                                                    : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50 hover:text-[var(--primary-color)] hover:border-gray-200'
                                                    }`}
                                                title={user.is_banned ? "Desbloquear usuario" : "Baneo Duro de usuario"}
                                            >
                                                {user.is_banned ? <ShieldOff size={18} /> : <Shield size={18} />}
                                            </button>

                                            <button className="p-2 hover:bg-gray-100 rounded-[16px] text-gray-400 hover:text-gray-600 transition-colors">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="p-12 text-center">
                        <p className="text-gray-400 font-medium">No se encontraron usuarios.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
