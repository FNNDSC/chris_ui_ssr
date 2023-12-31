FROM node:20.7-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --production

FROM node:20.7-alpine
WORKDIR /app

COPY --from=builder /app /app

CMD ["node", "-r", "dotenv/config", "build"]
EXPOSE 3000
HEALTHCHECK CMD sh -c 'wget --spider $ORIGIN/readyz'
