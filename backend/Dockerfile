FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source files and build
COPY . .
RUN npm run build

# Run phase
FROM node:20-alpine

WORKDIR /app

# Install production dependencies including ts-node and tsconfig-paths
# COPY package*.json tsconfig.json ./
COPY . .
RUN npm install --only=production --omit=dev
RUN npm install ts-node tsconfig-paths --save

# Copy the build output from the previous stage
COPY --from=build /app/dist ./dist

CMD ["node", "-r", "ts-node/register", "-r", "tsconfig-paths/register", "dist/index.js"]
