# ==========================================
# 1. BUILDER STAGE: Compile TypeScript
# ==========================================
FROM node:20-bullseye AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./


# Install ALL dependencies (including devDependencies like 'typescript')
# We use legacy-peer-deps to be safe
RUN npm config set fetch-retries 5
RUN npm config set fetch-retry-mintimeout 20000
RUN npm config set fetch-retry-maxtimeout 120000
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the TypeScript code (Creates /dist folder)
RUN npm run build

# ==========================================
# 2. RUNNER STAGE: Production Image
# ==========================================
FROM node:20-bullseye AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy package.json to install ONLY production dependencies
COPY package.json package-lock.json* ./

RUN npm config set fetch-retries 5
RUN npm config set fetch-retry-mintimeout 20000
RUN npm config set fetch-retry-maxtimeout 120000
# Install ONLY production dependencies (Clean & Small)
RUN npm ci --omit=dev --legacy-peer-deps

# Copy the compiled JS from the builder stage
# ⚠️ CHECK: Ensure your tsconfig.json outputs to './dist'
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy other necessary files (e.g., .env template if needed, though secrets should be env vars)
# COPY --from=builder /app/.env.example ./.env.example

USER nodejs

# Expose the port (Adjust if your app uses 3000 or 8000)
EXPOSE 3001
ENV PORT 3001

# Start the server
# ⚠️ CHECK: Ensure your compiled entry file is at dist/index.js or dist/server.js
CMD ["node", "dist/server.js"]