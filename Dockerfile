# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the Next.js app
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install PostgreSQL client tools
RUN apk add --no-cache postgresql-client

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --legacy-peer-deps --production

# some Next.js configurations (e.g. next.config.ts) require TypeScript at runtime
# even in production, so install it explicitly so that `next start` won't try to
automatically fetch it.
RUN npm install --no-save typescript

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the app
CMD ["npm", "start"]
