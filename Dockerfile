FROM node:8.15-alpine
RUN mkdir /app
WORKDIR /app
RUN apk --no-cache add --virtual native-deps \
 g++ gcc libgcc libstdc++ linux-headers autoconf automake make nasm python git && \
 npm install --quiet node-gyp -g
COPY client /app/client
COPY server /app/server
RUN cd server && npm install && cd ..
RUN cd client && npm install && cd ..
RUN cd server && npm run build && cd ..
RUN cd client && ./node_modules/.bin/ng build

FROM node:8.15-alpine
RUN mkdir /app
WORKDIR /app
COPY --from=0 /app .
CMD node server/dist/app.js