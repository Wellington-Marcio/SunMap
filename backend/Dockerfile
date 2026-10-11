FROM node:18-alpine AS builder
WORKDIR /app

# install all deps for build
COPY package*.json ./
RUN npm ci
RUN npm install --no-save typescript

# copy source and build
COPY . /app
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

# copy node_modules and built artifacts from builder to ensure all needed
# modules (including those missing from package.json) are present
COPY package*.json ./
RUN npm ci --only=production

# copy built artifacts from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/main.js"]
