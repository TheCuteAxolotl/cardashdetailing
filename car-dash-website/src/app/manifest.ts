import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/owner/dashboard",
    name: "Car Dash Detailing — Owner",
    short_name: "Car Dash",
    description: "Car Dash business dashboard, bookings, messages, and notifications.",
    start_url: "/owner/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#101010",
    theme_color: "#101010",
    icons: [
      { src: "/favicon.png", sizes: "any", type: "image/png", purpose: "any" },
    ],
  };
}
