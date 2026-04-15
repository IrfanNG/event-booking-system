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
