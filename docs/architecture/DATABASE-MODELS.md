# LECIPM — Database Models Overview

Relational models and indexing strategy across the platform. Implementations live in each service’s Prisma schema (and in `apps/web/prisma` for BNHub); this doc is the canonical overview.

---

## 1. Identity and auth (auth-service)

| Model | Purpose | Key fields | Indexes |
|-------|---------|------------|---------|
| **User** | Core identity | id, email, passwordHash, name, phone, locale, verificationStatus, suspendedAt, lastLoginAt | email (unique) |
| **UserRole** | RBAC | userId, role (GUEST, HOST, BROKER, OWNER, ADMIN, SUPPORT) | userId, (userId, role) unique |
| **UserSession** | Refresh tokens | userId, tokenHash, expiresAt | userId, tokenHash, expiresAt |
| **PasswordResetToken** | Forgot/reset flow | userId, tokenHash, expiresAt, usedAt | tokenHash, userId, expiresAt |

---

## 2. User profiles (user-service)

| Model | Purpose | Key fields | Indexes |
|-------|---------|------------|---------|
| **User** (shared) | Profile data | id, name, settings | — |
| **UserSettings** | Preferences | userId, notifications, locale, etc. | userId |

---

## 3. Listings (listing-service)

| Model | Purpose | Key fields | Indexes |
|-------|---------|------------|---------|
| **Property** | Listing | ownerId, type, status, title, address, city, country, nightlyPriceCents, maxGuests, etc. | ownerId, status, type, (city, country) |
| **PropertyImage** | Media | propertyId, url, type, sortOrder | propertyId |
| **PropertyAmenity** | Amenities | propertyId, amenityKey | propertyId, (propertyId, amenityKey) unique |

---

## 4. Search (search-service)

Read-only views or same tables as listing-service; composite indexes for:

- (status, city, country), (status, nightlyPriceCents), (status, maxGuests), (status, propertyType), (status, latitude, longitude).

---

## 5. BNHub / Bookings (booking-service, web-app)

| Model | Purpose | Key fields | Indexes |
|-------|---------|------------|---------|
| **ShortTermListing** | BNHub listing | ownerId, title, nightPriceCents, maxGuests, verificationStatus | ownerId, (city, verificationStatus) |
| **AvailabilitySlot** | Calendar | listingId, date, available | listingId, date, (listingId, date) unique |
| **Booking** | Reservation | guestId, listingId, checkIn, checkOut, nights, totalCents, status, checkedInAt, checkedOutAt | guestId, listingId, status, checkIn |
| **Payment** | Booking payment | bookingId, amountCents, status, stripePaymentId | bookingId unique |

---

## 6. Payments (payment-service)

| Model | Purpose | Key fields | Indexes |
|-------|---------|------------|---------|
| **Payment** | Same as above | — | — |
| **PaymentIntent** | Escrow hold | bookingId, paymentId, amountCents, providerIntentId, status | bookingId, status |
| **Transaction** | Audit log | type, paymentId, amountCents, providerRef, createdAt | paymentId, type, createdAt |
| **Payout** | Host payout batch | hostId, totalCents, status, providerPayoutId | hostId, status |
| **PayoutPayment** | Payout ↔ Payment | payoutId, paymentId | (payoutId, paymentId) PK |

---

## 7. Messaging (messaging-service)

| Model | Purpose | Key fields | Indexes |
|-------|---------|------------|---------|
| **Conversation** | Thread | id, createdAt, updatedAt | updatedAt |
| **ConversationParticipant** | Membership + read state | conversationId, userId, lastReadAt | userId, conversationId, (conversationId, userId) unique |
| **Message** | Message body | conversationId, senderId, body, createdAt | conversationId, (conversationId, createdAt), senderId |
| **MessageAttachment** | Attachments | messageId, url, type, filename | messageId |

---

## 8. Reviews (review-service)

| Model | Purpose | Key fields | Indexes |
|-------|---------|------------|---------|
| **Review** | Guest review | bookingId, guestId, listingId, propertyRating, hostRating, comment, status, moderatedAt | listingId, guestId, status, createdAt |

---

## 9. Trust & Safety (trust-safety)

| Model | Purpose | Key fields | Indexes |
|-------|---------|------------|---------|
| **Incident** | User report | reporterId, reportedUserId, reportedListingId, type, description, status, priority | reporterId, reportedUserId, reportedListingId, status, createdAt |
| **Flag** | Quick flag | flaggerId, targetType, targetId, reason, status | flaggerId, (targetType, targetId), status, createdAt |
| **Suspension** | Account/listing suspension | targetType, targetId, reason, status, expiresAt, suspendedById | (targetType, targetId), status, suspendedAt, expiresAt |

---

## 10. Relationships (high level)

- **User** → UserRole, UserSession, PasswordResetToken; creator of listings, bookings, messages, reviews, incidents, flags.
- **Property / ShortTermListing** → PropertyImage, PropertyAmenity; Booking; Review.
- **Booking** → Payment, Review (1:1).
- **Conversation** → ConversationParticipant, Message; Message → MessageAttachment.
- **Payment** → PaymentIntent, Transaction, PayoutPayment ← Payout.

---

## Indexing strategy

- **Unique** where business rules require it: (listingId, date) for availability, (conversationId, userId) for participants, bookingId for payment.
- **Foreign keys** and **filters** used in queries: status, userId, listingId, conversationId, createdAt for sort/pagination.
- **Composite** for list + filter: e.g. (status, city, country) for search, (conversationId, createdAt) for messages.

See each service’s `prisma/schema.prisma` for the exact definitions and `@@map` table names where they differ from model names.
