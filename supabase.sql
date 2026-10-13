-- Run this ONCE in Supabase: SQL Editor -> New query -> paste -> Run.
-- It creates the table that stores like counts and a safe way to add/remove one like.

create table if not exists public.likes (
  work_key text primary key,
  count integer not null default 0 check (count >= 0)
);

-- Lock the table: visitors can read counts but cannot edit the table directly.
alter table public.likes enable row level security;

drop policy if exists "anyone can read likes" on public.likes;
create policy "anyone can read likes"
  on public.likes for select
  using (true);

grant select on public.likes to anon, authenticated;

-- The only way a visitor can change a count: add one or remove one.
create or replace function public.change_like(p_key text, p_delta integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  if p_delta not in (-1, 1) then
    raise exception 'delta must be -1 or 1';
  end if;
  if p_key is null or char_length(p_key) < 1 or char_length(p_key) > 200 then
    raise exception 'bad key';
  end if;

  insert into public.likes (work_key, count)
  values (p_key, greatest(p_delta, 0))
  on conflict (work_key)
  do update set count = greatest(public.likes.count + p_delta, 0)
  returning count into new_count;

  return new_count;
end;
$$;

revoke all on function public.change_like(text, integer) from public;
grant execute on function public.change_like(text, integer) to anon, authenticated;
