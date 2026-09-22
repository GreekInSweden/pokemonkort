-- Wipes every member account (test accounts included) and resets the
-- member-number counter so the next person to register becomes #1001
-- again. Safe to re-run.
--
-- What happens to related data when a member is deleted:
--   - member_cards (portfölj/önskelista)  -> raderas automatiskt (cascade)
--   - member_reports där de anmält någon  -> raderas automatiskt (cascade)
--   - member_reports där de blivit anmälda -> raderas automatiskt (cascade)
--   - orders / bids / auction_wins        -> raden finns kvar, men
--     member_id sätts till null (historik/statistik bevaras, men går
--     inte längre att koppla till en specifik medlem)
--   - blocked_emails                      -> rörs INTE av det här
--     skriptet, en tidigare blockerad mejladress förblir blockerad
--
-- Run this once in the Supabase SQL editor.

delete from members;

alter sequence member_number_seq restart with 1001;
