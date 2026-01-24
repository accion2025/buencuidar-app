
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
    const { signOut } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-2xl font-black text-white tracking-tighter">
                        PULSO <span className="text-blue-500">ADMIN</span>
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        to="/admin"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/admin')
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'hover:bg-slate-800 hover:text-white'}`}
                    >
                        <LayoutDashboard size={20} />
                        <span className="font-bold">Dashboard</span>
                    </Link>

                    <Link
                        to="/admin/users"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/admin/users')
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Users size={20} />
                        <span className="font-bold">Usuarios</span>
                    </Link>

                    <Link
                        to="/admin/settings"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/admin/settings')
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Settings size={20} />
                        <span className="font-bold">Configuración</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={signOut}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-bold">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white px-8 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="font-bold text-gray-800">Panel de Control</h2>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                            {/* Placeholder Admin Avatar */}
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">A</div>
                        </div>
                    </div>
                </header>
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
