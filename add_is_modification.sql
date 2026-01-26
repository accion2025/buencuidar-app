-- Añadir columna para rastrear si una cita ha sido modificada después de su confirmación
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_modification BOOLEAN DEFAULT false;
