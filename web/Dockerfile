# =========================
# Stage 1: Build React app
# =========================
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies first
COPY package*.json ./

RUN npm ci

# Copy source code
COPY . .

# Build-time settings read by Vite (import.meta.env.*). Pass with --build-arg or docker-compose `args:`.
ARG VITE_TABS_SERVER_URL
ARG VITE_DATA_SOURCE=local
ARG VITE_API_URL=http://localhost:5080
ENV VITE_TABS_SERVER_URL=$VITE_TABS_SERVER_URL \
    VITE_DATA_SOURCE=$VITE_DATA_SOURCE \
    VITE_API_URL=$VITE_API_URL

# Build production files
RUN npm run build


# =========================
# Stage 2: Nginx
# =========================
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy React production build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]