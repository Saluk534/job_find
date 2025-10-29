# ---------- Build Stage ----------
    FROM node:18-bullseye-slim AS build
    WORKDIR /app
    
    # Copy package info and install dependencies
    COPY package*.json ./
    RUN npm ci
    
    # Copy the rest of the project and build
    COPY . .
    RUN npm run build
    
    # ---------- Runtime Stage ----------
    FROM nginx:alpine AS runner
    WORKDIR /usr/share/nginx/html
    
    # Copy built assets from previous stage
    COPY --from=build /app/dist ./
    
    # Optional: custom nginx config (see below)
    # COPY nginx.conf /etc/nginx/conf.d/default.conf
    
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]
    