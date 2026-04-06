-- Transaction-safe guest booking creation (single DB round-trip, listing row locked).
-- Run after `supabase-listings.sql` and `supabase-bookings-user-id.sql`.
-- Only the service role should call this from apps/web (see GRANT at bottom).

DROP FUNCTION IF EXISTS public.create_guest_booking(uuid, jsonb, text);
DROP FUNCTION IF EXISTS public.create_guest_booking(uuid, jsonb, text, uuid);

CREATE OR REPLACE FUNCTION public.create_guest_booking(
  p_listing_id uuid,
  p_selected_dates jsonb,
  p_guest_email text,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  booking_id uuid,
  out_title text,
  out_total numeric,
  out_nights int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_title text;
  v_price numeric;
  v_n int;
  v_total numeric;
  v_new_id uuid;
  v_overlap boolean;
  v_d date;
  v_prev date;
  v_i int;
  v_len int;
  v_t text;
  v_now timestamptz := now();
BEGIN
  IF p_guest_email IS NULL OR length(trim(p_guest_email)) < 4 THEN
    RAISE EXCEPTION 'invalid_guest_email';
  END IF;

  SELECT l.title, l.price_per_night
  INTO v_listing_title, v_price
  FROM public.listings l
  WHERE l.id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;

  IF v_price IS NULL OR v_price < 0 OR v_price <> v_price THEN
    RAISE EXCEPTION 'invalid_listing_price';
  END IF;

  IF p_selected_dates IS NULL OR jsonb_typeof(p_selected_dates) <> 'array' THEN
    RAISE EXCEPTION 'invalid_dates';
  END IF;

  v_len := jsonb_array_length(p_selected_dates);
  IF v_len IS NULL OR v_len < 1 THEN
    RAISE EXCEPTION 'empty_dates';
  END IF;

  v_prev := NULL;
  FOR v_i IN 0..(v_len - 1) LOOP
    v_t := p_selected_dates ->> v_i;
    IF v_t IS NULL OR trim(v_t) !~ '^\d{4}-\d{2}-\d{2}$' THEN
      RAISE EXCEPTION 'invalid_date_format';
    END IF;
    v_d := trim(v_t)::date;
    IF v_prev IS NULL THEN
      v_prev := v_d;
    ELSE
      IF v_d <> (v_prev + interval '1 day')::date THEN
        RAISE EXCEPTION 'dates_not_consecutive';
      END IF;
      v_prev := v_d;
    END IF;
  END LOOP;

  v_n := v_len;
  v_total := round((v_price * v_n)::numeric, 2);

  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    CROSS JOIN LATERAL jsonb_array_elements_text(b.dates) AS eb(d)
    CROSS JOIN LATERAL jsonb_array_elements_text(p_selected_dates) AS nc(d)
    WHERE b.listing_id = p_listing_id
      AND lower(trim(coalesce(b.status, ''))) NOT IN ('canceled', 'cancelled')
      AND eb.d = nc.d
  )
  INTO v_overlap;

  IF v_overlap THEN
    RAISE EXCEPTION 'dates_unavailable';
  END IF;

  INSERT INTO public.bookings (
    listing_id,
    dates,
    total_price,
    guest_email,
    status,
    updated_at,
    user_id
  )
  VALUES (
    p_listing_id,
    p_selected_dates,
    v_total,
    lower(trim(p_guest_email)),
    'pending',
    v_now,
    p_user_id
  )
  RETURNING id INTO v_new_id;

  booking_id := v_new_id;
  out_title := COALESCE(NULLIF(trim(v_listing_title), ''), 'BNHub stay');
  out_total := v_total;
  out_nights := v_n;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.create_guest_booking(uuid, jsonb, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_guest_booking(uuid, jsonb, text, uuid) TO service_role;
