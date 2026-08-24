alter table public.payments alter column provider set default 'stripe';

comment on column public.payments.provider is
  'Payment processor used for this transaction. New checkouts use Stripe; historical provider values are preserved.';

create or replace function public.apply_verified_payment(
  p_provider_event_id text,
  p_provider_payment_id text,
  p_payment_id uuid,
  p_amount_cents bigint,
  p_currency text,
  p_payload_digest text,
  p_occurred_at timestamptz default now()
)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_payment public.payments%rowtype;
  v_listing public.listings%rowtype;
  v_season_id uuid;
  v_webhook_id uuid;
  v_old_rank integer;
  v_new_rank integer;
  v_previous_summit_id uuid;
  v_previous_summit_name text;
  v_event_type public.ranking_event_type;
  v_message text;
begin
  insert into public.webhook_events(provider, provider_event_id, event_type, payload_digest)
  values ('stripe', p_provider_event_id, 'checkout.session.paid', p_payload_digest)
  on conflict (provider, provider_event_id) do nothing returning id into v_webhook_id;
  if v_webhook_id is null then
    return jsonb_build_object('duplicate', true);
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Unknown checkout payment'; end if;
  if v_payment.provider <> 'stripe' then raise exception 'Payment provider mismatch'; end if;
  if v_payment.status = 'succeeded' then
    update public.webhook_events set status = 'ignored', processed_at = now() where id = v_webhook_id;
    return jsonb_build_object('duplicate', true, 'payment_id', v_payment.id);
  end if;
  if v_payment.amount_cents <> p_amount_cents or upper(v_payment.currency) <> upper(p_currency) then
    raise exception 'Webhook amount or currency does not match checkout';
  end if;
  if exists(select 1 from public.payments where provider_payment_id = p_provider_payment_id and id <> p_payment_id) then
    raise exception 'Provider payment already credited';
  end if;

  select id into v_season_id from public.seasons
    where status = 'active' and p_occurred_at between starts_at and ends_at
    for update;
  if v_season_id is null then raise exception 'No active season for payment time'; end if;

  perform id from public.listings where status in ('approved', 'pending_payment', 'pending_review') order by id for update;
  select id, name into v_previous_summit_id, v_previous_summit_name
    from public.listings where status = 'approved' and current_rank = 1 limit 1;
  select * into v_listing from public.listings where id = v_payment.listing_id for update;
  v_old_rank := v_listing.current_rank;

  update public.listings set
    status = 'approved',
    approved_at = coalesce(approved_at, p_occurred_at),
    current_season_id = v_season_id,
    current_season_spend_cents = case when current_season_id = v_season_id then current_season_spend_cents else 0 end + p_amount_cents,
    lifetime_spend_cents = lifetime_spend_cents + p_amount_cents,
    first_reached_current_spend_at = p_occurred_at,
    updated_at = now()
  where id = v_payment.listing_id
  returning * into v_listing;

  with ranked as (
    select id, row_number() over(order by current_season_spend_cents desc, first_reached_current_spend_at asc, id asc)::integer as new_rank
    from public.listings where status = 'approved' and current_season_spend_cents > 0
  )
  update public.listings l set current_rank = r.new_rank from ranked r where l.id = r.id;
  update public.listings set current_rank = null where status <> 'approved' or current_season_spend_cents = 0;
  select current_rank into v_new_rank from public.listings where id = v_payment.listing_id;

  update public.payments set status = 'succeeded', verified = true, season_id = v_season_id,
    provider_payment_id = p_provider_payment_id, completed_at = p_occurred_at, updated_at = now()
  where id = v_payment.id;

  insert into public.listing_contacts(listing_id, email, verified_at)
  values (v_listing.id, lower(v_payment.payer_email), p_occurred_at)
  on conflict (listing_id, email) do update set verified_at = excluded.verified_at;

  if v_new_rank = 1 and v_previous_summit_id is distinct from v_listing.id then
    update public.summit_holds set ended_at = p_occurred_at where season_id = v_season_id and ended_at is null;
    insert into public.summit_holds(season_id, listing_id, started_at) values (v_season_id, v_listing.id, p_occurred_at);
    v_event_type := 'summit_taken';
    v_message := case when v_previous_summit_id is null then v_listing.name || ' captured the summit.' else v_listing.name || ' pushed ' || v_previous_summit_name || ' off the summit.' end;
  elsif v_old_rank is null then
    v_event_type := 'joined';
    v_message := v_listing.name || ' joined Base Camp for $' || (p_amount_cents / 100)::text || '.';
  else
    v_event_type := 'climbed';
    v_message := v_listing.name || ' climbed from #' || v_old_rank::text || ' to #' || v_new_rank::text || '.';
  end if;

  insert into public.ranking_events(season_id, listing_id, displaced_listing_id, payment_id, event_type, message, old_rank, new_rank, amount_cents, altitude_meters, created_at)
  values (v_season_id, v_listing.id, case when v_new_rank = 1 then v_previous_summit_id end, v_payment.id, v_event_type, v_message, v_old_rank, v_new_rank, p_amount_cents, v_listing.current_season_spend_cents, p_occurred_at);

  insert into public.rank_snapshots(season_id, listing_id, rank, spend_cents, altitude_meters, captured_at)
  select v_season_id, id, current_rank, current_season_spend_cents, current_season_spend_cents, p_occurred_at
  from public.listings where status = 'approved' and current_rank is not null;

  update public.site_metrics set
    verified_revenue_cents = verified_revenue_cents + p_amount_cents,
    payment_count = payment_count + 1,
    largest_payment_cents = greatest(largest_payment_cents, p_amount_cents),
    paid_startups = (select count(*) from public.listings where lifetime_spend_cents > 0),
    updated_at = now()
  where singleton;
  insert into public.daily_metrics(metric_date, revenue_cents, climbs)
  values ((p_occurred_at at time zone 'utc')::date, p_amount_cents, 1)
  on conflict (metric_date) do update set revenue_cents = public.daily_metrics.revenue_cents + p_amount_cents, climbs = public.daily_metrics.climbs + 1, updated_at = now();
  update public.webhook_events set status = 'processed', processed_at = now() where id = v_webhook_id;

  return jsonb_build_object('duplicate', false, 'listing_id', v_listing.id, 'displaced_listing_id', case when v_new_rank = 1 then v_previous_summit_id end, 'old_rank', v_old_rank, 'new_rank', v_new_rank, 'season_id', v_season_id);
end;
$$;
