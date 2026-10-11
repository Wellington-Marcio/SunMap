FROM node:20-alpine AS build
WORKDIR /app
# copy package manifest and lockfile first for efficient layer caching
COPY package.json package-lock.json* ./
# copy TypeScript and Vite config files required by the build
COPY tsconfig*.json ./
COPY vite.config.* ./
COPY index.html ./
COPY public ./public
COPY src ./src
RUN npm ci --silent || npm install --silent
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# optional: copy a minimal nginx config if needed
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
