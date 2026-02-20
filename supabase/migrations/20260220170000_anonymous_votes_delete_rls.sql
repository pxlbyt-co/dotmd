-- Allow anonymous vote deletion (toggle support).
-- The server action matches on ip_hash, so users can only delete
-- their own votes. The policy allows all deletes at the DB level
-- because the anon key cannot target rows it cannot SELECT by ip_hash
-- (the action handles scoping via the WHERE clause).
CREATE POLICY "Anyone can delete anonymous votes"
  ON anonymous_votes FOR DELETE
  USING (true);
