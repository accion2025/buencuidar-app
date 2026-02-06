import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

serve(async (req) => {
    try {
        const { user_id, title, message, priority = 'high' } = await req.json()

        console.log(`Sending notification to user: ${user_id}`);

        const payload = {
            app_id: ONESIGNAL_APP_ID,
            include_external_user_ids: [user_id],
            headings: { en: title, es: title },
            contents: { en: message, es: message },
            android_channel_id: priority === 'high' ? "high_importance_channel" : "default",
            ios_sound: priority === 'high' ? "notification_sound.wav" : "default",
            priority: 10,
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
        return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
            status: response.status
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400
        })
    }
})
