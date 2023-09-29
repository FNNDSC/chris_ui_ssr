#!/bin/sh
# Replace placeholders in .env.template with user-provided values
# Replace placeholders in .env.template with user-provided values
sed -i "s/{{APP_IP}}/$APP_IP/g; s/{{APP_PORT}}/$APP_PORT/g; s/{{CUBE_PORT}}/$CUBE_PORT/g; s/{{CUBE_IP}}/$CUBE_IP/g; s/{{OHIF_IP}}/$OHIF_IP/g; s/{{OHIF_PORT}}/$OHIF_PORT/g" .env


