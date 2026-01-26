import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, MoreVertical, Phone, Video, Paperclip, MessageCircle, ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
import { supabase } from '../../lib/supabase';
import { useLocation } from 'react-router-dom';

const Messages = () => {
    const { user, profile } = useAuth();
    const { fetchUnread } = useMessage();
    const location = useLocation();
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Fetch Conversations
    useEffect(() => {
        if (!user) return;

        const fetchConversations = async () => {
            try {
                // Fetch conversations where current user is participant
                const { data, error } = await supabase
                    .from('conversations')
                    .select(`
                        id,
                        updated_at,
                        last_message,
                        last_message_at,
                        participant1:participant1_id (id, full_name, avatar_url, role),
                        participant2:participant2_id (id, full_name, avatar_url, role)
                    `)
                    .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
                    .order('last_message_at', { ascending: false });

                if (error) throw error;

                // Get unread counts for these conversations
                const { data: unreadData } = await supabase
                    .from('messages')
                    .select('conversation_id')
                    .eq('is_read', false)
                    .neq('sender_id', user.id)
                    .in('conversation_id', data.map(c => c.id));

                // Count per conversation
                const unreadCounts = {};
                if (unreadData) {
                    unreadData.forEach(msg => {
                        unreadCounts[msg.conversation_id] = (unreadCounts[msg.conversation_id] || 0) + 1;
                    });
                }

                // Format data
                const formatted = data.map(conv => {
                    const otherUser = conv.participant1.id === user.id ? conv.participant2 : conv.participant1;
                    return {
                        id: conv.id,
                        otherUser,
                        lastMessage: conv.last_message,
                        time: new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        updatedAt: conv.updated_at,
                        unread: unreadCounts[conv.id] || 0
                    };
                });

                setConversations(formatted);

                // Auto-select chat from navigation state
                if (location.state?.conversationId) {
                    const targetChat = formatted.find(c => c.id === location.state.conversationId);
                    if (targetChat) {
                        setSelectedChat(targetChat);
                    }
                }

            } catch (error) {
                console.error('Error fetching conversations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();

        // Subscribe to new conversations/updates
        const subscription = supabase
            .channel('public:conversations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
                fetchConversations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user]);

    // Fetch Messages for Selected Chat
    useEffect(() => {
        if (!selectedChat) return;

        const fetchMessages = async () => {
            try {
                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', selectedChat.id)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                setMessages(data);
                scrollToBottom();
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        fetchMessages();

        // Optimistically mark as read in local state
        setConversations(prev => prev.map(c =>
            c.id === selectedChat.id ? { ...c, unread: 0 } : c
        ));

        // Mark messages as read in DB
        const markAsRead = async () => {
            const { error } = await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('conversation_id', selectedChat.id)
                .neq('sender_id', user.id)
                .eq('is_read', false);

            if (error) {
                console.error("Error marking messages as read:", error);
            } else {
                // Trigger global update (sidebar badge)
                fetchUnread();
            }
        };
        markAsRead();

        // Real-time subscription for messages in this conversation
        const channel = supabase
            .channel(`chat:${selectedChat.id}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedChat.id}` },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        // Avoid duplication if already added optimistically
                        setMessages(prev => {
                            if (prev.find(m => m.id === payload.new.id)) return prev;
                            const newMsgs = [...prev, payload.new];
                            return newMsgs;
                        });
                        scrollToBottom();

                        // Mark new incoming message as read if we are viewing this chat
                        if (payload.new.sender_id !== user.id) {
                            markAsRead();
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedChat]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !user || !selectedChat) return;

        const text = inputMessage.trim();
        setInputMessage('');

        // Optimistic UI Update
        const tempId = Date.now().toString();
        const optimisticMsg = {
            id: tempId,
            conversation_id: selectedChat.id,
            sender_id: user.id,
            content: text,
            created_at: new Date().toISOString(),
            is_optimistic: true
        };

        setMessages(prev => [...prev, optimisticMsg]);
        scrollToBottom();

        try {
            // 1. Insert Message
            const { data: newMsg, error: msgError } = await supabase
                .from('messages')
                .insert([{
                    conversation_id: selectedChat.id,
                    sender_id: user.id,
                    content: text
                }])
                .select();

            if (msgError) throw msgError;

            // Replace optimistic message with real one
            if (newMsg) {
                setMessages(prev => prev.map(m => m.id === tempId ? newMsg[0] : m));
            }

            // 2. Update Conversation (last_message)
            await supabase
                .from('conversations')
                .update({
                    last_message: text,
                    last_message_at: new Date()
                })
                .eq('id', selectedChat.id);

        } catch (error) {
            console.error('Error sending message:', error);
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== tempId));
            alert('Error al enviar el mensaje');
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!confirm('¿Eliminar mensaje?')) return;

        try {
            const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', messageId);

            if (error) throw error;

            // Optimistic update
            setMessages(prev => prev.filter(m => m.id !== messageId));
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Error al eliminar mensaje');
        }
    };

    return (
        <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-140px)] overflow-hidden">
            {/* Conversations Sidebar */}
            <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold mb-4">Mensajes</h2>
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar conversación..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)]"
                        />
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-400">Cargando chats...</div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No tienes mensajes aún.</p>
                        </div>
                    ) : (
                        conversations.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => setSelectedChat(chat)}
                                className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-gray-50 hover:bg-gray-50 ${selectedChat?.id === chat.id ? 'bg-blue-50 border-l-4 border-l-[var(--primary-color)]' : ''
                                    }`}
                            >
                                <div className="relative">
                                    {chat.otherUser?.avatar_url ? (
                                        <img src={chat.otherUser.avatar_url} alt={chat.otherUser.full_name} className="w-12 h-12 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                                            {chat.otherUser?.full_name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-semibold text-gray-800 truncate">{chat.otherUser?.full_name || 'Usuario'}</h4>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-gray-500">{chat.time}</span>
                                            {chat.unread > 0 && (
                                                <span className="mt-1 w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse"></span>
                                            )}
                                        </div>
                                    </div>
                                    <p className={`text-sm truncate ${chat.unread > 0 ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                                        {chat.lastMessage || 'Nueva conversación'}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className={`flex-grow flex flex-col w-full md:w-2/3 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white z-10">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedChat(null)} className="md:hidden text-gray-500 hover:text-gray-700">
                                    <ArrowLeft size={24} />
                                </button>
                                {selectedChat.otherUser?.avatar_url ? (
                                    <img src={selectedChat.otherUser.avatar_url} alt={selectedChat.otherUser.full_name} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-500">
                                        {selectedChat.otherUser?.full_name?.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-gray-800">{selectedChat.otherUser?.full_name}</h3>
                                    <p className="text-xs text-gray-500 font-medium">
                                        {selectedChat.otherUser?.role === 'caregiver' ? 'Cuidador' : 'Familia'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-gray-500">
                                <button className="hover:text-[var(--primary-color)]"><Phone size={20} /></button>
                                <button className="hover:text-[var(--primary-color)]"><Video size={20} /></button>
                                <button className="hover:text-[var(--primary-color)]"><MoreVertical size={20} /></button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-grow overflow-y-auto p-6 bg-gray-50 space-y-4">
                            {(() => {
                                let lastDate = null;
                                return messages.map((msg, idx) => {
                                    const msgDate = new Date(msg.created_at);
                                    const dateString = msgDate.toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    });

                                    // Format label
                                    const today = new Date();
                                    const yesterday = new Date();
                                    yesterday.setDate(today.getDate() - 1);

                                    let dateLabel = dateString;
                                    if (msgDate.toDateString() === today.toDateString()) dateLabel = 'Hoy';
                                    else if (msgDate.toDateString() === yesterday.toDateString()) dateLabel = 'Ayer';
                                    else {
                                        dateLabel = msgDate.toLocaleDateString('es-ES', {
                                            day: 'numeric',
                                            month: 'long'
                                        });
                                    }

                                    const showDateSeparator = lastDate !== msgDate.toDateString();
                                    lastDate = msgDate.toDateString();

                                    return (
                                        <React.Fragment key={msg.id}>
                                            {showDateSeparator && (
                                                <div className="flex justify-center my-6">
                                                    <span className="bg-gray-200/50 text-gray-500 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full">
                                                        {dateLabel}
                                                    </span>
                                                </div>
                                            )}
                                            <div
                                                className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'} group`}
                                            >
                                                <div className="flex items-end gap-2 max-w-[70%]">
                                                    {msg.sender_id === user.id && (
                                                        <button
                                                            onClick={() => handleDeleteMessage(msg.id)}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                                            title="Eliminar mensaje"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}

                                                    <div
                                                        className={`rounded-2xl px-5 py-3 shadow-sm ${msg.sender_id === user.id
                                                            ? 'bg-[var(--primary-color)] text-white rounded-br-none'
                                                            : 'bg-white text-gray-800 rounded-bl-none'
                                                            } min-w-[80px]`}
                                                    >
                                                        <p>{msg.content}</p>
                                                        <p
                                                            className={`text-[10px] mt-1 text-right ${msg.sender_id === user.id ? 'text-blue-100' : 'text-gray-400'
                                                                }`}
                                                        >
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                });
                            })()}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 flex items-center gap-3">
                            <button type="button" className="text-gray-400 hover:text-gray-600">
                                <Paperclip size={20} />
                            </button>
                            <input
                                type="text"
                                placeholder="Escribe un mensaje..."
                                className="flex-grow bg-gray-100 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] text-gray-800"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                            />
                            <button
                                type="submit"
                                className={`p-2 rounded-full transition-colors ${inputMessage.trim()
                                    ? 'bg-[var(--primary-color)] text-white hover:bg-[var(--primary-light)]'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                disabled={!inputMessage.trim()}
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <MessageCircle size={48} className="mb-4 opacity-50" />
                        <p>Selecciona una conversación para comenzar</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
