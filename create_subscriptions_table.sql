-- 1. Create Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing')) NOT NULL DEFAULT 'incomplete',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan_type TEXT CHECK (plan_type IN ('basic', 'premium')) NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Users can view their own subscription details
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only Service Role or specific logic should insert/update usually, 
-- but for MVP client-side simulation we might allow 'authenticated' update if we don't have a secure backend.
-- ideally:
-- CREATE POLICY "Service role manages subscriptions" ON subscriptions USING (auth.role() = 'service_role');

-- For this MVP (Direct client update simulation for 'Success' page):
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
CREATE POLICY "Users can insert/update own subscription" ON subscriptions
    FOR ALL
    USING (auth.uid() = user_id);

-- 4. Sync function (Optional, usually handled by code, but let's keep it simple)
-- If a subscription is 'active', update profiles.subscription_status
CREATE OR REPLACE FUNCTION sync_profile_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET subscription_status = NEW.status,
        plan_type = NEW.plan_type
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_subscription_status ON subscriptions;
CREATE TRIGGER tr_sync_subscription_status
    AFTER INSERT OR UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION sync_profile_subscription_status();
