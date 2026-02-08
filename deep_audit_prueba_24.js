
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepAudit() {
    console.log("--- DEEP AUDIT: PRUEBA 24 ---");

    // 1. Authenticate to bypass RLS restrictions
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@admin.com',
        password: 'password123'
    });

    if (authError) {
        console.error("Auth Failure:", authError.message);
        return;
    }
    console.log("Auth Successful as Admin.");

    // 2. Fetch the exact record
    const { data: appointment, error } = await supabase
        .from('appointments')
        .select(`
            *,
            client:client_id (id, full_name),
            patient:patient_id (id, full_name)
        `)
        .ilike('title', '%PRUEBA 24%')
        .single();

    if (error) {
        console.error("Fetch Error:", error.message);
        // If not found by title, let's list all pending jobs to see what's there
        const { data: pendings } = await supabase.from('appointments').select('id, title, status, caregiver_id, date, client_id, patient_id').eq('status', 'pending');
        console.log("All Pending Jobs in DB:", JSON.stringify(pendings, null, 2));
    } else {
        console.log("Appointment Data Found:");
        console.log(JSON.stringify(appointment, null, 2));

        // 3. Check if it matches JobBoard.jsx filter
        const now = new Date();
        const todayStr = '2026-02-08';
        const currentTime = '11:45:00'; // Simulation of current local time

        console.log("\nSimulated Filter Check:");
        console.log(`- Status is 'pending': ${appointment.status === 'pending'}`);
        console.log(`- Caregiver is NULL: ${appointment.caregiver_id === null}`);
        console.log(`- Date ${appointment.date} > ${todayStr}: ${appointment.date > todayStr}`);
        console.log(`- OR (Date ${appointment.date} == ${todayStr} AND Time ${appointment.time} >= ${currentTime})`);

        const isVisible = appointment.status === 'pending' &&
            appointment.caregiver_id === null &&
            (appointment.date > todayStr || (appointment.date === todayStr && appointment.time >= currentTime));

        console.log(`\nRESULT: Should be visible? ${isVisible}`);
    }
}

deepAudit();
