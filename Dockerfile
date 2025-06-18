FROM node

WORKDIR /informator

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3200

CMD ["node", "./index"]