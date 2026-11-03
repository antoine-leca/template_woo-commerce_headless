# 1. Phase de compilation (Node)
FROM node:24-alpine AS builder

WORKDIR /app

# Copie des dépendances
COPY package*.json ./

# Installation
RUN npm install

# Copie du code source
COPY . .

# Injection de la variable d'API WooCommerce pour Vite
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Génération du dossier /dist
RUN npm run build

# 2. Phase de serveur web (Nginx)
FROM nginx:alpine

# Copie des fichiers compilés vers Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuration des routes SPA (pour éviter les erreurs 404 au rafraîchissement)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]