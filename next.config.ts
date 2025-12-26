/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            // Aumentamos el límite del cuerpo de la petición
            bodySizeLimit: '10mb', 
        },
    },
    // ... otras configuraciones que ya tengas
};

export default nextConfig;