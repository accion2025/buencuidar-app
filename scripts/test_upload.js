import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env parsing
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpload() {
    console.log("Testing upload to avatars bucket...");
    try {
        const dummyFile = Buffer.from("dummy data");
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(`test-${Date.now()}.txt`, dummyFile);

        if (error) {
            console.error("Upload error:", error);
        } else {
            console.log("Upload successful:", data);
        }
    } catch (err) {
        console.error("Caught error:", err);
    }
}

testUpload();
