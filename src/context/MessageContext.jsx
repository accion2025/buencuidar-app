import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const MessageContext = createContext();

export const useMessage = () => {
    return useContext(MessageContext);
};

export const MessageProvider = ({ children }) => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchUnread = useCallback(async () => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        try {
            // 1. Get my conversations
            const { data: myConvs } = await supabase
                .from('conversations')
                .select('id')
                .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`);

            if (myConvs && myConvs.length > 0) {
                const ids = myConvs.map(c => c.id);
                // 2. Count unread messages where I am NOT the sender
                const { count } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .in('conversation_id', ids)
                    .neq('sender_id', user.id)
                    .eq('is_read', false);

                setUnreadCount(count || 0);
            } else {
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Initial Fetch and Realtime
    useEffect(() => {
        if (!user) return;

        fetchUnread();

        // Subscribe to new messages (global listener)
        const channel = supabase
            .channel('global_messages_context')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
                // Throttle or debounce could be added here if needed
                fetchUnread();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchUnread]);

    const value = {
        unreadCount,
        fetchUnread, // Expose this so we can manually trigger it
        loading
    };

    return (
        <MessageContext.Provider value={value}>
            {children}
        </MessageContext.Provider>
    );
};
