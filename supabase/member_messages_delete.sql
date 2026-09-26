-- Lets each member delete a message from their OWN inbox view without
-- yanking it out from under the other person mid-conversation. Two flags,
-- one per side; the row is only physically removed once both sides have
-- deleted their copy (so nothing lingers forever once neither party needs
-- it, but a report/dispute the other person hasn't dealt with yet can't be
-- deleted out from under them by one click).
alter table member_messages
  add column if not exists deleted_by_from boolean not null default false;
alter table member_messages
  add column if not exists deleted_by_to boolean not null default false;
