FROM node

WORKDIR /car-repair-info

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3020

CMD ["node", "./index"]