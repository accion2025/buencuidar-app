import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntxxknufezprbibzpftf.supabase.co';
const supabaseKey = 'sb_publishable_V5D-ZgsTgoDcqQBEbZ4lQA_Dcfz2wY-';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    // 1. Get all Cuidado+ appointments
    const { data: apps } = await supabase
        .from('appointments')
        .select('id, title, date, status, details, service_group_id')
        .eq('type', 'Cuidado+')
        .order('date', { ascending: true });

    if (!apps || apps.length === 0) {
        console.log("No hay citas Cuidado+.");
        return;
    }

    // Group by service_group_id
    const groups = {};
    apps.forEach(a => {
        const gid = a.service_group_id || `solo-${a.id}`;
        if (!groups[gid]) groups[gid] = [];
        groups[gid].push(a);
    });

    console.log(`Total paquetes: ${Object.keys(groups).length}\n`);

    for (const [gid, appts] of Object.entries(groups)) {
        const first = appts[0];
        console.log(`\n${'='.repeat(60)}`);
        console.log(`PAQUETE: ${first.title}`);
        console.log(`Group ID: ${gid}`);
        console.log(`Días: ${appts.length} (${appts[0].date} → ${appts[appts.length - 1].date})`);

        // Parse agenda from first appointment
        let agendaItems = [];
        if (first.details && first.details.includes('---SERVICES---')) {
            const jsonStr = first.details.split('---SERVICES---')[1];
            try {
                const raw = JSON.parse(jsonStr);
                // Expand cycles (same logic as panel)
                raw.forEach(item => {
                    if (typeof item === 'object' && item.cycles && Array.isArray(item.cycles)) {
                        if (item.cycles.length === 0) {
                            console.log(`  ⚠️ ITEM CON CYCLES VACÍO: "${item.name}" → SE PIERDE`);
                        }
                        item.cycles.forEach(cycle => {
                            if (cycle.startTime) {
                                agendaItems.push({
                                    panelName: `${item.activity_name || item.name} (${cycle.startTime})`,
                                    raw: item
                                });
                            } else {
                                agendaItems.push({
                                    panelName: item.activity_name || item.activity || item.name,
                                    raw: item
                                });
                            }
                        });
                    } else {
                        agendaItems.push({
                            panelName: item.activity_name || item.activity || item.name,
                            raw: item
                        });
                    }
                });
            } catch (e) {
                console.log(`  Error parsing: ${e.message}`);
            }
        }

        console.log(`\nActividades en agenda (como las ve el panel): ${agendaItems.length}`);
        agendaItems.forEach((a, i) => {
            console.log(`  ${i + 1}. Panel busca: "${a.panelName.trim().toLowerCase()}"`);
        });

        // Get care_logs for the first (most recent completed) appointment
        // Find last completed/paid or most recent
        const target = appts.find(a => a.status === 'in_progress')
            || [...appts].reverse().find(a => ['completed', 'paid'].includes(a.status))
            || appts[appts.length - 1];

        const { data: logs } = await supabase
            .from('care_logs')
            .select('action, category')
            .eq('appointment_id', target.id)
            .eq('category', 'Plan de Cuidado');

        console.log(`\nLogs registrados para ${target.date} (${target.status}, ID: ${target.id}): ${(logs || []).length}`);
        (logs || []).forEach((log, i) => {
            console.log(`  ${i + 1}. Log guarda:  "${log.action.trim().toLowerCase()}"`);
        });

        // COMPARE
        if (agendaItems.length > 0 && (logs || []).length > 0) {
            console.log(`\n🔍 COMPARACIÓN:`);
            const logActions = new Set((logs || []).map(l => l.action.trim().toLowerCase()));

            agendaItems.forEach(a => {
                const cleanPanel = a.panelName.trim().toLowerCase();
                const match = logActions.has(cleanPanel);
                console.log(`  ${match ? '✅' : '❌'} "${cleanPanel}" ${match ? '→ COINCIDE' : '→ NO COINCIDE (no se marca como completado)'}`);
            });

            // Show logs that don't match any agenda item
            const panelNames = new Set(agendaItems.map(a => a.panelName.trim().toLowerCase()));
            (logs || []).forEach(log => {
                const cleanLog = log.action.trim().toLowerCase();
                if (!panelNames.has(cleanLog)) {
                    console.log(`  ⚠️ LOG HUÉRFANO (no tiene item en agenda): "${cleanLog}"`);
                }
            });
        }
    }
}

debug();
