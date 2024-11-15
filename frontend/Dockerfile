FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Run phase
FROM node:18-alpine

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/package*.json ./
RUN npm install --only=production

CMD ["node", "build"]
