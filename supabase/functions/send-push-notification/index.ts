import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

serve(async (req) => {
    try {
        const { user_id, title, message, priority = 'high' } = await req.json()

        console.log(`[PushService] Enviando notificación a: ${user_id} - Prioridad: ${priority}`);

        const payload = {
            app_id: ONESIGNAL_APP_ID,
            include_external_user_ids: [user_id],
            headings: { en: title, es: title },
            contents: { en: message, es: message },
            // Canales de Android (Configurados en OneSignal Dashboard)
            android_channel_id: priority === 'high' ? "high_importance_channel" : "default",
            // Sonido para iOS
            ios_sound: priority === 'high' ? "notification_sound.wav" : "default",
            // Prioridad de OneSignal (10 = High)
            priority: 10,
            // Patrón de vibración para Android (ms)
            android_vibration_pattern: priority === 'high' ? [200, 100, 200, 100, 200] : [100],
            // Asegurar que la notificación se muestre incluso si la app está abierta
            display_type: 1
        }

        const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify(payload),
        })

        const result = await response.json()

        if (result.errors) {
            console.error("[PushService] Errores de OneSignal:", result.errors);
        }

        return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
            status: response.status
        })
    } catch (err) {
        console.error("[PushService] Excepción:", err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400
        })
    }
})
