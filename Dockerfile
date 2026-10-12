FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Install build dependencies for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]
