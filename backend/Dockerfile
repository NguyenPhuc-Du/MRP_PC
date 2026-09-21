FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl font-dejavu

COPY package.json package-lock.json* ./
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 300000 \
    && npm install --ignore-scripts && npm rebuild esbuild

COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["sh", "-c", "npx prisma generate && npm run dev"]
