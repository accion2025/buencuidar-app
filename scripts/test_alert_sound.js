
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-'; // Anon Key
const supabase = createClient(supabaseUrl, supabaseKey);

async function sendTestAlert() {
    console.log("🔊 Enviando ALERTA DE PRUEBA AUDIBLE...");

    // 1. Obtener tu ID de usuario (el primero que encuentre suscrito)
    // Para simplificar, usaremos un ID de prueba o intentaremos obtener el tuyo si has iniciado sesión recientemente
    // Si tienes tu ID de usuario de Supabase a mano, mejor. Si no, intentaremos enviarlo a todos los 'active_pro'

    // Como esto es una prueba directa a la Edge Function, necesitamos un user_id destino.
    // Voy a buscar el último usuario que haya actualizado su perfil para usarlo como target.
    // O mejor, enviaré a un "External ID" genérico si OneSignal lo permite, pero la función espera user_id.

    // ESTRATEGIA: Buscar tu usuario (Gerardo o Admin)
    const { data: user, error } = await supabase
        .from('profiles')
        .select('id, email')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !user) {
        console.error("❌ No se encontró un usuario para la prueba.", error);
        return;
    }

    console.log(`🎯 Destinatario: ${user.email} (ID: ${user.id})`);

    const { data, error: fnError } = await supabase.functions.invoke('send-push-notification', {
        body: {
            user_id: user.id,
            title: "🔔 PRUEBA DE SONIDO BUENCUIDAR",
            message: "Esta alerta debe SONAR y VIBRAR fuerte. ¿Me escuchas?",
            priority: "high" // Esto activa el canal 'high_importance_channel' y el sonido
        }
    });

    if (fnError) {
        console.error("❌ Fallo en la Edge Function:", fnError);
    } else {
        console.log("✅ Resultado:", data);
        console.log("👉 Revisa tu móvil AHORA. Debería sonar.");
    }
}

sendTestAlert();
