import { buildBookingDocument, type BookingSlot, type BookingStatus, type BookingTimeSlot } from "@/lib/booking";
import type { Booking, NormalizableDate } from "@/lib/booking";
export type { Booking } from "@/lib/booking";

export interface Venue {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  location: string;
  image: string;
  category: "Hall" | "Studio" | "Outdoor" | "Office";
  amenities: string[];
  createdAt?: NormalizableDate;
  updatedAt?: NormalizableDate;
  isArchived?: boolean;
  archivedAt?: NormalizableDate;
}

export const venues: Venue[] = [
  {
    id: "1",
    name: "The Grand Atrium",
    description: "The Grand Atrium is our flagship event space, offering a majestic 20ft ceiling height that creates an immediate sense of scale and luxury. Spanning over 5,000 square feet, this venue is characterized by its stunning floor-to-ceiling windows that bathe the interior in natural light, complemented by exquisite Italian marble flooring. It is the definitive choice for high-profile corporate launches, gala dinners, and sophisticated wedding receptions. The space includes a built-in state-of-the-art acoustic system and integrated LED lighting setups to transform the atmosphere according to your brand's palette.",
    price: 5000,
    capacity: 300,
    location: "Kuala Lumpur City Centre",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80",
    category: "Hall",
    amenities: ["Valet Parking", "Audio System", "Stage", "Catering Service", "VIP Holding Room", "Fiber WIFI"],
  },
  {
    id: "2",
    name: "Lumina Studio",
    description: "Lumina Studio is a raw, industrial-minimalist concrete space designed specifically for the creative community. With its neutral grey tones and high-exposure natural lighting, it serves as a perfect blank canvas for photography sessions, fashion shoots, and contemporary art exhibitions. The acoustic treatment within the walls makes it equally suitable for intimate music recordings or podcast sessions. Situated in the heart of Bangsar South, it provides a professional yet relaxed environment for workshops and brainstorming sessions that require a break from the traditional office setting.",
    price: 1500,
    capacity: 50,
    location: "Bangsar South",
    image: "https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?auto=format&fit=crop&q=80",
    category: "Studio",
    amenities: ["Natural Light", "WIFI", "Coffee Station", "Backdrop Kit", "Changing Room", "Air Conditioning"],
  },
  {
    id: "3",
    name: "The Emerald Garden",
    description: "The Emerald Garden is an enchanting open-air sanctuary that seamlessly blends tropical greenery with modern structural elements. This garden oasis features a paved central plaza surrounded by curated exotic plants and subtle accent lighting, making it ideal for romantic sunset weddings, garden parties, and outdoor corporate mixers. The venue is equipped with weather-proof power outlets and a dedicated catering prep area to ensure smooth operations. At night, the garden transforms with thousands of fairy lights, creating a magical atmosphere that requires minimal additional decoration.",
    price: 3500,
    capacity: 200,
    location: "Mont Kiara",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80",
    category: "Outdoor",
    amenities: ["Outdoor Bar", "Night Lighting", "Generator Support", "Private Restrooms", "Mist Cooling System", "Sound System"],
  },
  {
    id: "4",
    name: "Summit Boardroom",
    description: "The Summit Boardroom redefined the executive meeting experience. Featuring panoramic views of the KL skyline, this high-tech space is equipped with 4K video conferencing facilities, integrated tablet controls for room automation, and ergonomic Herman Miller seating. The acoustic privacy glass ensures absolute confidentiality for high-stakes board meetings, strategic planning sessions, or private investor pitches. Every detail, from the solid oak table to the dedicated concierge service, is designed to facilitate focus and decision-making at the highest level.",
    price: 800,
    capacity: 12,
    location: "KL Eco City",
    image: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&q=80",
    category: "Office",
    amenities: ["Smart TV", "Video Conf", "Whiteboard", "Catering", "Private Entrance", "Nespresso Station"],
  },
  {
    id: "5",
    name: "The Velvet Lounge",
    description: "The Velvet Lounge is an intimate, jazz-inspired space that exudes warmth and exclusivity. With its plush velvet seating, ambient warm lighting, and a handcrafted mahogany bar, it's the perfect setting for upscale cocktail parties, album launches, or networking events. The space features a modular stage area suitable for acoustic performances or guest speakers. The lounge's sophisticated vibe is matched by its high-quality sound system, ensuring that whether it's background jazz or a lively presentation, the audio quality is flawless and immersive.",
    price: 2500,
    capacity: 80,
    location: "Bukit Bintang",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80",
    category: "Studio",
    amenities: ["Full Bar", "Sound System", "Mood Lighting", "Security", "Modular Stage", "VIP Corner"],
  },
  {
    id: "6",
    name: "Sky Pavilion",
    description: "The Sky Pavilion offers a breathtaking rooftop experience with an unobstructed 360-degree view of the metropolitan skyline. This versatile outdoor-indoor hybrid space features a spacious open deck and a modern glass-enclosed pavilion, providing flexibility regardless of weather conditions. It is specifically designed for high-end brand activations, product launches, and exclusive social mixers. Equipped with a professional DJ booth area and integrated atmospheric lighting, it provides a high-energy yet premium environment for events that want to make a lasting impression from the top of the city.",
    price: 4500,
    capacity: 150,
    location: "Damansara Heights",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80",
    category: "Outdoor",
    amenities: ["Panoramic View", "Outdoor Kitchen", "DJ Booth", "Elevator Access", "Glass Pavilion", "Mood Lighting"],
  },
];

type BookingSeedInput = {
  id: string;
  referenceId: string;
  venueId: string;
  venueName: string;
  venuePrice: number;
  guests: number;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  reservation: {
    startDate: string;
    endDate?: string | null;
    dayCount: number;
    timeSlot: BookingTimeSlot;
    dailySchedule: Record<string, BookingSlot>;
  };
  pricing?: {
    currency?: string;
    serviceFeeAmount?: number;
    depositAmount?: number;
    refundAmount?: number;
    totalAmount?: number;
  };
  status: BookingStatus;
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  statusUpdatedAt?: string;
  cancelledBy?: "customer" | "admin";
  cancelReason?: string;
  rescheduledFromBookingId?: string;
  replacementBookingId?: string;
};

const createBookingSeed = (input: BookingSeedInput): Booking => {
  const createdAt = new Date(input.createdAt);
  const updatedAt = new Date(input.updatedAt ?? input.statusUpdatedAt ?? input.approvedAt ?? input.rejectedAt ?? input.createdAt);
  const approvedAt = input.approvedAt ? new Date(input.approvedAt) : undefined;
  const rejectedAt = input.rejectedAt ? new Date(input.rejectedAt) : undefined;
  const cancelledAt = input.cancelledAt ? new Date(input.cancelledAt) : undefined;
  const statusUpdatedAt = new Date(input.statusUpdatedAt ?? input.approvedAt ?? input.rejectedAt ?? input.createdAt);

  const booking = buildBookingDocument(
    {
      venueId: input.venueId,
      venueName: input.venueName,
      guests: input.guests,
      customer: input.customer,
      reservation: input.reservation,
      pricing: input.pricing,
      status: input.status,
    },
    {
      venueId: input.venueId,
      venueName: input.venueName,
      venuePrice: input.venuePrice,
      referenceId: input.referenceId,
      status: input.status,
      createdAt,
    }
  );

  return {
    id: input.id,
    ...booking,
    lifecycle: {
      ...booking.lifecycle,
      status: input.status,
      createdAt,
      updatedAt,
      approvedAt,
      rejectedAt,
      cancelledAt,
      statusUpdatedAt,
      cancelledBy: input.cancelledBy,
      cancelReason: input.cancelReason,
      rescheduledFromBookingId: input.rescheduledFromBookingId,
      replacementBookingId: input.replacementBookingId,
    },
    status: input.status,
    createdAt,
    updatedAt,
    approvedAt,
    rejectedAt,
    cancelledAt,
    statusUpdatedAt,
  };
};

export const bookings: Booking[] = [
  createBookingSeed({
    id: "booking-grand-atrium-launch-2025",
    referenceId: "#ES-20250318-481",
    venueId: "1",
    venueName: "The Grand Atrium",
    venuePrice: 5000,
    guests: 220,
    customer: {
      name: "Alicia Tan",
      email: "alicia.tan@northstar.com",
      phone: "0123456789",
    },
    reservation: {
      startDate: "2025-03-18",
      endDate: "2025-03-20",
      dayCount: 3,
      timeSlot: "custom",
      dailySchedule: {
        "2025-03-18": "morning",
        "2025-03-19": "full",
        "2025-03-20": "evening",
      },
    },
    pricing: {
      depositAmount: 2000,
    },
    status: "approved",
    createdAt: "2025-02-08T09:15:00+08:00",
    approvedAt: "2025-02-10T14:30:00+08:00",
    statusUpdatedAt: "2025-02-10T14:30:00+08:00",
  }),
  createBookingSeed({
    id: "booking-lumina-workshop-pending-2025",
    referenceId: "#ES-20250402-214",
    venueId: "2",
    venueName: "Lumina Studio",
    venuePrice: 1500,
    guests: 32,
    customer: {
      name: "Bernard Lee",
      email: "bernard.lee@kineticmedia.my",
      phone: "0112233445",
    },
    reservation: {
      startDate: "2025-04-02",
      endDate: "2025-04-03",
      dayCount: 2,
      timeSlot: "custom",
      dailySchedule: {
        "2025-04-02": "morning",
        "2025-04-03": "evening",
      },
    },
    pricing: {
      depositAmount: 300,
    },
    status: "pending",
    createdAt: "2025-03-11T11:00:00+08:00",
  }),
  createBookingSeed({
    id: "booking-emerald-garden-wedding-rejected-2024",
    referenceId: "#ES-20241109-673",
    venueId: "3",
    venueName: "The Emerald Garden",
    venuePrice: 3500,
    guests: 160,
    customer: {
      name: "Bernard Lee",
      email: "bernard.lee@kineticmedia.my",
      phone: "0112233445",
    },
    reservation: {
      startDate: "2024-11-09",
      endDate: "2024-11-10",
      dayCount: 2,
      timeSlot: "custom",
      dailySchedule: {
        "2024-11-09": "full",
        "2024-11-10": "morning",
      },
    },
    pricing: {
      depositAmount: 1000,
      refundAmount: 1000,
      totalAmount: 0,
    },
    status: "rejected",
    createdAt: "2024-10-01T10:40:00+08:00",
    rejectedAt: "2024-10-06T16:20:00+08:00",
    statusUpdatedAt: "2024-10-06T16:20:00+08:00",
  }),
  createBookingSeed({
    id: "booking-emerald-garden-reschedule-cancelled-2025",
    referenceId: "#ES-20250329-402",
    venueId: "3",
    venueName: "The Emerald Garden",
    venuePrice: 3500,
    guests: 145,
    customer: {
      name: "Alicia Tan",
      email: "alicia.tan@northstar.com",
      phone: "0123456789",
    },
    reservation: {
      startDate: "2025-03-29",
      endDate: "2025-03-30",
      dayCount: 2,
      timeSlot: "custom",
      dailySchedule: {
        "2025-03-29": "morning",
        "2025-03-30": "full",
      },
    },
    pricing: {
      depositAmount: 1000,
      refundAmount: 7160,
      totalAmount: 0,
    },
    status: "cancelled",
    createdAt: "2025-02-18T10:15:00+08:00",
    cancelledAt: "2025-03-12T09:45:00+08:00",
    statusUpdatedAt: "2025-03-12T09:45:00+08:00",
    cancelledBy: "customer",
    cancelReason: "Customer rescheduled to a later date",
    replacementBookingId: "booking-emerald-garden-reschedule-new-2025",
  }),
  createBookingSeed({
    id: "booking-summit-boardroom-quarterly-2024",
    referenceId: "#ES-20240912-118",
    venueId: "4",
    venueName: "Summit Boardroom",
    venuePrice: 800,
    guests: 10,
    customer: {
      name: "Nadia Razak",
      email: "nadia.razak@ascentgroup.my",
      phone: "0126677889",
    },
    reservation: {
      startDate: "2024-09-12",
      dayCount: 1,
      timeSlot: "morning",
      dailySchedule: {
        "2024-09-12": "morning",
      },
    },
    pricing: {
      depositAmount: 200,
    },
    status: "approved",
    createdAt: "2024-08-20T08:45:00+08:00",
    approvedAt: "2024-08-22T09:10:00+08:00",
    statusUpdatedAt: "2024-08-22T09:10:00+08:00",
  }),
  createBookingSeed({
    id: "booking-velvet-lounge-refund-2025",
    referenceId: "#ES-20250214-552",
    venueId: "5",
    venueName: "The Velvet Lounge",
    venuePrice: 2500,
    guests: 74,
    customer: {
      name: "Alicia Tan",
      email: "alicia.tan@northstar.com",
      phone: "0123456789",
    },
    reservation: {
      startDate: "2025-02-14",
      endDate: "2025-02-15",
      dayCount: 2,
      timeSlot: "custom",
      dailySchedule: {
        "2025-02-14": "full",
        "2025-02-15": "evening",
      },
    },
    pricing: {
      depositAmount: 800,
      refundAmount: 450,
    },
    status: "approved",
    createdAt: "2025-01-05T13:20:00+08:00",
    approvedAt: "2025-01-08T10:00:00+08:00",
    statusUpdatedAt: "2025-01-08T10:00:00+08:00",
  }),
  createBookingSeed({
    id: "booking-sky-pavilion-brand-weekend-2025",
    referenceId: "#ES-20250607-908",
    venueId: "6",
    venueName: "Sky Pavilion",
    venuePrice: 4500,
    guests: 120,
    customer: {
      name: "Alicia Tan",
      email: "alicia.tan@northstar.com",
      phone: "0123456789",
    },
    reservation: {
      startDate: "2025-06-07",
      endDate: "2025-06-08",
      dayCount: 2,
      timeSlot: "custom",
      dailySchedule: {
        "2025-06-07": "morning",
        "2025-06-08": "full",
      },
    },
    pricing: {
      depositAmount: 1500,
    },
    status: "approved",
    createdAt: "2025-05-02T15:50:00+08:00",
    approvedAt: "2025-05-05T09:25:00+08:00",
    statusUpdatedAt: "2025-05-05T09:25:00+08:00",
  }),
];
