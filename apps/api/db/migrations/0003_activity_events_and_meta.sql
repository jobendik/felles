-- Activity events (AD-17) and app metadata (AD-25).
-- subject_user_id is the owner of the booking an event concerns: the Member-visibility key (AD-15). It is NULL
-- for resource events and is checked against bookings.user_id by a trigger; callers cannot default it to the actor.

create table activity_events (
  id integer primary key autoincrement,
  type text not null,
  actor_user_id integer not null references users (id) on delete restrict,
  booking_id integer references bookings (id) on delete restrict,
  resource_id integer references resources (id) on delete restrict,
  subject_user_id integer references users (id) on delete restrict,
  payload text not null,
  at integer not null,
  check (type in ('booking.created', 'booking.approved', 'booking.rejected', 'booking.cancelled', 'resource.created', 'resource.updated', 'resource.archived')),
  check ((substr(type, 1, 8) = 'booking.') = (booking_id is not null)),
  check ((substr(type, 1, 9) = 'resource.') = (subject_user_id is null)),
  check ((substr(type, 1, 9) = 'resource.') <= (resource_id is not null)),
  check (json_valid(payload) and json_type(payload) = 'object'),
  -- Payloads never contain the purpose of a booking (AD-17).
  check (json_type(payload, '$.purpose') is null)
) strict;

create index activity_events_by_subject on activity_events (subject_user_id, id);
create index activity_events_by_booking on activity_events (booking_id, id);

create trigger events_subject_matches before insert on activity_events
when new.subject_user_id is not (select user_id from bookings where id = new.booking_id)
begin
  select raise(abort, 'EVENT_SUBJECT_MISMATCH');
end;

create trigger events_no_replace before insert on activity_events
when new.id is not null and exists (select 1 from activity_events where id = new.id)
begin
  select raise(abort, 'EVENT_NO_DELETE');
end;

create trigger events_immutable before update on activity_events
begin
  select raise(abort, 'EVENT_IMMUTABLE');
end;

create trigger events_no_delete before delete on activity_events
begin
  select raise(abort, 'EVENT_NO_DELETE');
end;

-- Key/value metadata; `data_origin` is `synthetic-seed` on a seeded demo database (AD-25).
create table app_meta (
  key text primary key,
  value text not null,
  check (length(key) > 0)
) strict, without rowid;
