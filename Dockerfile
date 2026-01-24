# Usa la imagen oficial de Bun
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Instala dependencias del sistema necesarias para sharp
RUN apt-get update && apt-get install -y libvips-dev && rm -rf /var/lib/apt/lists/*

# install dependencies into temp directory
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb* /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# copy node_modules from temp directory
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Expone los puertos (Vite usa 5173, servidor backend usa 3001)
EXPOSE 5173 3001

# Comando para ejecutar el proyecto en modo desarrollo
CMD ["bun", "run", "dev"]