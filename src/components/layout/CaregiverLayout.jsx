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
    Award,
    User,
    MessageSquare,
    Lock,
    Bell
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
        { icon: Award, label: 'BC PRO', path: '/caregiver/analytics' },
        { icon: User, label: 'Mi Perfil PRO', path: '/caregiver/profile' },
        { icon: Settings, label: 'Configuración', path: '/caregiver/settings' },
    ];

    const handleNavigation = (path) => {
        navigate(path);
        setIsSidebarOpen(false); // Close on mobile navigation
    };

    const handleLogout = async () => {
        setIsSidebarOpen(false);
        await signOut();
        navigate('/login');
    };

    if (loading) return null;

    return (
        <div className="h-[100dvh] bg-gray-50 flex font-sans overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-[100dvh] z-50 w-64 bg-slate-900 !text-[#FAFAF7] transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:relative lg:translate-x-0 shadow-xl flex flex-col`}
            >
                {/* Logo */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <Link to="/home" className="block hover:opacity-80 transition-opacity">
                        <h1 className="text-[19px] font-bold font-brand !text-[#FAFAF7]">Buen<span className="text-[#2FAE8F]">Cuidar</span></h1>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">PRO / Cuidador</span>
                    </Link>

                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto pb-24">
                    {menuItems.map((item) => {
                        const isPremiumOnly = item.path === '/caregiver/analytics';
                        const isPremiumUser = profile?.plan_type === 'premium' || profile?.plan_type === 'professional_pro';
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
                <div className="p-4 border-t border-slate-800 bg-slate-900">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-bold text-xs text-slate-400">
                                    {profile?.full_name?.charAt(0) || 'U'}
                                </span>
                            )}
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
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 lg:hidden">
                        <Menu size={24} />
                    </button>
                    <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-3">
                        <span className="font-bold text-gray-800 lg:text-xl">Panel del Cuidador</span>
                        <div className="hidden lg:flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{profile?.full_name}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/caregiver#notifications')}
                        className="relative text-gray-400 hover:text-[var(--secondary-color)] transition-all bg-gray-50 p-2 rounded-[12px] hover:shadow-md group"
                    >
                        <Bell size={22} className="group-hover:animate-swing" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                            </span>
                        )}
                    </button>
                </header>

                {/* Page Content */}
                <main id="main-scroll-container" className="flex-1 p-4 md:p-10 overflow-y-auto">
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
