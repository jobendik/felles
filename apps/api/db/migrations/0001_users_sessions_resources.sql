-- Users, sessions and resources (AD-11, AD-10, AD-18). S00 range 0001-0099, frozen after Gate S00-CP.
-- Instants are INTEGER epoch milliseconds UTC. Booleans are INTEGER 0/1. Every enum column is NOT NULL with a CHECK.

create table users (
  id integer primary key autoincrement,
  email text not null unique,
  name text not null,
  role text not null,
  password_hash text not null,
  created_at integer not null,
  check (email = lower(email) and length(trim(email)) > 0),
  check (length(trim(name)) > 0),
  check (role in ('member', 'admin')),
  check (password_hash like 'scrypt$%')
) strict;

-- Only the SHA-256 of the session id is stored (AD-11); rows are deleted by logout and purge, never updated.
create table sessions (
  id integer primary key autoincrement,
  token_hash text not null unique,
  user_id integer not null references users (id) on delete restrict,
  created_at integer not null,
  expires_at integer not null,
  check (length(token_hash) = 64),
  check (expires_at > created_at)
) strict;

create index sessions_by_user on sessions (user_id);
create index sessions_by_expiry on sessions (expires_at);

create table resources (
  id integer primary key autoincrement,
  name text not null,
  kind text not null,
  description text,
  location text not null,
  seats integer,
  symbol text not null,
  colour text not null,
  approval_required integer not null,
  status text not null default 'active',
  created_at integer not null,
  check (length(trim(name)) > 0),
  check (kind in ('room', 'equipment')),
  check (description is null or length(trim(description)) > 0),
  check (length(trim(location)) > 0),
  check (seats is null or seats between 1 and 1000),
  check (symbol in ('users', 'monitor', 'door-closed', 'presentation', 'projector', 'camera', 'mic', 'pen-line', 'laptop', 'headphones')),
  check (colour in ('bla', 'gronn', 'lilla', 'oransje', 'rosa', 'teal', 'gul', 'gra')),
  check (approval_required in (0, 1)),
  check (status in ('active', 'archived'))
) strict;

create index resources_by_status on resources (status, kind);

-- Archived is final and a resource is never deleted (AD-10); resource names are not unique.
create trigger resources_archive_final before update on resources
when old.status = 'archived' and new.status <> 'archived'
begin
  select raise(abort, 'RESOURCE_ARCHIVE_FINAL');
end;

create trigger resources_no_delete before delete on resources
begin
  select raise(abort, 'RESOURCE_NO_DELETE');
end;
