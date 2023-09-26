FROM node:20.7-alpine AS builder
RUN mkdir -p /app
WORKDIR /app
COPY package*.json /app
RUN npm ci
COPY . .
COPY .env .env
RUN npm run build
RUN npm prune --production

FROM node:20.7-alpine
RUN adduser -D nodeuser
RUN mkdir -p /app
RUN chown nodeuser:nodeuser /app
USER nodeuser
WORKDIR /app
COPY --from=builder --chown=nodeuser:nodeuser /app/build build/
COPY --from=builder --chown=nodeuser:nodeuser /app/node_modules node_modules/
COPY package.json .
COPY .env .env
EXPOSE 3000
CMD ["node", "-r", "dotenv/config", "build"]