# Build the application
FROM node:20-alpine AS builder

# Declare a build argument
ARG NEXT_PUBLIC_API_BASE_URL
# Set it as an environment variable for the build stage
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Create the final, small production image
FROM node:20-alpine AS runner
WORKDIR /app

# Copy the standalone output from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000

# Run the Next.js server
CMD ["node", "server.js"]