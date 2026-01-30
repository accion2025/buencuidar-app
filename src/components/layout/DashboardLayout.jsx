import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
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
    Shield
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import InstallPrompt from '../InstallPrompt';

const SidebarItem = ({ icon: Icon, label, path, active, onClick, badge }) => {
    const isSalud = path === '/dashboard/pulso';
    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-[16px] cursor-pointer transition-all duration-300 relative ${active
                ? 'bg-[var(--primary-light)] !text-[#FAFAF7] shadow-lg translate-x-1'
                : 'text-gray-300 hover:bg-white/10 hover:text-white hover:translate-x-1'
                } ${isSalud ? 'border-l-4 border-green-400 font-black tracking-widest !text-[#FAFAF7] bg-white/5' : ''}`}
        >
            <Icon size={isSalud ? 24 : 20} className={isSalud ? 'text-green-400 animate-pulse' : ''} />
            <span className={isSalud ? 'text-lg' : 'font-medium'}>{label}</span>
            {badge > 0 && (
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
    const { profile, signOut, user } = useAuth(); // Destructure user
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { unreadCount } = useMessage(); // Use global context

    const menuItems = [
        {
            icon: LayoutDashboard,
            label: 'Resumen',
            path: profile?.role === 'caregiver' ? '/caregiver' : '/dashboard'
        },
        // 'PULSO' y 'Calendario' comunes, o ajustar según se requiera
        { icon: Activity, label: <span>B<span className="text-[#2FAE8F]">C</span> <span className="text-[#2FAE8F]">PULSO</span></span>, path: '/dashboard/pulso' },
        { icon: Calendar, label: 'Calendario', path: '/dashboard/calendar' },
        { icon: MessageSquare, label: 'Mensajes', path: '/dashboard/messages', badge: unreadCount },
        {
            icon: User,
            label: profile?.role === 'caregiver' ? 'Mi Perfil PRO' : 'Mi Perfil',
            path: profile?.role === 'caregiver' ? '/caregiver/profile' : '/dashboard/profile'
        },
        { icon: Settings, label: 'Configuración', path: '/dashboard/settings' },
        ...(profile?.role === 'admin' ? [{
            icon: Shield, // Ensure Shield is imported or use Settings if Shield not available (checked imports: Shield NOT in imports, need to add it or use Lock/Settings) 
            // Checking imports in DashboardLayout... Imports are: LayoutDashboard, Calendar, MessageSquare, User, Settings, LogOut, Menu, X, Bell, Activity.
            // Shield is NOT imported. I will add it to imports first.
            label: 'Panel Admin',
            path: '/admin'
        }] : [])
    ];

    const handleNavigation = (path) => {
        navigate(path);
        setIsMobileMenuOpen(false);
    };

    const handleLogout = async () => {
        setIsMobileMenuOpen(false);
        await signOut();
        navigate('/login');
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
                    <h1 className="text-[19px] font-bold cursor-pointer font-brand !text-[#FAFAF7]" onClick={() => navigate('/')}>
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
                        />
                    ))}
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-white/10 bg-[var(--primary-color)]">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-[16px] text-red-200 hover:bg-red-900/20 hover:text-red-100 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Cerrar Sesión</span>
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
                        <button className="relative text-gray-500 hover:text-[var(--primary-color)] transition-colors">
                            <Bell size={20} />
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-gray-800">{profile?.full_name || 'Usuario'}</p>
                                <p className="text-xs text-gray-500">
                                    {profile?.role === 'caregiver'
                                        ? `CUIDADOR PRO • ${profile.caregiver_code || '---'}`
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
                <main className="flex-grow overflow-y-auto p-6">
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
