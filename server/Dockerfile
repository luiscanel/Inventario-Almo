FROM node:20-slim

WORKDIR /app

# Install dependencies for Prisma
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY server/ ./

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "run", "dev"]
