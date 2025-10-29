# ---------- Base ----------
    FROM node:20-bookworm-slim AS base
    WORKDIR /app
    ENV NODE_ENV=production
    RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && rm -rf /var/lib/apt/lists/*
    
    # ---------- Deps (production dependencies) ----------
    FROM base AS deps
    WORKDIR /app
    COPY package.json package-lock.json* ./
    RUN npm ci --omit=dev
    
    # ---------- Build (with dev deps for TypeScript) ----------
    FROM base AS build
    WORKDIR /app
    COPY package.json package-lock.json* ./
    RUN npm ci --include=dev
    COPY tsconfig.json ./
    COPY src ./src
    RUN npx tsc
    
    # ---------- Runner ----------
    FROM node:20-bookworm-slim AS runner
    WORKDIR /app
    ENV NODE_ENV=production
    RUN useradd -m appuser
    USER appuser
    COPY --from=deps /app/node_modules ./node_modules
    COPY --from=build /app/dist ./dist
    COPY package.json ./
    EXPOSE 8000
    CMD ["node", "dist/index.js"]
    