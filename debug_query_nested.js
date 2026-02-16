
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testNestedQueries() {
    console.log("--- Testing Nested Supabase Syntax ---");

    // Test 6: Full nested query from the app
    const { data: d6, error: e6 } = await supabase
        .from('job_applications')
        .select(`
            *,
            caregiver:caregiver_id (
                id,
                full_name,
                avatar_url,
                caregiver_details (
                    rating,
                    experience,
                    specialization
                )
            ),
            appointment:appointment_id (
                id,
                title,
                date,
                type,
                status
            )
        `)
        .limit(1);

    console.log("6. Full Nested Query:", e6 ? `ERROR: ${e6.message}` : "OK");

    if (e6) {
        console.log("--- Drilling down to find the break ---");

        // Test 7: Nested caregiver only without details
        const { error: e7 } = await supabase.from('job_applications').select('*, caregiver:caregiver_id(id, full_name)').limit(1);
        console.log("7. Caregiver only:", e7 ? `ERROR: ${e7.message}` : "OK");

        // Test 8: Caregiver + Details (Simulating the inner part)
        // We can't query this directly from job_jobs easily, let's try querying profiles directly.
        const { error: e8 } = await supabase.from('profiles').select('id, full_name, caregiver_details(rating)').limit(1);
        console.log("8. Profiles + CaregiverDetails:", e8 ? `ERROR: ${e8.message}` : "OK");
    }
}

testNestedQueries();
