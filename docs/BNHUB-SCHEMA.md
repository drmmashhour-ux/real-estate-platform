# BNHub Database Schema

Mapping between **logical table names** (spec) and **Prisma models** (implementation). The application uses Prisma with camelCase model names; you can add `@@map("table_name")` to each model to use snake_case table names in PostgreSQL.

---

## users

| Column     | Prisma (User) |
|-----------|----------------|
| id        | id             |
| name      | name           |
| email     | email          |
| role      | role (PlatformRole) |
| created_at| createdAt      |

Model: `User`. Add `@@map("users")` if you want the table named `users`.

---

## bnhub_listings

| Column               | Prisma (ShortTermListing) |
|----------------------|---------------------------|
| id                   | id                        |
| host_id              | ownerId                   |
| title                | title                     |
| description          | description               |
| property_type        | propertyType              |
| room_type            | roomType                  |
| address              | address                   |
| city                 | city                      |
| country              | country                   |
| latitude             | latitude                  |
| longitude            | longitude                 |
| max_guests           | maxGuests                 |
| bedrooms             | bedrooms                  |
| beds                 | beds                      |
| bathrooms            | baths                     |
| nightly_price        | nightPriceCents (cents)   |
| cleaning_fee         | cleaningFeeCents          |
| security_deposit     | securityDepositCents     |
| minimum_stay         | minStayNights             |
| maximum_stay         | maxStayNights             |
| instant_book_enabled | instantBookEnabled        |
| cancellation_policy  | cancellationPolicy       |
| status               | listingStatus             |
| created_at           | createdAt                 |
| updated_at           | updatedAt                 |

Model: `ShortTermListing`. Optional: `@@map("bnhub_listings")`.

---

## bnhub_listing_photos

| Column     | Prisma (BnhubListingPhoto) |
|------------|----------------------------|
| id         | id                         |
| listing_id | listingId                  |
| photo_url  | url                        |
| is_cover   | isCover                    |
| sort_order | sortOrder                  |

Model: `BnhubListingPhoto`. Optional: `@@map("bnhub_listing_photos")`.

---

## bnhub_availability

| Column        | Prisma (AvailabilitySlot) |
|---------------|---------------------------|
| id            | id                        |
| listing_id    | listingId                 |
| date          | date                      |
| is_available  | available                 |
| price_override| priceOverrideCents        |

Model: `AvailabilitySlot`. Optional: `@@map("bnhub_availability")`.

---

## bnhub_bookings

| Column      | Prisma (Booking)   |
|-------------|--------------------|
| id          | id                 |
| listing_id  | listingId          |
| guest_id    | guestId            |
| check_in    | checkIn            |
| check_out   | checkOut           |
| guests      | (derived from listing maxGuests; nights stored) |
| subtotal    | totalCents         |
| fees        | guestFeeCents, hostFeeCents |
| total_price | payment.amountCents |
| status      | status (BookingStatus) |
| created_at  | createdAt          |

Model: `Booking`. Optional: `@@map("bnhub_bookings")`.

---

## bnhub_reviews

| Column      | Prisma (Review) |
|-------------|-----------------|
| id          | id              |
| listing_id  | listingId       |
| booking_id  | bookingId       |
| reviewer_id | guestId         |
| rating      | propertyRating  |
| comment     | comment         |
| created_at  | createdAt       |

Model: `Review`. Optional: `@@map("bnhub_reviews")`.

---

## bnhub_messages

| Column      | Prisma (BookingMessage) |
|-------------|--------------------------|
| id          | id                       |
| booking_id  | bookingId                |
| sender_id   | senderId                 |
| message     | body                     |
| created_at  | createdAt                |

Model: `BookingMessage`. Optional: `@@map("bnhub_messages")`.

---

## payments

Stored in `Payment` model: bookingId, amountCents, guestFeeCents, hostFeeCents, hostPayoutCents, status, stripePaymentId. Optional: `@@map("payments")`.

---

## Adding @@map for snake_case tables

To use the exact table names above in PostgreSQL, add to each model in `prisma/schema.prisma`:

```prisma
model ShortTermListing {
  // ... fields ...
  @@map("bnhub_listings")
}

model BnhubListingPhoto {
  // ...
  @@map("bnhub_listing_photos")
}

model AvailabilitySlot {
  // ...
  @@map("bnhub_availability")
}

model Booking {
  // ...
  @@map("bnhub_bookings")
}

model Review {
  // ...
  @@map("bnhub_reviews")
}

model BookingMessage {
  // ...
  @@map("bnhub_messages")
}
```

Then run `npx prisma migrate dev` to generate a migration. If you have existing data, the migration may rename tables; backup first.
