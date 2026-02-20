import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Bell, Menu, User } from 'lucide-react';

const Topbar = ({ profile, unreadChatCount, unreadNotificationsCount, onMenuClick }) => {
    const navigate = useNavigate();

    const handleMessagesClick = () => {
        navigate(profile?.role === 'caregiver' ? '/caregiver/messages' : '/dashboard/messages');
    };

    const handleNotificationsClick = () => {
        navigate(profile?.role === 'caregiver' ? '/caregiver/notifications' : '/dashboard/notifications');
    };

    const getRoleLabel = () => {
        if (profile?.role === 'caregiver') {
            return profile?.subscription_status === 'active' ? 'CUIDADOR PRO' : 'CUIDADOR';
        }
        if (profile?.role === 'admin') return 'Administrador del Sistema';
        return 'Familia / Usuario';
    };

    return (
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-40 border-b border-gray-100">
            {/* Left side: Mobile Menu Toggle */}
            <button
                className="lg:hidden text-gray-600 hover:text-[var(--primary-color)] transition-colors"
                onClick={onMenuClick}
            >
                <Menu size={24} />
            </button>

            {/* Right side: Actions and Profile */}
            <div className="flex items-center justify-end w-full gap-5">
                {/* Chat Button */}
                <button
                    onClick={handleMessagesClick}
                    className="relative text-gray-400 hover:text-blue-500 transition-all p-2 rounded-xl hover:bg-gray-50 group"
                    title="Mensajes y Chat"
                >
                    <MessageSquare size={22} className="group-hover:scale-110 transition-transform" />
                    {unreadChatCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600 border-2 border-white"></span>
                        </span>
                    )}
                </button>

                {/* Notifications Button */}
                <button
                    onClick={handleNotificationsClick}
                    className="relative text-gray-400 hover:text-[var(--primary-color)] transition-all p-2 rounded-xl hover:bg-gray-50 group"
                    title="Notificaciones"
                >
                    <Bell size={22} className="group-hover:animate-swing" />
                    {unreadNotificationsCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                        </span>
                    )}
                </button>

                {/* User Profile Block */}
                <div className="flex items-center gap-3 pl-5 border-l border-gray-100 ml-1">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-[#0F3C4C] leading-none mb-1">
                            {profile?.full_name || 'Usuario'}
                        </p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                            {getRoleLabel()}
                        </p>
                    </div>
                    <div
                        onClick={() => navigate(profile?.role === 'caregiver' ? '/caregiver/profile' : '/dashboard/profile')}
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:border-[var(--primary-color)] transition-all"
                        style={{ backgroundColor: profile?.avatar_url ? 'transparent' : '#A7D8E8' }}
                    >
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="User Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User size={24} style={{ color: '#0F3C4C' }} strokeWidth={1.5} />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
