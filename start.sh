#!/bin/sh

# Replace placeholders in .env.template with user-provided values
sed -i "s/{{APP_IP}}/$APP_IP/g; s/{{APP_PORT}}/$APP_PORT/g" .env
sed -i "s/{{CUBE_IP}}/$CUBE_IP/g" .env.local

