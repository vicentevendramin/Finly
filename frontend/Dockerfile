FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g npm@12
COPY package*.json ./
RUN npm ci

COPY . .

# Baked in at build time (Vite inlines env vars into the bundle) — defaults
# to a same-origin relative path so the built image works regardless of the
# hostname/port it's eventually served from; nginx.conf proxies /api to the
# backend service.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
