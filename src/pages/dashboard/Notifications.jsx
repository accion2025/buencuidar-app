
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Bell, Check, Trash2, Clock, AlertCircle, MessageSquare, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetchNotifications();

        // Subscribe to changes
        const channel = supabase
            .channel('public:notifications:page')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, () => fetchNotifications())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Apply filters: 5-minute delay for applications AND exclude all chat
            const now = Date.now();
            const filtered = (data || []).filter(notif => {
                const isChat = notif.metadata?.is_chat || notif.metadata?.conversation_id || notif.title?.includes('Mensaje');
                if (isChat) return false;

                if (profile?.role === 'family' && notif.title?.includes('Postulación')) {
                    const createdTime = new Date(notif.created_at).getTime();
                    return createdTime < (now - 5 * 60 * 1000);
                }
                return true;
            });

            setNotifications(filtered);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false); // Using loadingNotifications consistency
        }
    };

    // Add periodic refresh to the page too
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [user]);

    const markAsRead = async (id) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (id, e) => {
        e.stopPropagation(); // Prevent triggering row click
        if (!confirm('¿Eliminar esta notificación?')) return;

        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        // 1. Mark as read first
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }

        // 2. Smart Navigation based on metadata
        const metadata = notification.metadata || {};
        const targetPath = metadata.target_path;

        if (targetPath) {
            // Priority 1: Use explicit target_path if exists
            // Fix: If it's a short path, prepend the role
            let finalPath = targetPath;
            if (targetPath === '/messages' || targetPath === '/calendar' || targetPath === '/dashboard') {
                const rolePrefix = profile?.role === 'caregiver' ? '/caregiver' : '/dashboard';
                if (targetPath === '/messages') finalPath = `${rolePrefix}/messages`;
                else if (targetPath === '/calendar') finalPath = `${rolePrefix}/calendar`;
                else if (targetPath === '/dashboard') finalPath = rolePrefix;
            }
            navigate(finalPath);
        } else if (metadata.is_chat || metadata.conversation_id) {
            // Priority 2: Chat notifications
            navigate(profile?.role === 'caregiver' ? '/caregiver/messages' : '/dashboard/messages');
        } else if (metadata.appointment_id) {
            // Priority 3: Appointment related
            navigate(profile?.role === 'caregiver' ? '/caregiver/shifts' : '/dashboard/calendar');
        } else if (metadata.log_id) {
            // Priority 4: Care logs / Routine Reports
            // Only navigate to PULSO if the client is subscribed
            if (profile?.role === 'family' && profile?.subscription_status !== 'active') {
                navigate('/dashboard');
            } else {
                navigate('/dashboard/pulso');
            }
        } else {
            console.log("No smart path found for notification:", notification);
        }
    };

    const getPriorityColor = (priority, type) => {
        if (priority === 'high' || type === 'alert') return 'bg-red-50 border-l-4 border-red-500';
        if (type === 'success') return 'bg-green-50 border-l-4 border-green-500';
        return 'bg-white border-l-4 border-gray-200';
    };

    const getIcon = (type) => {
        if (type === 'alert') return <AlertCircle className="text-red-500" size={20} />;
        if (type === 'success') return <Check className="text-green-500" size={20} />;
        return <Bell className="text-[var(--primary-color)]" size={20} />;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Notificaciones</h1>
                    <p className="text-gray-500 text-sm">Mantente al día con tus actividades</p>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={markAllAsRead}
                        className="text-sm text-[var(--primary-color)] font-bold hover:underline flex items-center gap-2"
                    >
                        <Check size={16} />
                        Marcar todas como leídas
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-[16px] shadow-sm">
                    <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Sin notificaciones</h3>
                    <p className="text-gray-500">No tienes alertas pendientes por ahora.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`
                                relative p-4 rounded-[12px] shadow-sm transition-all cursor-pointer group hover:shadow-md
                                ${getPriorityColor(notification.priority, notification.type)}
                                ${!notification.is_read ? 'bg-white font-medium' : 'bg-gray-50 opacity-75'}
                            `}
                        >
                            <div className="flex items-start gap-4">
                                <div className="mt-1 flex-shrink-0">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`text-sm font-bold ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {notification.title}
                                            {!notification.is_read && (
                                                <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full align-middle animate-pulse"></span>
                                            )}
                                        </h4>
                                        <button
                                            onClick={(e) => deleteNotification(notification.id, e)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <p className={`text-sm mt-1 ${!notification.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                        <Clock size={12} />
                                        <span>
                                            {new Date(notification.created_at).toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'long',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                                {(notification.metadata?.is_chat || notification.metadata?.conversation_id) && (
                                    <div className="flex-shrink-0 self-center ml-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleNotificationClick(notification);
                                            }}
                                            className="bg-[var(--primary-color)] text-white p-2 rounded-full hover:bg-[var(--secondary-color)] transition-colors shadow-sm flex items-center gap-1 group/btn"
                                            title="Ir al Chat"
                                        >
                                            <MessageSquare size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline-block pr-1">Chat</span>
                                            <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
