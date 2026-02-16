
const SUPABASE_URL = 'https://ntxxknufezprbibzpftf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-'; // From .env

const today = new Date().toISOString().split('T')[0];
// Fetch ALL pending appointments from today onwards
const url = `${SUPABASE_URL}/rest/v1/appointments?select=id,status,service_group_id,caregiver_id,title,date&status=eq.pending&date=gte.${today}`;

const options = {
    headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
    }
};

console.log("Fetching from:", url);

try {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log(`Fetched ${data.length} pending appointments.`);

    // Filter locally for "PRUEBA"
    const pruebas = data.filter(d => d.title && d.title.toUpperCase().includes('PRUEBA'));
    console.log("PRUEBA pending items:", JSON.stringify(pruebas, null, 2));

} catch (error) {
    console.error("Error fetching data:", error);
}
