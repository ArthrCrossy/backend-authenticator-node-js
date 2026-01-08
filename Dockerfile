FROM node:22-alpine

WORKDIR /app

# instala deps primeiro (cache)
COPY package*.json ./
RUN npm ci --omit=dev

# copia o resto
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/server.js"]
