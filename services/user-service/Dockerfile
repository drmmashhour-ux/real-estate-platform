FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 3002
CMD ["node", "-e", "require('http').createServer((_,r)=>{r.end('OK')}).listen(3002)"]
