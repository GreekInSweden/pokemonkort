-- Marks which sets are autograph subsets (e.g. "Base Autographs", "Chrome
-- Classics Autographs") vs ordinary photo-only sets/inserts. Used by
-- Mest Eftertraktade to offer an "Autografer"-flik inom Sportkort-kolumnen.
--
-- A plain boolean rather than name-matching on "%Autograph%" -- explicit
-- and correct even if a future set's name doesn't literally say
-- "Autograph" (e.g. "Signature Series" or similar).
alter table sets
  add column if not exists is_autograph boolean not null default false;

create index if not exists idx_sets_is_autograph on sets(is_autograph);
