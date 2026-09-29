// Up to two uppercase initials from a display name ("Priya Nair" → "PN"),
// shared by the nav user card and the Activity timeline avatars.
export const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
