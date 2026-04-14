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
}

export const venues: Venue[] = [
  {
    id: "1",
    name: "The Grand Atrium",
    description: "A majestic space with 20ft ceilings, perfect for galas and corporate launch events. Features floor-to-ceiling windows and marble flooring.",
    price: 5000,
    capacity: 300,
    location: "Kuala Lumpur City Centre",
    image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80",
    category: "Hall",
    amenities: ["Valet Parking", "Audio System", "Stage", "Catering Service"],
  },
  {
    id: "2",
    name: "Lumina Studio",
    description: "A minimalist, industrial concrete studio designed for creative workshops, photo shoots, and intimate exhibitions.",
    price: 1500,
    capacity: 50,
    location: "Bangsar South",
    image: "https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?auto=format&fit=crop&q=80",
    category: "Studio",
    amenities: ["Natural Light", "WIFI", "Coffee Station", "Backdrop Kit"],
  },
  {
    id: "3",
    name: "The Emerald Garden",
    description: "An open-air garden oasis surrounded by tropical greenery. Ideal for sunset weddings and garden parties.",
    price: 3500,
    capacity: 200,
    location: "Mont Kiara",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80",
    category: "Outdoor",
    amenities: ["Outdoor Bar", "Night Lighting", "Generator Support", "Private Restrooms"],
  },
];
