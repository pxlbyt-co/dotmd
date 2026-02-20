-- Add missing INSERT policy for anonymous_votes table.
-- RLS was enabled with only a SELECT policy, causing upserts via
-- the anon/publishable key to silently insert 0 rows.
CREATE POLICY "Anyone can insert anonymous votes"
  ON anonymous_votes FOR INSERT
  WITH CHECK (true);
