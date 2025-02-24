FROM node:18

WORKDIR /app

# Install system dependencies needed for bcryptjs
RUN apt-get update && apt-get install -y openssl

# Create data directory for SQLite
RUN mkdir -p /app/data

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
