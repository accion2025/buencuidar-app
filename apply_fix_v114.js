
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function applyFix() {
    console.log("--- Aplicando Corrección de Registro (V1.0.114) ---");

    const sql = `
    -- 1. Añadir columna trial_expiry_date
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_expiry_date TEXT;

    -- 2. Actualizar función de registro
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.profiles (
        id, email, full_name, role, country, department, municipality, phone, trial_expiry_date
      )
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario Nuevo'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'family'),
        NEW.raw_user_meta_data->>'country',
        NEW.raw_user_meta_data->>'department',
        NEW.raw_user_meta_data->>'municipality',
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'trial_expiry_date'
      );
      
      IF (NEW.raw_user_meta_data->>'role' = 'caregiver') THEN
        INSERT INTO public.caregiver_details (id, location, specialization, experience, bio)
        VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'location', 'Nicaragua'),
          NEW.raw_user_meta_data->>'specialization',
          NULLIF(NEW.raw_user_meta_data->>'experience', '')::numeric,
          NEW.raw_user_meta_data->>'bio'
        )
        ON CONFLICT (id) DO UPDATE SET
          location = EXCLUDED.location,
          specialization = EXCLUDED.specialization,
          experience = EXCLUDED.experience,
          bio = EXCLUDED.bio;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    // Intentamos ejecutar via RPC si está disponible (exec_sql es común en este proyecto)
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error("Error aplicando SQL:", error);
        console.log("\n⚠️ Si el RPC 'exec_sql' no existe, por favor ejecuta el contenido de 'supabase/migrations/20260222173000_fix_registration_error_v114.sql' manualmente en el SQL Editor de Supabase.");
    } else {
        console.log("✅ Corrección aplicada correctamente.");
        console.log("Ahora puedes intentar registrar un nuevo usuario.");
    }
}

applyFix();
