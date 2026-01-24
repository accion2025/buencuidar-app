
-- 1. Add 'subscription_status' to profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
        ALTER TABLE profiles ADD COLUMN subscription_status text DEFAULT 'inactive';
    END IF;
END $$;

-- 2. Add 'plan_type' to profiles (optional but good for future)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'plan_type') THEN
        ALTER TABLE profiles ADD COLUMN plan_type text DEFAULT 'basic';
    END IF;
END $$;

-- 3. (Optional Debug) Set all existing profiles to 'active' for testing purposes since this is development
UPDATE profiles SET subscription_status = 'active';

-- 4. Verify columns
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('subscription_status', 'plan_type');
