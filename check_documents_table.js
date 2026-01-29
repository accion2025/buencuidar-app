
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars. Please run with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log("Checking for 'caregiver_documents' table...");
    const { data, error } = await supabase
        .from('caregiver_documents')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error or Table likely does not exist:", error.message);
    } else {
        console.log("Table 'caregiver_documents' exists. Data sample:", data);
    }
}

checkTable();
