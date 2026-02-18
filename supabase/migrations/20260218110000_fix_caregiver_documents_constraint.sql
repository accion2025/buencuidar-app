-- Migración para corregir el error de UPSERT en caregiver_documents
-- Añade una restricción de unicidad para permitir la sincronización de documentos por tipo

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'caregiver_documents_caregiver_id_document_type_key'
    ) THEN
        ALTER TABLE caregiver_documents 
        ADD CONSTRAINT caregiver_documents_caregiver_id_document_type_key 
        UNIQUE (caregiver_id, document_type);
    END IF;
END $$;
