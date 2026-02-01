import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log("Checking profiles table...");
    const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log(`Total profiles found: ${count}`);
        console.log("Latest users:");
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        data.slice(0, 5).forEach(u => {
            console.log(`- [${u.role}] ${u.email} (${u.full_name || 'No Name'})`);
        });
    }
}

check();
