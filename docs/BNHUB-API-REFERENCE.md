# BNHub API Reference

REST APIs for the BNHub short-term rental module. All under `/api/bnhub/` unless noted.

---

## Listings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/bnhub/listings/create | Create listing (session = host). Body: title, address, city, country, nightPriceCents, beds, baths, maxGuests, photos[], optional: description, propertyType, roomType, cleaningFeeCents, securityDepositCents, instantBookEnabled, minStayNights, maxStayNights, cancellationPolicy, etc. |
| GET | /api/bnhub/listings | Search. Query: city, checkIn, checkOut, guests, minPrice, maxPrice, propertyType, roomType, instantBook, verifiedOnly, sort |
| GET | /api/bnhub/listings/:id | Get one listing |
| PUT | /api/bnhub/listings/:id | Update listing (same body shape as create, partial) |
| PATCH | /api/bnhub/listings/:id | Same as PUT |
| GET | /api/bnhub/listings/:id/photos | List photos (ordered, with cover) |
| POST | /api/bnhub/listings/:id/photos | Set/replace photos. Body: { photos: [{ url, sortOrder?, isCover? }] } |

---

## Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/bnhub/search | Search listings. Query: location (or city), checkIn, checkOut, guests, minPrice, maxPrice, propertyType, roomType, instantBook, verifiedOnly, sort |

---

## Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/bnhub/bookings | Create booking. Body: listingId, checkIn, checkOut, guestNotes? |
| GET | /api/bnhub/bookings/:id | Get booking (guest or host) |
| POST | /api/stripe/checkout | Start booking payment; confirmed via `/api/stripe/webhook` only |
| POST | /api/bnhub/bookings/:id/approve | Host approve request |
| POST | /api/bnhub/bookings/:id/decline | Host decline. Body: { reason? } |
| POST | /api/bnhub/bookings/:id/cancel | Cancel. Body: { by: "guest" \| "host" } |

---

## Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/bnhub/messages | Send message. Body: { bookingId, body } |
| GET | /api/bnhub/messages | List messages. Query: bookingId= |

---

## Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/bnhub/reviews | Create review (completed stay only). Body: bookingId, guestId, listingId, propertyRating, hostRating?, comment?, cleanlinessRating?, etc. |
| GET | /api/bnhub/reviews/:listingId | List reviews for a listing |

---

## Pricing & Availability

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/bnhub/pricing/breakdown | Query: listingId, checkIn, checkOut. Returns full breakdown (nightly, cleaning, tax, service fee, total) |
| GET | /api/bnhub/availability | Query: listingId, start, end. Returns slots |
| POST | /api/bnhub/availability | Body: { listingId, date, available?, priceOverrideCents? } |
| PUT | /api/bnhub/availability | Bulk. Body: { listingId, slots: [{ date, available?, priceOverrideCents? }] } |

---

## Authentication

Use session cookie (e.g. after POST /api/auth/login or /api/auth/register). Listing create, booking create, messages, cancel, approve/decline require the user to be signed in.
