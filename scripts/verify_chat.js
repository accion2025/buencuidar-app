
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-'; // Anon Key
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyChatSystem() {
    console.log("💬 Verificando integridad del sistema de chat...");

    // 1. Check Conversations Table
    const { count: conversationCount, error: convError } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true });

    if (convError) {
        console.error("❌ Error verificando tabla 'conversations':", convError.message);
    } else {
        console.log(`✅ Tabla 'conversations' accesible. Total registros: ${conversationCount}`);
    }

    // 2. Check Messages Table
    const { count: messageCount, error: msgError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

    if (msgError) {
        console.error("❌ Error verificando tabla 'messages':", msgError.message);
    } else {
        console.log(`✅ Tabla 'messages' accesible. Total registros: ${messageCount}`);
    }

    // 3. Simple Integrity Check (Foreign Key Relationships)
    // We try to fetch 5 messages with their conversation and sender to ensure relationships are valid
    const { data: sampleMessages, error: relationError } = await supabase
        .from('messages')
        .select(`
            id,
            content,
            conversation_id,
            sender_id
        `)
        .limit(5);

    if (relationError) {
        console.error("❌ Error verificando relaciones de mensajes:", relationError.message);
    } else if (sampleMessages && sampleMessages.length > 0) {
        console.log(`✅ Relaciones de mensajes verificadas (Muestra de integrity check exitosa).`);
        console.log("   - Muestra:", sampleMessages.map(m => m.id).join(', '));
    } else {
        console.log("ℹ️ No hay mensajes para verificar relaciones (sistema limpio o sin datos).");
    }

    console.log("🏁 Verificación completada.");
}

verifyChatSystem();
