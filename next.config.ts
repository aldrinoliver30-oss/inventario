import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    // Rutas viejas /productos/<id> → rutas fijas con ?id= (SPEC 02).
    // El patrón excluye las páginas reales: nuevo, ver y editar.
    const id = ":id((?!nuevo$|ver$|editar$)[^/]+)";
    return [
      { source: `/productos/${id}`, destination: "/productos/ver?id=:id", permanent: true },
      { source: `/productos/${id}/editar`, destination: "/productos/editar?id=:id", permanent: true },
    ];
  },
};

export default withSerwist(nextConfig);
