FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p client/uploads

EXPOSE 3000

CMD ["node", "server/server.js"]
