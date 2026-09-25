import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nest — family & nanny",
    short_name: "Nest",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8f1",
    theme_color: "#fff8f1",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
