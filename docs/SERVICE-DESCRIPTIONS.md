# Service Descriptions

Base service templates and responsibilities. Implementation lives in `services/*` and/or `apps/web-app/lib` and `apps/web-app/app/api`.

| Service | Purpose | Location |
|--------|---------|----------|
| **AuthService** | Register, login, password reset, session, JWT | services/auth-service, apps/web-app/lib/auth, /api/auth |
| **UsersService** | User CRUD, profile, roles | services/user-service, apps/web-app (User in Prisma) |
| **ListingsService** | Create, update, get, delete listings | services/listing-service, apps/web-app/lib/bnhub/listings |
| **SearchService** | Search by location, price, guests, amenities | services/search-service, apps/web-app/lib/bnhub/listings (searchListings) |
| **BookingsService** | Check availability, create/cancel booking | services/booking-service, apps/web-app/lib/bnhub/booking |
| **PaymentsService** | Payment intent, confirm, payout | services/payment-service, apps/web-app (Payment model, pay route) |
| **MessagingService** | Send message, booking chat | services/messaging-service, apps/web-app/app/api/bnhub/messages |
| **ReviewsService** | Create review, list by listing | services/review-service, apps/web-app/lib/bnhub/reviews |
| **NotificationsService** | Events: new booking, confirmation, cancellation, message, review reminder | apps/web-app/lib/bnhub/notifications |

Each service can include:

- **controllers** — HTTP handlers
- **routes** — Route definitions (Express or route config for Next.js)
- **models** — Domain types (Prisma models in app schema)
- **services** — Business logic
- **validators** — Request validation (Zod/schemas)
- **tests** — Unit/integration tests (Vitest)

Current implementation concentrates BNHub in `apps/web-app` (API routes + lib/bnhub). Standalone services in `services/*` can be evolved for separate deployment.
