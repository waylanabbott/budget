-- Enable Supabase Realtime on the transactions table
-- This allows clients to subscribe to INSERT/UPDATE/DELETE events
-- RLS still applies — clients only receive events for rows they can access
alter publication supabase_realtime add table transactions;
