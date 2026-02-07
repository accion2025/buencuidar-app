import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, Menu, X, LogOut, Home, Activity, Sparkles, LogIn, UserPlus, LayoutDashboard, User } from 'lucide-react';
import Logo from './Logo';
import { supabase } from '../../lib/supabase';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, profile, signOut } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    React.useEffect(() => {
        if (!user) return;

        const fetchUnreadCount = async () => {
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false);
            setUnreadCount(count || 0);
        };

        fetchUnreadCount();

        // Real-time subscription for all notification changes
        const channel = supabase
            .channel('public:notifications')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, () => fetchUnreadCount())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const isRegistrationSuccess = location.pathname === '/registration-success';
    const showUserMenu = user && !isRegistrationSuccess;

    const handleNavigation = (path) => {
        navigate(path);
        setIsSidebarOpen(false);
    };

    // Sidebar Item Component for consistency
    const SidebarItem = ({ icon: Icon, label, onClick, active, highlight }) => (
        <div
            onClick={onClick}
            className={`flex items-center justify-end gap-3 px-4 py-3 rounded-[16px] cursor-pointer transition-all duration-300 relative group ${active ? 'bg-white/20 text-white font-bold' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                } ${highlight ? 'bg-[var(--secondary-color)] !text-white shadow-lg' : ''}`}
        >
            <span className="font-medium">{label}</span>
            <Icon size={20} className={highlight ? 'animate-pulse' : ''} />
            {active && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--secondary-color)] rounded-l-full" />}
        </div>
    );

    return (
        <React.Fragment>
            <header className="bg-white shadow-sm sticky top-0 z-40 transition-all duration-300 h-[70px]">
                <div className="w-full !px-[15px] md:!px-[60px] h-full">
                    <div className="flex justify-between items-center h-full">
                        <Link to="/home" className="flex-shrink-0 hover:opacity-80 transition-opacity flex items-center">
                            <Logo />
                        </Link>

                        {/* Desktop Menu */}
                        <nav className="hidden md:flex items-center gap-6">
                            <Link to="/services" className="text-[var(--text-main)] font-semibold hover:text-[var(--primary-color)] transition-colors">
                                Servicios
                            </Link>
                            <Link to="/ecosistema-salud" className="text-[var(--text-main)] font-semibold hover:text-[var(--primary-color)] transition-colors flex items-center gap-1">
                                <Activity size={16} className="text-[var(--secondary-color)]" />
                                BC PULSO
                            </Link>

                            {!showUserMenu ? (
                                <div className="flex items-center gap-3">
                                    <button onClick={() => navigate('/login')} className="btn btn-outline border-none hover:bg-gray-50 uppercase text-xs tracking-widest">Iniciar Sesión</button>
                                    <button onClick={() => navigate('/register')} className="btn btn-primary uppercase text-xs tracking-widest px-8">Registrarse</button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <div className="hidden lg:flex flex-col items-end mr-2">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Hola de nuevo</span>
                                        <span className="text-sm font-black text-[var(--primary-color)]">{profile?.full_name || 'Usuario'}</span>
                                    </div>

                                    {/* Global Notification Bell */}
                                    <button
                                        onClick={() => navigate(profile?.role === 'caregiver' ? '/caregiver#notifications' : '/dashboard#messages')}
                                        className="relative p-2.5 text-gray-400 hover:text-[var(--secondary-color)] transition-all bg-gray-50 rounded-[16px] hover:shadow-md group"
                                        title="Notificaciones y Mensajes"
                                    >
                                        <Bell size={20} className="group-hover:animate-swing" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-2 right-2 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                                            </span>
                                        )}
                                        {/* Simple label for clarity */}
                                        <span className="sr-only">Notificaciones</span>
                                    </button>
                                    <button
                                        onClick={() => navigate(profile?.role === 'caregiver' ? '/caregiver' : '/dashboard')}
                                        className="btn btn-primary flex items-center gap-2 text-xs tracking-widest uppercase shadow-lg shadow-green-100"
                                    >
                                        <LayoutDashboard size={16} />
                                        <span>Mi Panel</span>
                                    </button>
                                    <button
                                        onClick={async () => {
                                            await signOut();
                                            navigate('/login');
                                        }}
                                        className="p-2 text-gray-400 hover:text-[var(--error-color)] transition-colors bg-gray-50 rounded-[16px]"
                                        title="Cerrar Sesión"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            )}
                        </nav>

                        {/* Mobile Menu Button & Bell */}
                        <div className="md:hidden flex items-center gap-2">
                            {showUserMenu && (
                                <button
                                    onClick={() => navigate(profile?.role === 'caregiver' ? '/caregiver#notifications' : '/dashboard#messages')}
                                    className="relative p-2 text-gray-400 hover:text-[var(--secondary-color)] transition-all bg-gray-50 rounded-[12px]"
                                >
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                        </span>
                                    )}
                                </button>
                            )}
                            <button
                                className="p-2 text-[var(--primary-color)] hover:bg-gray-100 rounded-[12px] transition-colors"
                                onClick={() => setIsSidebarOpen(true)}
                            >
                                <Menu size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar Pane */}
            <aside
                className={`
                    fixed inset-y-0 right-0 z-[60] w-[280px] bg-[#0F3C4C] text-[#FAFAF7] shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col
                    ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
            >
                {/* Sidebar Header */}
                <div className="p-6 border-b border-white/10 flex justify-end items-center bg-[#0d3542]">
                    <div className="text-right">
                        <h2 className="text-xl font-brand font-bold tracking-tight" style={{ color: '#FAFAF7' }}>Buen<span className="text-[#2FAE8F]">Cuidar</span></h2>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Menu Principal</p>
                    </div>
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {/* User Info Card (if logged in) */}
                    {showUserMenu && (
                        <div className="bg-white/10 rounded-[16px] p-4 mb-6 border border-white/5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--secondary-color)] flex items-center justify-center font-bold text-[#0F3C4C]">
                                    {profile?.full_name?.charAt(0) || <User size={20} />}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-bold text-sm truncate">{profile?.full_name || 'Usuario'}</span>
                                    <span className="text-[10px] text-[var(--secondary-color)] uppercase tracking-wider font-bold">
                                        {profile?.role === 'caregiver' ? 'Cuidador PRO' : 'Usuario'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleNavigation(profile?.role === 'caregiver' ? '/caregiver' : '/dashboard')}
                                className="w-full bg-[var(--primary-color)] hover:brightness-110 text-white text-xs font-bold py-2.5 rounded-[12px] flex items-center justify-center gap-2 transition-all shadow-md"
                            >
                                <LayoutDashboard size={14} />
                                IR A MI PANEL
                            </button>
                        </div>
                    )}

                    {/* Navigation Links */}
                    <div className="space-y-1">
                        <p className="px-4 text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2 pt-2 text-right">Navegación</p>

                        <SidebarItem
                            icon={Home}
                            label="Inicio"
                            onClick={() => handleNavigation('/')}
                            active={location.pathname === '/'}
                        />
                        <SidebarItem
                            icon={Sparkles}
                            label="Servicios"
                            onClick={() => handleNavigation('/services')}
                            active={location.pathname === '/services'}
                        />
                        <SidebarItem
                            icon={Activity}
                            label="BC PULSO"
                            onClick={() => handleNavigation('/ecosistema-salud')}
                            active={location.pathname === '/ecosistema-salud'}
                        />
                    </div>
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-white/10 bg-[#0d3542]">
                    {!showUserMenu ? (
                        <div className="grid gap-3">
                            <button
                                onClick={() => handleNavigation('/login')}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-[16px] border border-white/20 hover:bg-white/10 transition-colors text-sm font-bold tracking-wide"
                            >
                                <LogIn size={18} />
                                INICIAR SESIÓN
                            </button>
                            <button
                                onClick={() => handleNavigation('/register')}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-[16px] bg-[var(--secondary-color)] text-[#0F3C4C] hover:brightness-110 transition-colors text-sm font-black tracking-wide shadow-lg"
                            >
                                <UserPlus size={18} />
                                REGISTRARSE
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={async () => {
                                await signOut();
                                navigate('/login');
                                setIsSidebarOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
                        >
                            <LogOut size={20} />
                            <span className="font-bold text-sm">Cerrar Sesión</span>
                        </button>
                    )}
                </div>
            </aside>
        </React.Fragment>
    );
};

export default Navbar;
