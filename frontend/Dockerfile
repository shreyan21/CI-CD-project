FROM node:24-trixie
WORKDIR /app
COPY ./package*.json .
RUN npm ci
COPY . .
CMD ["npm","run","dev"]