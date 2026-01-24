
import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, Shield, User } from 'lucide-react';
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
        if (filter === 'all') return true;
        return u.role === filter;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${filter === 'all' ? 'bg-slate-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter('family')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${filter === 'family' ? 'bg-slate-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Familias
                    </button>
                    <button
                        onClick={() => setFilter('caregiver')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${filter === 'caregiver' ? 'bg-slate-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Cuidadores
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Usuario</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Rol</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Suscripción</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
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
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                user.role === 'caregiver' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    'bg-green-50 text-green-700 border-green-100'
                                            }`}>
                                            {user.role === 'admin' ? 'Administrador' :
                                                user.role === 'caregiver' ? 'Cuidador' : 'Familia'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            Activo
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs text-gray-500 font-medium capitalize">
                                            {user.subscription_status || 'Free'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                                            <MoreHorizontal size={18} />
                                        </button>
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
