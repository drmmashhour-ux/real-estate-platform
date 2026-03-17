/**
 * BNHub request validators (schema stubs). Use Zod/Joi in app.
 */

export const createListingSchema = {
  body: {
    hostId: "string",
    title: "string",
    address: "string",
    city: "string",
    country: "string",
    nightlyPriceCents: "number",
    beds: "number",
    baths: "number",
    maxGuests: "number",
  },
};

export const createBookingSchema = {
  body: {
    listingId: "string",
    guestId: "string",
    checkIn: "string",
    checkOut: "string",
    guests: "number",
  },
};
