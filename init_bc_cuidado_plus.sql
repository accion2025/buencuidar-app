-- ==========================================
-- BC Cuidado Plus - Inicialización de Esquema
-- Fecha: 10/02/2026
-- ==========================================

-- 1. Tabla de Catálogo de Programas (Estática)
CREATE TABLE IF NOT EXISTS care_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- Ej: 'Postoperatorio', 'Rehabilitación'
    description TEXT, -- Objetivo
    icon_name TEXT, -- Referencia al icono (ej: 'Activity', 'Heart')
    color_theme TEXT DEFAULT 'emerald', -- Para UI (emerald, blue, indigo, etc)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Plantillas de Actividades (Vinculada a Programas)
CREATE TABLE IF NOT EXISTS care_program_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES care_programs(id) ON DELETE CASCADE,
    activity_name TEXT NOT NULL, -- La actividad sugerida
    category TEXT DEFAULT 'General', -- Categoría (Medicación, Higiene, etc)
    is_default BOOLEAN DEFAULT TRUE, -- Si aparece marcada por defecto
    suggested_time TIME, -- Hora sugerida (opcional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS (Seguridad)
ALTER TABLE care_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_program_templates ENABLE ROW LEVEL SECURITY;

-- Políticas de Lectura (Públicas para todos los autenticados)
CREATE POLICY "Programs are viewable by everyone" ON care_programs
    FOR SELECT USING (true);

CREATE POLICY "Templates are viewable by everyone" ON care_program_templates
    FOR SELECT USING (true);

-- ==========================================
-- INSERCIÓN DE DATA MAESTRA (Los 7 Programas)
-- ==========================================

-- Limpiar data previa para evitar duplicados en desarrollo
TRUNCATE care_program_templates CASCADE;
TRUNCATE care_programs CASCADE;

-- Insertar Programas y guardar IDs en variables temporales (simulado con DO block)
DO $$
DECLARE
    p_postop UUID;
    p_rehab UUID;
    p_chronic UUID;
    p_disability UUID;
    p_preventive UUID;
    p_palliative UUID;
    p_loneliness UUID;
BEGIN

    -- 1. Postoperatorio
    INSERT INTO care_programs (name, description, icon_name, color_theme)
    VALUES ('Postoperatorio', 'Recuperación segura y sin complicaciones.', 'Activity', 'emerald')
    RETURNING id INTO p_postop;

    INSERT INTO care_program_templates (program_id, activity_name, category) VALUES
    (p_postop, 'Control de signos vitales básicos', 'Salud'),
    (p_postop, 'Supervisión de medicación', 'Medicación'),
    (p_postop, 'Apoyo para movilidad inicial', 'Físico'),
    (p_postop, 'Higiene personal asistida', 'Higiene'),
    (p_postop, 'Curación básica (según indicación médica)', 'Curas'),
    (p_postop, 'Preparación de alimentos blandos', 'Alimentación'),
    (p_postop, 'Acompañamiento a citas médicas', 'Gestión'),
    (p_postop, 'Prevención de caídas', 'Seguridad'),
    (p_postop, 'Registro diario de evolución', 'Reporte');

    -- 2. Rehabilitación
    INSERT INTO care_programs (name, description, icon_name, color_theme)
    VALUES ('Rehabilitación', 'Recuperar autonomía física y funcional.', 'Dumbbell', 'blue')
    RETURNING id INTO p_rehab;

    INSERT INTO care_program_templates (program_id, activity_name, category) VALUES
    (p_rehab, 'Asistencia en ejercicios físicos', 'Físico'),
    (p_rehab, 'Apoyo en terapias indicadas', 'Físico'),
    (p_rehab, 'Estimulación motora', 'Físico'),
    (p_rehab, 'Supervisión post-ejercicio', 'Físico'),
    (p_rehab, 'Motivación emocional', 'Bienestar'),
    (p_rehab, 'Rutinas de movilidad', 'Físico'),
    (p_rehab, 'Control de fatiga', 'Salud'),
    (p_rehab, 'Registro de avances', 'Reporte'),
    (p_rehab, 'Coordinación con terapeutas', 'Gestión');

    -- 3. Enfermedad Crónica
    INSERT INTO care_programs (name, description, icon_name, color_theme)
    VALUES ('Enfermedad Crónica', 'Mantener estabilidad y calidad de vida.', 'HeartPulse', 'red')
    RETURNING id INTO p_chronic;

    INSERT INTO care_program_templates (program_id, activity_name, category) VALUES
    (p_chronic, 'Administración supervisada de medicamentos', 'Medicación'),
    (p_chronic, 'Control de glucosa / presión (si aplica)', 'Salud'),
    (p_chronic, 'Monitoreo de síntomas', 'Salud'),
    (p_chronic, 'Preparación de dieta especial', 'Alimentación'),
    (p_chronic, 'Rutinas estables', 'Organización'),
    (p_chronic, 'Acompañamiento emocional', 'Bienestar'),
    (p_chronic, 'Organización de citas', 'Gestión'),
    (p_chronic, 'Educación en autocuidado', 'Bienestar'),
    (p_chronic, 'Reportes a familia', 'Reporte');

    -- 4. Discapacidad Permanente
    INSERT INTO care_programs (name, description, icon_name, color_theme)
    VALUES ('Discapacidad Permanente', 'Promover autonomía, dignidad y bienestar.', 'Accessibility', 'indigo')
    RETURNING id INTO p_disability;

    INSERT INTO care_program_templates (program_id, activity_name, category) VALUES
    (p_disability, 'Apoyo en movilidad permanente', 'Físico'),
    (p_disability, 'Transferencias (cama-silla-baño)', 'Físico'),
    (p_disability, 'Higiene asistida', 'Higiene'),
    (p_disability, 'Alimentación adaptada', 'Alimentación'),
    (p_disability, 'Uso de dispositivos especiales', 'Soporte'),
    (p_disability, 'Comunicación alternativa (si aplica)', 'Bienestar'),
    (p_disability, 'Adaptación del entorno', 'Seguridad'),
    (p_disability, 'Rutinas estructuradas', 'Organización'),
    (p_disability, 'Estimulación cognitiva', 'Cognitivo');

    -- 5. Acompañamiento Preventivo
    INSERT INTO care_programs (name, description, icon_name, color_theme)
    VALUES ('Acompañamiento Preventivo', 'Evitar deterioro y detectar riesgos tempranos.', 'ShieldCheck', 'teal')
    RETURNING id INTO p_preventive;

    INSERT INTO care_program_templates (program_id, activity_name, category) VALUES
    (p_preventive, 'Supervisión diaria ligera', 'Seguridad'),
    (p_preventive, 'Conversación y compañía', 'Bienestar'),
    (p_preventive, 'Caminatas suaves', 'Físico'),
    (p_preventive, 'Recordatorio de medicamentos', 'Medicación'),
    (p_preventive, 'Apoyo en compras', 'Gestión'),
    (p_preventive, 'Organización del hogar', 'Entorno'),
    (p_preventive, 'Observación de cambios físicos/emocionales', 'Salud'),
    (p_preventive, 'Activación social', 'Bienestar'),
    (p_preventive, 'Prevención de aislamiento', 'Bienestar');

    -- 6. Cuidados Paliativos
    INSERT INTO care_programs (name, description, icon_name, color_theme)
    VALUES ('Cuidados Paliativos', 'Brindar confort, dignidad y alivio.', 'HandHeart', 'brand-dark')
    RETURNING id INTO p_palliative;

    INSERT INTO care_program_templates (program_id, activity_name, category) VALUES
    (p_palliative, 'Manejo del confort físico', 'Confort'),
    (p_palliative, 'Apoyo en higiene delicada', 'Higiene'),
    (p_palliative, 'Acompañamiento constante', 'Bienestar'),
    (p_palliative, 'Apoyo emocional profundo', 'Bienestar'),
    (p_palliative, 'Comunicación con familia', 'Gestión'),
    (p_palliative, 'Control de dolor (según indicación)', 'Salud'),
    (p_palliative, 'Ambiente tranquilo', 'Entorno'),
    (p_palliative, 'Respeto a rituales personales', 'Bienestar'),
    (p_palliative, 'Presencia humana continua', 'Acompañamiento');

    -- 7. Soledad / Acompañamiento
    INSERT INTO care_programs (name, description, icon_name, color_theme)
    VALUES ('Soledad / Acompañamiento', 'Reducir aislamiento y fortalecer bienestar.', 'Coffee', 'amber')
    RETURNING id INTO p_loneliness;

    INSERT INTO care_program_templates (program_id, activity_name, category) VALUES
    (p_loneliness, 'Conversación diaria', 'Social'),
    (p_loneliness, 'Juegos de mesa', 'Lúdico'),
    (p_loneliness, 'Lectura compartida', 'Cognitivo'),
    (p_loneliness, 'Paseos', 'Físico'),
    (p_loneliness, 'Apoyo en tecnología', 'Educación'),
    (p_loneliness, 'Actividades recreativas', 'Lúdico'),
    (p_loneliness, 'Escucha activa', 'Social'),
    (p_loneliness, 'Celebración de fechas', 'Social'),
    (p_loneliness, 'Estimulación social', 'Social');

END $$;
