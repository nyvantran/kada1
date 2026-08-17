# Multi-stage Dockerfile for NestJS + Prisma + Redis

# Step 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definition files
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Generate Prisma Client & Build TypeScript
RUN npm run prisma:generate
RUN npm run build

# Step 2: Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and dependencies
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy built application, static assets, and Prisma artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src ./src

# Expose port
EXPOSE 3000

# Start production server
CMD ["node", "dist/main"]

