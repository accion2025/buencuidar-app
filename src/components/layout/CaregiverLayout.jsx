import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
import {
    LayoutDashboard,
    Briefcase,
    CalendarClock,
    CreditCard,
    PieChart,
    Settings,
    LogOut,
    Menu,
    X,
    User,
    MessageSquare
} from 'lucide-react';
import InstallPrompt from '../InstallPrompt';

const CaregiverLayout = () => {
    const { unreadCount, fetchUnread } = useMessage();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const { profile, signOut, loading, user } = useAuth();

    // Use context to fetch unread on mount
    useEffect(() => {
        if (user) fetchUnread();
    }, [user, fetchUnread]);

    // Seguridad: Redirigir si el rol no es cuidador
    useEffect(() => {
        if (!loading && profile && profile.role !== 'caregiver') {
            navigate('/dashboard');
        }
    }, [profile, loading, navigate]);

    const menuItems = [
        { icon: LayoutDashboard, label: 'Resumen', path: '/caregiver' },
        { icon: Briefcase, label: 'Bolsa de Trabajo', path: '/caregiver/jobs' },
        { icon: CalendarClock, label: 'Mis Turnos', path: '/caregiver/shifts' },
        { icon: MessageSquare, label: 'Mensajes', path: '/caregiver/messages', badge: unreadCount },
        { icon: CreditCard, label: 'Mi Suscripción', path: '/caregiver/payments' },
        { icon: PieChart, label: 'Reportes & Finanzas', path: '/caregiver/analytics' },
        { icon: User, label: 'Mi Perfil PRO', path: '/caregiver/profile' },
        { icon: Settings, label: 'Configuración', path: '/caregiver/settings' },
    ];

    if (loading) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:relative lg:translate-x-0 shadow-xl`}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                        <Link to="/" className="block hover:opacity-80 transition-opacity">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">BuenCuidar</h1>
                            <span className="text-xs text-slate-400 uppercase tracking-wider">PRO / Cuidador</span>
                        </Link>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden text-slate-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/caregiver'}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`
                                }
                            >
                                <item.icon size={20} className="group-hover:scale-110 transition-transform" />
                                <span className="font-medium">{item.label}</span>
                                {item.badge > 0 && (
                                    <span className="absolute right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                                        {item.badge}
                                    </span>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Footer Sidebar */}
                    <div className="p-4 border-t border-slate-800">
                        <div className="flex items-center gap-3 px-4 py-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">
                                {profile?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{profile?.full_name || 'Cuidador'}</p>
                                <p className="text-[10px] text-slate-500 uppercase">
                                    {profile?.role === 'caregiver' ? 'Cuidador Verificado' : 'Usuario'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                await signOut();
                                navigate('/login');
                            }}
                            className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            <LogOut size={20} />
                            <span className="font-medium">Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header (Mobile Only Toggle) */}
                <header className="bg-white border-b border-gray-200 px-6 py-4 lg:hidden flex items-center justify-between sticky top-0 z-40">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-gray-800">Modo Cuidador</span>
                    <div className="w-8"></div> {/* Spacer */}
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 lg:p-10 overflow-auto">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
            <InstallPrompt />
        </div>
    );
};

export default CaregiverLayout;
