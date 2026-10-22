FROM node:22-slim
WORKDIR /app
# Prisma needs OpenSSL on Debian slim images
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 4000
# Apply migrations, then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
