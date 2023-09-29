#!/bin/bash

# Prompt the user for values or use defaults
read -p "Enter APP_IP (default: your local IP): " APP_IP
APP_IP=${APP_IP:-$(hostname -I | cut -d' ' -f1)}

read -p "Enter APP_PORT (default: 3000): " APP_PORT
APP_PORT=${APP_PORT:-3000}

read -p "Enter CUBE_IP (default: your local IP): " CUBE_IP
CUBE_IP=${CUBE_IP:-$(hostname -I | cut -d' ' -f1)}

read -p "Enter CUBE_PORT (default: 8000): " CUBE_PORT
CUBE_PORT=${CUBE_PORT:-8000}

read -p "Enter OHIF_IP (default: your local IP): " OHIF_IP
OHIF_IP=${OHIF_IP:-$(hostname -I | cut -d' ' -f1)}

read -p "Enter OHIF_PORT (default: 3002): " OHIF_PORT
OHIF_PORT=${OHIF_PORT:-3002}



# Build the Docker image
docker build --build-arg APP_IP="$APP_IP" --build-arg CUBE_IP="$CUBE_IP" --build-arg OHIF_IP="$OHIF_IP" --build-arg OHIF_PORT="$OHIF_PORT" \
  --build-arg APP_PORT="$APP_PORT" --build-arg CUBE_PORT="$CUBE_PORT" -t local/chris_ui_svelte .

# Run the Docker container
docker run --name chris_ui -p $APP_PORT:3000 local/chris_ui_svelte