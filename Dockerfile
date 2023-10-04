# Stage 1: Build the application
FROM node:20.7-alpine AS builder

# Define build arguments
ARG APP_IP
ARG APP_PORT
ARG CUBE_IP
ARG CUBE_PORT
ARG OHIF_PORT 
ARG OHIF_IP
ARG BCHPACS_IP
ARG ChRISPACS_IP
ARG BCHPACS_PORT
ARG ChRISPACS_PORT

# Create a directory for the app
WORKDIR /app

# Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install project dependencies
RUN npm ci

# Set environment variables
ENV APP_IP=$APP_IP \
    CUBE_IP=$CUBE_IP \
    CUBE_PORT=$CUBE_PORT \
    APP_PORT=$APP_PORT \
    OHIF_PORT=$OHIF_PORT \
    OHIF_IP=$OHIF_IP\
    BCHPACS_IP=${BCHPACS_IP}\
    ChRISPACS_IP=${ChRISPACS_IP}\
    BCHPACS_PORT=${BCHPACS_PORT}\
    ChRISPACS_PORT=${ChRISPACS_PORT}


# Copy the application code
COPY . .

# Copy .env.template to .env (if needed)
COPY .env.template .env

# Copy start script and execute it
COPY start.sh /start.sh
RUN /start.sh

# Build the application
RUN npm run build

# Prune unnecessary dependencies for production
RUN npm prune --production

# Stage 2: Create a lightweight image for running the application
FROM node:20.7-alpine

# Create a non-root user to run the application
RUN adduser -D nodeuser

# Create a directory for the app
RUN mkdir -p /app && chown nodeuser:nodeuser /app

# Switch to the non-root user
USER nodeuser

# Set the working directory
WORKDIR /app

# Copy the build files and dependencies from the builder stage
COPY --from=builder --chown=nodeuser:nodeuser /app/build build/
COPY --from=builder --chown=nodeuser:nodeuser /app/node_modules node_modules/
COPY --from=builder --chown=nodeuser:nodeuser /app/.env .env
COPY package.json .

# Expose the application port
EXPOSE 3000

# Start the application with environment variable configuration
CMD ["node", "-r", "dotenv/config", "build"]
