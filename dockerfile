# 1. Phase de compilation (Node)
FROM node:24-alpine AS builder

WORKDIR /app

# Copie des dépendances
COPY package*.json ./

# Installation
RUN npm install

# Copie du code source
COPY . .

# Injection des variables lues par Vite et par le générateur de sitemap :
# VITE_API_URL (adresse de WordPress, c'est le nom que lit le code ; l'ancien
# VITE_API_BASE_URL n'était lu nulle part) et SITE_URL (adresse publique du site)
ARG VITE_API_URL
ARG SITE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV SITE_URL=$SITE_URL

# Génération du dossier /dist
RUN npm run build

# 2. Phase de serveur web (Nginx)
FROM nginx:alpine

# Copie des fichiers compilés vers Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuration nginx : routes SPA (pas d'erreur 404 au rafraîchissement),
# en-têtes de sécurité et cache des fichiers générés (voir nginx.conf)
COPY nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]