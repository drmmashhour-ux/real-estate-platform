import { prisma } from "@/lib/db";

export type HotelWithRooms = Awaited<ReturnType<typeof getHotelById>>;
export type RoomWithHotel = Awaited<ReturnType<typeof getRoomById>>;

function parseImages(images: unknown): string[] {
  if (Array.isArray(images)) {
    return images.filter((u): u is string => typeof u === "string");
  }
  return [];
}

export async function searchHotels(params: {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}) {
  const where: { location?: { contains: string; mode: "insensitive" } } = {};
  if (params.location?.trim()) {
    where.location = { contains: params.location.trim(), mode: "insensitive" };
  }

  const hotels = await prisma.hotel.findMany({
    where,
    include: {
      rooms: true,
    },
    orderBy: { name: "asc" },
  });

  let result = hotels.map((h) => ({
    ...h,
    images: parseImages(h.images),
  }));

  if (params.guests != null && params.guests > 0) {
    result = result.map((h) => ({
      ...h,
      rooms: h.rooms.filter((r) => r.capacity >= params.guests!),
    }));
  }

  if (params.checkIn && params.checkOut) {
    const checkIn = new Date(params.checkIn);
    const checkOut = new Date(params.checkOut);
    const withAvailability = await Promise.all(
      result.map(async (hotel) => {
        const availableRooms = [];
        for (const room of hotel.rooms) {
    const overlapping = await prisma.hotelBooking.findFirst({
      where: {
        roomId: room.id,
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    });
          if (!overlapping) availableRooms.push(room);
        }
        return { ...hotel, rooms: availableRooms };
      })
    );
    result = withAvailability.filter((h) => h.rooms.length > 0);
  }

  return result;
}

export async function getHotelById(id: string) {
  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: { rooms: true },
  });
  if (!hotel) return null;
  return { ...hotel, images: parseImages(hotel.images) };
}

export async function getRoomById(id: string) {
  return prisma.room.findUnique({
    where: { id },
    include: { hotel: true },
  });
}

export async function isRoomAvailable(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
) {
  const where = {
    roomId,
    checkIn: { lt: checkOut },
    checkOut: { gt: checkIn },
    ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
  };
  const overlapping = await prisma.hotelBooking.findFirst({ where });
  return !overlapping;
}

export async function createHotelBooking(data: {
  roomId: string;
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
}) {
  return prisma.hotelBooking.create({
    data: {
      roomId: data.roomId,
      guestName: data.guestName,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      totalPrice: data.totalPrice,
    },
  });
}

export async function getHotelBookingsForRoom(roomId: string) {
  return prisma.hotelBooking.findMany({
    where: { roomId },
    orderBy: { checkIn: "desc" },
  });
}

export async function getAllHotelBookings() {
  return prisma.hotelBooking.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      room: { include: { hotel: true } },
    },
  });
}

export async function getHotelsForDashboard() {
  return prisma.hotel.findMany({
    orderBy: { name: "asc" },
    include: {
      rooms: true,
      _count: { select: { rooms: true } },
    },
  });
}
