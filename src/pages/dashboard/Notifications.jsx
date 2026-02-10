
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Bell, Check, Trash2, Clock, AlertCircle, MessageSquare, ChevronRight, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
    // ... (lines 9-163 unchanged)

    const getIcon = (notification) => {
        const type = notification.type;
        const meta = notification.metadata || {};

        if (meta.type === 'request_received') return <UserPlus className="text-blue-500" size={20} />;
        if (notification.title?.includes('Aceptada')) return <CheckCircle className="text-green-500" size={20} />;
        if (notification.title?.includes('Rechazada') || notification.title?.includes('Cancelado')) return <XCircle className="text-red-500" size={20} />;

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
