// Visual-only placeholder fields for design fidelity to the imported mockup.
// Business/Service have no photo, rating, or review fields in the real schema —
// these are fixed (not random), decorative values, not real data about any business.

const PHOTOS = [
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=900&q=80',
  'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=900&q=80',
  'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=900&q=80',
];
const RATINGS = [4.9, 4.8, 5.0, 4.7, 4.9, 4.8];
const REVIEW_COUNTS = [212, 178, 96, 140, 64, 88];
const DISTANCES = ['0.8 km', '1.4 km', '2.1 km', '0.6 km', '1.9 km', '1.1 km'];
const NEXT_AVAILABLE = ['Hoy 15:30', 'Hoy 19:00', 'Mañana 09:00', 'Hoy disponible', 'Hoy 17:00'];
const AMENITIES = ['Iluminación LED', 'Vestuarios', 'Estacionamiento', 'Alquiler de balones'];

export interface PlaceholderListing {
  photo: string;
  rating: number;
  reviews: number;
  distance: string;
  nextAvailable: string;
  categoryLabel: string;
  amenities: string[];
}

export function placeholderListing(businessId: string, index: number): PlaceholderListing {
  return {
    photo: PHOTOS[index % PHOTOS.length],
    rating: RATINGS[index % RATINGS.length],
    reviews: REVIEW_COUNTS[index % REVIEW_COUNTS.length],
    distance: DISTANCES[index % DISTANCES.length],
    nextAvailable: NEXT_AVAILABLE[index % NEXT_AVAILABLE.length],
    categoryLabel: 'Cancha deportiva',
    amenities: AMENITIES,
  };
}

export const CATEGORY_PILLS = [
  'Todos',
  'Belleza',
  'Deporte',
  'Salud',
  'Estudios',
  'Bienestar',
  'Espacios',
  'Experiencias',
];

// Fixed x/y percentage positions for the decorative map — no real geocoding exists.
const MAP_POSITIONS: [number, number][] = [
  [38, 42],
  [66, 30],
  [24, 62],
  [52, 54],
  [72, 64],
  [44, 36],
];

export function placeholderMapPosition(index: number): { x: number; y: number } {
  const [x, y] = MAP_POSITIONS[index % MAP_POSITIONS.length];
  return { x, y };
}
