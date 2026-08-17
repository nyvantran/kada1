# ==============================================
# Stage 1: Build Stage
# ==============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate

# Copy source code and build
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src/
RUN npm run build

# Prune dev dependencies for production
RUN npm prune --production

# ==============================================
# Stage 2: Production Runner
# ==============================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install OpenSSL for Prisma engine compatibility if needed
RUN apk add --no-cache openssl

# Create non-root user for security
USER node

# Copy dependencies and build artifacts from builder
COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000

CMD ["node", "dist/main.js"]
