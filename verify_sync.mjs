
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
let envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const url = envVars['VITE_SUPABASE_URL'];
const key = envVars['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(url, key);

async function verifySync() {
    console.log('--- Verifying Rating Sync ---');

    // 1. Get all caregivers with reviews
    const { data: reviews } = await supabase
        .from('reviews')
        .select('caregiver_id, rating');

    const expected = {};
    reviews.forEach(r => {
        if (!expected[r.caregiver_id]) expected[r.caregiver_id] = { sum: 0, count: 0 };
        expected[r.caregiver_id].sum += r.rating;
        expected[r.caregiver_id].count += 1;
    });

    for (const id in expected) {
        const avg = (expected[id].sum / expected[id].count).toFixed(1);
        const count = expected[id].count;

        const { data: detail } = await supabase
            .from('caregiver_details')
            .select('rating, reviews_count')
            .eq('id', id)
            .single();

        if (detail) {
            console.log(`Caregiver ${id}:`);
            console.log(`  Expected: Rating ${avg}, Count ${count}`);
            console.log(`  Actual:   Rating ${detail.rating}, Count ${detail.reviews_count}`);
            if (Number(detail.rating) === Number(avg) && detail.reviews_count === count) {
                console.log('  ✅ MATCH');
            } else {
                console.log('  ❌ MISMATCH');
            }
        } else {
            console.log(`Caregiver ${id} not found in caregiver_details!`);
        }
    }
}

verifySync();
