
import { supabase } from '../src/lib/supabase';

async function test() {
    const { data, error } = await supabase.from('appointments').select('*').limit(1);
    if (error) {
        console.error(error);
        return;
    }
    console.log("COLUMNS:", Object.keys(data[0] || {}));
    console.log("FIRST ROW DATA:", data[0]);
}

test();
