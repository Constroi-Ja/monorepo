# Multi-stage build for Next.js production
FROM node:20-alpine AS base

LABEL org.opencontainers.image.authors="João Eduardo Braga <joaoeduardobraga2@gmail.com>"

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat && \
    npm install -g npm@latest
WORKDIR /app

# Copy dependency files
COPY package.json ./

# Install dependencies (regenerate lock file if needed)
# Warnings about deprecated packages are normal and can be ignored
# They come from transitive dependencies and don't affect functionality
RUN if [ -f package-lock.json ]; then \
      npm ci --prefer-offline --no-audit --no-fund || \
      npm install --prefer-offline --no-audit --no-fund; \
    else \
      npm install --prefer-offline --no-audit --no-fund; \
    fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Copy standalone build if available, otherwise copy full build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the server
CMD ["node", "server.js"]
