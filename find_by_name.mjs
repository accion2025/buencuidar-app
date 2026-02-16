import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findUsersAndApps() {
    console.log("Buscando Elena Gracia y Yoel Diaz...");

    // 1. Search Users
    const { data: users, error: userErr } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .or('full_name.ilike.%Elena%,full_name.ilike.%Yoel%');

    if (userErr) {
        console.error("Error users:", userErr);
    } else {
        users.forEach(u => console.log(`- USER: ${u.id} | NAME: ${u.full_name} | ROLE: ${u.role}`));
    }

    // 2. Search Appointments for any date
    console.log("\nBuscando citas con 'Servicio 10' en el título...");
    const { data: apps, error: appErr } = await supabase
        .from('appointments')
        .select('*')
        .ilike('title', '%Servicio 10%');

    if (appErr) {
        console.error("Error apps:", appErr);
    } else {
        apps.forEach(a => console.log(`- APP: ${a.id} | TITLE: ${a.title} | DATE: ${a.date} | TYPE: ${a.type}`));
    }
}

findUsersAndApps();
