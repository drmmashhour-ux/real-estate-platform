# Booking ops (short)

- **Standard flow**: guest books → host confirms per product rules → payment if online-enabled market.
- **Syria / manual-first**: treat as **request** → host decision → manual payment tracking if enabled → mark received only when verified.
- **Stuck requests**: use host booking UI + notifications; admin can inspect `bookings` and `launch_events`.
