import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Bell, Check, Trash2, Clock, AlertCircle, MessageSquare, ChevronRight, UserPlus, CheckCircle, XCircle, Star, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { usePermissions } from '../../hooks/usePermissions';

const Notifications = () => {
    const { user, profile } = useAuth();
    const { can } = usePermissions();
    const {
        notifications: contextNotifications,
        markAsRead: contextMarkAsRead,
        markAllGeneralAsRead,
        deleteAllGeneral,
        refreshNotifications,
        loadingNotifications
    } = useNotifications();
    const navigate = useNavigate();
    const [notificationsBatch, setNotificationsBatch] = useState(20);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (contextNotifications) {
            setNotifications(contextNotifications);
            setLoading(loadingNotifications);

            // Si el contexto tiene menos notificaciones de las que pedimos en el último lote, 
            // es probable que no haya más en la DB.
            if (contextNotifications.length < notificationsBatch) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }
        }
    }, [contextNotifications, loadingNotifications, notificationsBatch]);

    useEffect(() => {
        if (!user) return;

        // Subscribe to changes
        const channel = supabase
            .channel('public:notifications:page')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, () => refreshNotifications && refreshNotifications(notificationsBatch))
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, notificationsBatch, refreshNotifications]);

    const handleLoadMore = async () => {
        if (isFetchingMore || !hasMore) return;

        setIsFetchingMore(true);
        const nextBatchSize = notificationsBatch + 20;

        // El contexto se encargará de hacer el fetch y actualizar la lista visible
        if (refreshNotifications) {
            const data = await refreshNotifications(nextBatchSize);
            setNotificationsBatch(nextBatchSize);

            // Si la data devuelta es menor al nuevo tamaño solicitado, detuvimos la paginación
            if (!data || data.length < nextBatchSize) {
                setHasMore(false);
            }
        }
        setIsFetchingMore(false);
    };

    const markAsRead = async (id) => {
        await contextMarkAsRead(id);
    };

    const markAllAsRead = async () => {
        await markAllGeneralAsRead();
    };

    const handleDeleteAll = async () => {
        if (!confirm('¿Estás seguro de que deseas eliminar todas las notificaciones? Esta acción no se puede rehacer.')) return;
        await deleteAllGeneral();
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
            // El canal de real-time o el refresh automático actualizará la lista
            if (refreshNotifications) refreshNotifications(notificationsBatch);
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        // 1. Mark as read (background)
        if (!notification.is_read) {
            markAsRead(notification.id);
        }

        const metadata = notification.metadata || {};
        const isCaregiver = profile?.role === 'caregiver';

        // 2. High Priority: Use target_path from metadata if it exists
        if (metadata.target_path) {
            // ROBUSTNESS FIX (V1.0.16/17): Overwrite legacy or incorrect paths for specific events/plans
            if (!isCaregiver) {
                // Fix for legacy 'Aceptada'
                if (notification.title?.includes('Aceptada') && metadata.target_path === '/dashboard/calendar') {
                    navigate('/dashboard');
                    return;
                }
                // Fix for Restricted Monitoring (V1.0.17)
                if (metadata.target_path.includes('/pulso') && !can('accessMonitoring')) {
                    navigate('/dashboard');
                    return;
                }
            }
            navigate(metadata.target_path);
            return;
        }

        // 3. Fallback Redirection Logic (Legacy or missing target_path) based on V1.0.15 Policy
        if (profile?.role === 'admin') {
            if (metadata.is_admin_alert || notification.type === 'verification_pending' || notification.title?.includes('Verificación')) {
                navigate('/admin/verification');
                return;
            }
        }

        if (!isCaregiver) {
            // Role: FAMILY
            if (metadata.notif_category === 'application' || notification.title?.includes('Postulación') || notification.title?.includes('Aceptada')) {
                navigate('/dashboard');
                return;
            }
            if (notification.title?.includes('Denegada')) {
                navigate('/search');
                return;
            }
            if (metadata.log_id || notification.title?.includes('Tarea') || notification.title?.includes('Bienestar')) {
                // Only navigate to Pulso if user has permission (V1.0.17)
                navigate(can('accessMonitoring') ? '/dashboard/pulso' : '/dashboard');
                return;
            }
            if (metadata.is_chat || metadata.conversation_id) {
                navigate('/dashboard/messages');
                return;
            }
            navigate('/dashboard'); // Default Family
        } else {
            // Role: CAREGIVER
            if (notification.title?.includes('Denegada') || notification.title?.includes('Cancelado')) {
                navigate('/caregiver/jobs');
                return;
            }
            if (metadata.notif_category === 'reprogramming' || metadata.notif_category === 'agenda_change' || notification.title?.includes('Aprobada') || notification.title?.includes('Turno') || notification.title?.includes('Agenda')) {
                navigate('/caregiver/shifts');
                return;
            }
            if (notification.title?.includes('Solicitud')) {
                navigate('/caregiver');
                return;
            }
            if (metadata.is_chat || metadata.conversation_id) {
                navigate('/caregiver/messages');
                return;
            }
            navigate('/caregiver'); // Default Caregiver
        }
    };

    const getPriorityColor = (priority, type) => {
        if (priority === 'high' || type === 'alert') return 'bg-red-50 border-l-4 border-red-500';
        if (type === 'success') return 'bg-green-50 border-l-4 border-green-500';
        return 'bg-white border-l-4 border-gray-200';
    };

    const getIcon = (notification) => {
        const type = notification.type;
        const meta = notification.metadata || {};
        const title = notification.title || '';

        if (meta.type === 'request_received' || meta.notif_category === 'application') return <UserPlus className="text-blue-500" size={20} />;
        if (title.includes('Aceptada') || title.includes('Aprobada')) return <CheckCircle className="text-green-500" size={20} />;
        if (title.includes('Rechazada') || title.includes('Denegada') || title.includes('Cancelado')) return <XCircle className="text-red-500" size={20} />;
        if (title.includes('Calificación')) return <Star className="text-amber-500" size={20} />;

        if (type === 'alert' || type === 'error') return <AlertCircle className="text-red-500" size={20} />;
        if (type === 'success') return <Check className="text-green-500" size={20} />;
        if (type === 'warning') return <AlertTriangle className="text-amber-500" size={20} />;
        return <Bell className="text-[var(--primary-color)]" size={20} />;
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-4xl px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Centro de Notificaciones</h1>
                    <p className="text-gray-500 text-sm">Gestiona tus comunicaciones y alertas</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {notifications.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-4 py-2 rounded-full hover:bg-red-100 transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={12} />
                            Limpiar todo
                        </button>
                    )}
                    {notifications.some(n => !n.is_read) && (
                        <button
                            onClick={markAllAsRead}
                            className="text-[10px] font-black uppercase tracking-widest text-[var(--primary-color)] bg-green-50 px-4 py-2 rounded-full hover:bg-green-100 transition-colors flex items-center gap-2"
                        >
                            <Check size={12} />
                            Leer todo
                        </button>
                    )}
                </div>
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[24px] shadow-sm border border-gray-100">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Tu buzón está vacío</h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-sm mt-1">No tienes alertas pendientes. ¡Buen trabajo!</p>
                </div>
            ) : (
                <div className="space-y-4">
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
                                    {getIcon(notification)}
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

            {hasMore && notifications.length > 0 && (
                <div className="mt-10 flex justify-center pb-12">
                    <button
                        onClick={handleLoadMore}
                        disabled={isFetchingMore}
                        className="
                            px-8 py-3 rounded-full bg-white border border-gray-200 
                            text-[10px] font-black uppercase tracking-[0.2em] text-gray-400
                            hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] 
                            transition-all shadow-sm hover:shadow-md disabled:opacity-50
                            flex items-center gap-2
                        "
                    >
                        {isFetchingMore ? (
                            <>
                                <div className="w-3 h-3 border-2 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin"></div>
                                Cargando...
                            </>
                        ) : (
                            'Cargar más notificaciones'
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Notifications;
