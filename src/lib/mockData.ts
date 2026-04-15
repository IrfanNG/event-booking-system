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
  {
    id: "4",
    name: "Summit Boardroom",
    description: "High-tech executive boardroom with ergonomic seating and panoramic city views. Designed for high-stakes meetings.",
    price: 800,
    capacity: 12,
    location: "KL Eco City",
    image: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&q=80",
    category: "Office",
    amenities: ["Smart TV", "Video Conf", "Whiteboard", "Catering"],
  },
  {
    id: "5",
    name: "The Velvet Lounge",
    description: "An intimate, jazz-inspired lounge with plush seating and ambient lighting. Perfect for cocktail hours and networking.",
    price: 2500,
    capacity: 80,
    location: "Bukit Bintang",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80",
    category: "Studio",
    amenities: ["Full Bar", "Sound System", "Mood Lighting", "Security"],
  },
  {
    id: "6",
    name: "Sky Pavilion",
    description: "Rooftop deck with stunning skyline views. A versatile outdoor space for product launches and high-end mixers.",
    price: 4500,
    capacity: 150,
    location: "Damansara Heights",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80",
    category: "Outdoor",
    amenities: ["Panoramic View", "Outdoor Kitchen", "DJ Booth", "Elevator Access"],
  },
];
