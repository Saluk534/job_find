FROM node:alpine AS builder 
WORKDIR /app 
COPY package*.json .
RUN npm ci
COPY src ./src
COPY tsconfig.json . 
RUN npm run build 

FROM node:alpine AS build_deps
ENV NODE_ENV=production
COPY package*.json . 
RUN npm ci

FROM node:alpine AS runner 
RUN adduser -D appuser
USER appuser
WORKDIR /app
EXPOSE 8000
COPY --from=build_deps /node_modules ./node_modules
COPY --from=builder /app/dist ./dist/
CMD ["node", "dist/index.js"] 