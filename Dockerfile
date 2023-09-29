
FROM node:20.7-alpine AS builder
ARG APP_IP
ARG APP_PORT
ARG CUBE_IP
ARG CUBE_PORT
ARG OHIF_PORT
ARG OHIF_IP
RUN mkdir -p /app
WORKDIR /app
COPY package*.json /app
RUN npm ci
ENV APP_IP=$APP_IP CUBE_IP=$CUBE_IP CUBE_PORT=$CUBE_PORT APP_PORT=$APP_PORT OHIF_PORT=$OHIF_PORT OHIF_IP=$OHIF_IP
COPY . .
COPY .env.template .env
COPY start.sh /start.sh
RUN  /start.sh 
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
COPY --from=builder --chown=nodeuser:nodeuser /app/.env .env
COPY package.json .
EXPOSE 3000
CMD ["node", "-r","dotenv/config","build"]