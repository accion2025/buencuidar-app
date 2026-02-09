
-- 20260209154300_fix_chat_notifications_rls.sql
-- Proactive Fix: Reset and Enforce RLS for Chat and Notifications

-- 1. NOTIFICATIONS TABLE
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Create comprehensive policies
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
USING (auth.uid() = user_id);

-- 2. CONVERSATIONS TABLE
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations" ON conversations;

CREATE POLICY "Users can view conversations they participate in"
ON conversations FOR SELECT
USING (
    auth.uid() = participant1_id OR 
    auth.uid() = participant2_id
);

CREATE POLICY "Users can insert conversations"
ON conversations FOR INSERT
WITH CHECK (
    auth.uid() = participant1_id OR 
    auth.uid() = participant2_id
);

CREATE POLICY "Users can update conversations"
ON conversations FOR UPDATE
USING (
    auth.uid() = participant1_id OR 
    auth.uid() = participant2_id
);

-- 3. MESSAGES TABLE
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;

-- Policy for viewing messages: Must be part of the conversation
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
        AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
);

-- Policy for inserting messages: Must be sender AND part of conversation
CREATE POLICY "Users can insert messages"
ON messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = conversation_id
        AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
);

-- Policy for updating messages (e.g. marking as read): Must be recipient
-- Usually 'is_read' is updated by the recipient
CREATE POLICY "Users can update messages (mark read)"
ON messages FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id
        AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
);

-- Policy for deleting messages: Only sender can delete (optional feature)
CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
USING (auth.uid() = sender_id);
