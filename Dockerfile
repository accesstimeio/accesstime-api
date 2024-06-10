FROM node:18-alpine
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run graphclient-build
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
