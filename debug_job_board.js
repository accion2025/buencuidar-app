
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugJobBoard() {
    console.log("--- Debugging Job Board Visibility ---");

    // 1. Search for the specific package "prueba 45"
    console.log("Searching for 'prueba 45'...");
    const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .ilike('title', '%prueba 45%');

    if (error) {
        console.error("Error fetching appointments:", error);
        return;
    }

    if (appointments.length === 0) {
        console.log("No appointments found with title 'prueba 45'.");

        // List some pending appointments to see what's there
        const { data: anyPending } = await supabase
            .from('appointments')
            .select('id, title, status, caregiver_id, service_group_id')
            .eq('status', 'pending')
            .limit(5);
        console.log("Sample pending appointments:", anyPending);

    } else {
        console.log(`Found ${appointments.length} appointments for 'prueba 45'.`);
        const first = appointments[0];
        console.log("Sample Appointment Data:", {
            id: first.id,
            title: first.title,
            status: first.status, // Should be 'pending'
            caregiver_id: first.caregiver_id, // Should be null
            date: first.date, // Should be future
            service_group_id: first.service_group_id,
            type: first.type
        });

        // Check if it meets Job Board criteria
        const isPending = first.status === 'pending';
        const isUnassigned = first.caregiver_id === null;
        const now = new Date();
        const todayStr = now.toLocaleDateString('en-CA');
        const isFuture = first.date >= todayStr;

        console.log("Job Board Criteria Check:");
        console.log(`- Status is 'pending': ${isPending}`);
        console.log(`- Caregiver is NULL: ${isUnassigned}`);
        console.log(`- Date (${first.date}) >= Today (${todayStr}): ${isFuture}`);

        if (isPending && isUnassigned && isFuture) {
            console.log("✅ Should be visible in Job Board (barring RLS or Pagination).");
        } else {
            console.log("❌ NOT visible due to criteria mismatch.");
        }
    }
}

debugJobBoard();
