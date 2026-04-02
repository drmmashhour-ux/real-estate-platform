export type MobileTrip = {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  confirmationCode: string | null;
  totalCents: number;
  guestFeeCents: number;
  paymentStatus: string | null;
  listing: {
    id: string;
    title: string;
    city: string | null;
    photo: string | null;
    nightPriceCents: number | null;
  };
};

export type MobileNotification = {
  id: string;
  title: string;
  message: string | null;
  type: string;
  status: string;
  priority: string;
  actionUrl: string | null;
  actionLabel: string | null;
  createdAt: string;
};

export type MobileAccount = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  homeCity: string | null;
  homeRegion: string | null;
  homeCountry: string | null;
  createdAt: string;
  unreadReservationNotifications: number;
};

export type MobileBookingDetail = {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  confirmationCode: string | null;
  totalCents: number;
  guestFeeCents: number;
  hostFeeCents: number | null;
  paymentStatus: string | null;
  paymentReceiptUrl: string | null;
  invoiceId: string | null;
  checkinDetails: {
    instructions: string | null;
    keyInfo: string | null;
    accessType: string | null;
  } | null;
  listing: {
    id: string;
    title: string;
    city: string | null;
    listingCode: string | null;
    photo: string | null;
  };
  services: Array<{
    id: string;
    name: string;
    quantity: number;
    totalPriceCents: number;
    status: string;
  }>;
  timeline: Array<{
    id: string;
    eventType: string;
    createdAt: string;
    payload: unknown;
  }>;
};

export type MobileBookingMessage = {
  id: string;
  body: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

export type MobileDispute = {
  id: string;
  status: string;
  complaintCategory: string | null;
  urgencyLevel: string | null;
  description: string;
  createdAt: string;
  resolutionNotes?: string | null;
  refundCents?: number | null;
  resolutionOutcome?: string | null;
};
