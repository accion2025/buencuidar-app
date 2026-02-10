import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
import { useNotifications } from '../../context/NotificationContext';
import {
    LayoutDashboard,
    Calendar,
    MessageSquare,
    User,
    Settings,
    LogOut,
    Menu,
    Bell,
    Activity,
    Shield,
    Lock,
    CreditCard
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import InstallPrompt from '../InstallPrompt';

const SidebarItem = ({ icon: Icon, label, path, active, onClick, badge, locked }) => {
    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-[16px] cursor-pointer transition-all duration-300 relative ${active
                ? 'bg-[var(--primary-light)] !text-[#FAFAF7] shadow-lg translate-x-1'
                : 'text-gray-300 hover:bg-white/10 hover:text-white hover:translate-x-1'
                } ${locked ? 'opacity-50 grayscale' : ''}`}
        >
            <Icon size={20} />
            <div className="flex items-center gap-2 flex-1">
                <span className="font-medium">{label}</span>
                {locked && <Lock size={12} className="text-gray-400" />}
            </div>
            {badge > 0 && !locked && (
                <span className="absolute right-3 bg-red-500 !text-[#FAFAF7] text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                    {badge}
                </span>
            )}
        </div>
    );
};

const DashboardLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile, signOut, user, loading } = useAuth(); // Destructure user and loading
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { unreadCount } = useMessage(); // Use global context
    const { unreadNotificationsCount, unreadChatCount } = useNotifications();

    // Redirect if not logged in
    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    const isSubscribed = profile?.subscription_status === 'active';

    const menuItems = [
        {
            icon: LayoutDashboard,
            label: 'Resumen',
            path: profile?.role === 'caregiver' ? '/caregiver' : '/dashboard'
        },
        {
            icon: Activity,
            label: <span className="font-brand font-bold">
                <span className="!text-[#FAFAF7]">B</span>
                <span className="text-[#2FAE8F]">C</span> <span className="text-[#2FAE8F]">PULSO</span>
            </span>,
            path: '/dashboard/pulso',
            locked: profile?.role === 'family' && !isSubscribed
        },
        { icon: Calendar, label: 'Calendario', path: '/dashboard/calendar' },
        { icon: MessageSquare, label: 'Mensajes', path: '/dashboard/messages', badge: unreadCount },
        { icon: CreditCard, label: 'Mi Suscripción', path: '/dashboard/subscription' },
        {
            icon: User,
            label: profile?.role === 'caregiver' ? 'Mi Perfil PRO' : 'Mi Perfil',
            path: profile?.role === 'caregiver' ? '/caregiver/profile' : '/dashboard/profile'
        },
        { icon: Settings, label: 'Configuración', path: '/dashboard/settings' },
        ...(profile?.role === 'admin' ? [{
            icon: Shield,
            label: 'Panel Admin',
            path: '/admin'
        }] : [])
    ];

    const handleNavigation = (path) => {
        navigate(path);
        setIsMobileMenuOpen(false);
    };

    const handleLogout = async () => {
        try {
            setIsMobileMenuOpen(false);
            console.log("Iniciando cierre de sesión (Dashboard)...");
            await signOut();
        } catch (e) {
            console.error("Error al cerrar sesión (Dashboard):", e);
        } finally {
            navigate('/login');
        }
    };

    return (
        <div className="flex h-[100dvh] bg-gray-100 overflow-hidden">
            {/* Sidebar - Desktop & Mobile */}
            <aside
                className={`
                    fixed top-0 left-0 z-50 w-64 h-[100dvh] bg-[var(--primary-color)] !text-[#FAFAF7] transition-transform duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:relative md:translate-x-0 flex flex-col
                `}
            >
                {/* Logo Area */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h1 className="text-[19px] font-bold cursor-pointer font-brand !text-[#FAFAF7]" onClick={() => navigate('/home')}>
                        Buen<span className="text-[#2FAE8F]">Cuidar</span>
                    </h1>

                </div>

                {/* Navigation Items */}
                <nav className="flex-grow p-4 space-y-2 overflow-y-auto pb-24">
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.path}
                            icon={item.icon}
                            label={item.label}
                            path={item.path}
                            active={location.pathname === item.path}
                            onClick={() => handleNavigation(item.path)}
                            badge={item.badge}
                            locked={item.locked}
                        />
                    ))}
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-white/10 bg-[var(--primary-color)]">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-6 py-6 md:px-4 md:py-3 w-full rounded-[20px] md:rounded-[16px] text-[#F9F072] bg-[#F9F072]/5 md:bg-transparent hover:bg-white/10 transition-colors group mt-2 md:mt-0"
                    >
                        <LogOut className="w-7 h-7 md:w-5 md:h-5 text-[#F9F072]" />
                        <span className="font-black md:font-medium text-xl md:text-base">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-grow flex flex-col h-full overflow-hidden">
                {/* Top Header */}
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-40">
                    <button
                        className="md:hidden text-gray-600"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex items-center justify-end w-full gap-6">
                        <button
                            onClick={() => navigate(profile?.role === 'caregiver' ? '/caregiver/messages' : '/messages')}
                            className="relative text-gray-500 hover:text-blue-500 transition-all group"
                            title="Mensajes y Chat"
                        >
                            <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
                            {unreadChatCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 border-2 border-white"></span>
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => navigate(profile?.role === 'caregiver' ? '/caregiver/notifications' : '/dashboard/notifications')}
                            className="relative text-gray-500 hover:text-[var(--primary-color)] transition-all group"
                        >
                            <Bell size={20} className="group-hover:animate-swing" />
                            {unreadNotificationsCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                                </span>
                            )}
                        </button>

                        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-gray-800">{profile?.full_name || 'Usuario'}</p>
                                <p className="text-xs text-gray-500">
                                    {profile?.role === 'caregiver'
                                        ? `CUIDADOR PRO`
                                        : profile?.role === 'admin'
                                            ? 'Administrador del Sistema'
                                            : 'Familia / Usuario'}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-[var(--primary-color)] font-bold border-2 border-white shadow-sm overflow-hidden">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{profile?.full_name?.charAt(0).toUpperCase() || 'U'}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-grow overflow-y-auto p-4 md:p-10">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <InstallPrompt />
        </div>
    );
};

export default DashboardLayout;
