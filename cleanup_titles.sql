-- Remove time prefix (HH:MM:SS - or HH:MM -) from titles
UPDATE appointments 
SET title = REGEXP_REPLACE(title, '^\d{2}:\d{2}(:\d{2})?\s*-\s*', '')
WHERE title ~ '^\d{2}:\d{2}(:\d{2})?\s*-\s*';

-- Shorten very long titles (e.g. remove "(PACK SEMANAL...)") if feasible, or just rely on CSS truncate.
-- Let's stick to time prefix removal for now as it's the most obvious redundancy.
