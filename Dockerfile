FROM node:20.7-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20.7-alpine
WORKDIR /app
COPY --from=builder /app/build /app/build

CMD ["node", "-r", "dotenv/config", "build"]
EXPOSE 3000
HEALTHCHECK CMD sh -c 'wget --spider $ORIGIN/readyz'
