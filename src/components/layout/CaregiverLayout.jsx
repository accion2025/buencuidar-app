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
    MessageSquare,
    Lock
} from 'lucide-react';
import InstallPrompt from '../InstallPrompt';

const CaregiverLayout = () => {
    const { unreadCount, fetchUnread } = useMessage();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default to false for mobile
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

    const handleNavigation = (path) => {
        navigate(path);
        setIsSidebarOpen(false); // Close on mobile navigation
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans overflow-hidden h-screen">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 !text-[#FAFAF7] transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:relative lg:translate-x-0 shadow-xl flex flex-col`}
            >
                {/* Logo */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <Link to="/" className="block hover:opacity-80 transition-opacity">
                        <h1 className="text-2xl font-bold font-brand !text-[#FAFAF7]">BuenCuidar</h1>
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
                    {menuItems.map((item) => {
                        const isPremiumOnly = item.path === '/caregiver/analytics';
                        const isPremiumUser = profile?.plan_type === 'premium';
                        const isBlocked = isPremiumOnly && !isPremiumUser;

                        return (
                            <div
                                key={item.path}
                                onClick={() => handleNavigation(item.path)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-[16px] transition-all duration-200 group relative cursor-pointer ${window.location.pathname === item.path || (item.path === '/caregiver' && window.location.pathname === '/caregiver/')
                                    ? 'bg-blue-600 !text-[#FAFAF7] shadow-lg shadow-blue-900/50'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    } ${isBlocked ? 'opacity-80' : ''}`}
                            >
                                <item.icon size={20} className="group-hover:scale-110 transition-transform" />
                                <span className={`font-medium ${isBlocked ? 'text-slate-500' : ''}`}>{item.label}</span>
                                {isBlocked && (
                                    <span className="ml-auto text-slate-600">
                                        <Lock size={12} />
                                    </span>
                                )}
                                {item.badge > 0 && (
                                    <span className="absolute right-3 bg-red-500 !text-[#FAFAF7] text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Footer Sidebar */}
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">
                            {profile?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate !text-[#FAFAF7]">{profile?.full_name || 'Cuidador'}</p>
                            <p className="text-[10px] text-slate-500 uppercase">
                                {profile?.role === 'caregiver' ? 'Cuidador Verificado' : 'Usuario'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-[16px] transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                {/* Header (Mobile Only Toggle) */}
                <header className="bg-white border-b border-gray-200 px-6 py-4 lg:hidden flex items-center justify-between sticky top-0 z-40">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-gray-800">Modo Cuidador</span>
                    <div className="w-8"></div> {/* Spacer */}
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <InstallPrompt />
        </div>
    );
};

export default CaregiverLayout;
