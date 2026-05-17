const BASE = process.env.NEXT_PUBLIC_IMAGE_BASE ?? "/images";

// General-purpose image URL: imageUrl("posters/AFNOMTN.webp"), imageUrl("heroes/foo.webp"), etc.
export const imageUrl = (path: string) => `${BASE}/${path}`;

// Sugar for the common case (today's only consumer).
export const posterUrl = (id: string) => imageUrl(`posters/${id}.webp`);
