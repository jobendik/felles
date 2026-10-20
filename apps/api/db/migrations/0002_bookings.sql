-- Bookings (AD-8, AD-9). One table; the lifecycle is enforced in code and again here.
-- Column names are fixed by AD-9: decided_by_user_id, decided_at, decision_reason,
-- cancelled_by_user_id, cancelled_at, cancel_reason.

create table bookings (
  id integer primary key autoincrement,
  resource_id integer not null references resources (id) on delete restrict,
  user_id integer not null references users (id) on delete restrict,
  start_at integer not null,
  end_at integer not null,
  purpose text not null,
  status text not null,
  created_at integer not null,
  decided_by_user_id integer references users (id) on delete restrict,
  decided_at integer,
  decision_reason text,
  cancelled_by_user_id integer references users (id) on delete restrict,
  cancelled_at integer,
  cancel_reason text,

  check (status in ('pending', 'confirmed', 'rejected', 'cancelled')),
  check (length(trim(purpose)) > 0),

  -- The grid and the duration have a free database backstop (Oslo offsets are whole hours). The 08:00-22:00
  -- window and "not in the past" are application-only.
  check (end_at > start_at),
  check (start_at % 1800000 = 0 and end_at % 1800000 = 0),
  check (end_at - start_at between 1800000 and 14400000),

  -- Decision: who and when travel together; nobody decides their own booking; a pending booking has no decision.
  check ((decided_by_user_id is null) = (decided_at is null)),
  check (decided_by_user_id is null or decided_by_user_id <> user_id),
  check (status <> 'pending' or decided_by_user_id is null),
  check (decision_reason is null or decided_by_user_id is not null),
  check (status <> 'rejected' or (decided_by_user_id is not null and decision_reason is not null and length(trim(decision_reason)) > 0)),

  -- Cancellation: exactly the cancelled rows have a canceller; someone else's booking needs a reason.
  check ((status = 'cancelled') = (cancelled_by_user_id is not null)),
  check ((cancelled_by_user_id is null) = (cancelled_at is null)),
  check (cancelled_by_user_id is null or cancelled_by_user_id = user_id or (cancel_reason is not null and length(trim(cancel_reason)) > 0)),
  check (cancelled_by_user_id is not null or cancel_reason is null)
) strict;

-- The plain index of AD-18; the overlap query and the application query both use it.
create index bookings_blocking on bookings (resource_id, status, start_at);
create index bookings_by_user on bookings (user_id, start_at);
create index bookings_by_status on bookings (status, start_at);

-- Exclusivity backstop for any writer (AD-8): a blocking insert may not overlap a blocking booking of the resource.
create trigger bookings_no_overlap before insert on bookings
when new.status in ('pending', 'confirmed')
  and exists (
    select 1 from bookings b
    where b.resource_id = new.resource_id
      and b.status in ('pending', 'confirmed')
      and b.start_at < new.end_at
      and new.start_at < b.end_at
  )
begin
  select raise(abort, 'BOOKING_OVERLAP');
end;

-- INSERT OR REPLACE and upsert would delete the old row without firing the delete trigger.
create trigger bookings_no_replace before insert on bookings
when new.id is not null and exists (select 1 from bookings where id = new.id)
begin
  select raise(abort, 'BOOKING_NO_DELETE');
end;

create trigger bookings_no_delete before delete on bookings
begin
  select raise(abort, 'BOOKING_NO_DELETE');
end;

-- Terminal rows are frozen.
create trigger bookings_terminal_frozen before update on bookings
when old.status in ('rejected', 'cancelled')
begin
  select raise(abort, 'BOOKING_TERMINAL');
end;

-- The interval, the owner and the purpose never change (change = cancel + new, BR-3). Fires on no-op sets too.
create trigger bookings_immutable before update of resource_id, user_id, start_at, end_at, purpose on bookings
begin
  select raise(abort, 'BOOKING_IMMUTABLE');
end;

-- Decision and cancellation columns are write-once.
create trigger bookings_decision_write_once before update of decided_by_user_id, decided_at, decision_reason, cancelled_by_user_id, cancelled_at, cancel_reason on bookings
when (old.decided_by_user_id is not null and (new.decided_by_user_id is not old.decided_by_user_id or new.decided_at is not old.decided_at))
  or (old.decision_reason is not null and new.decision_reason is not old.decision_reason)
  or (old.cancelled_by_user_id is not null)
begin
  select raise(abort, 'BOOKING_DECISION_WRITE_ONCE');
end;

-- pending -> confirmed needs an approver.
create trigger bookings_approve_needs_approver before update of status on bookings
when old.status = 'pending' and new.status = 'confirmed' and new.decided_by_user_id is null
begin
  select raise(abort, 'BOOKING_APPROVER_REQUIRED');
end;

-- The one transition table: pending -> confirmed | rejected | cancelled; confirmed -> cancelled.
create trigger bookings_illegal_transition before update of status on bookings
when not (
  old.status = new.status
  or (old.status = 'pending' and new.status in ('confirmed', 'rejected', 'cancelled'))
  or (old.status = 'confirmed' and new.status = 'cancelled')
)
begin
  select raise(abort, 'BOOKING_ILLEGAL_TRANSITION');
end;
