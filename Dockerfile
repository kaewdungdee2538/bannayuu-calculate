FROM node:16.17.0-alpine as builder

ENV NODE_ENV build

# RUN addgroup app && adduser -S -G app app
# RUN mkdir /app && chown app:app /app
# USER app
RUN mkdir /app
WORKDIR /app

COPY . ./

RUN npm install 
RUN npm run build


# WORKDIR /app/dist


FROM node:16.17.0-alpine

ENV NODE_ENV deployment

# RUN addgroup app && adduser -S -G app app
# RUN mkdir /app && chown app:app /app
# USER app
RUN mkdir /app
WORKDIR /app

COPY --from=builder  /app/package*.json ./
COPY --from=builder  /app/node_modules/ ./node_modules/
COPY --from=builder  /app/dist/ ./dist/

WORKDIR /app/dist

# ENV NODE_ENV=development
# ENV APP_PORT=36006
# ENV DB_HOST=192.168.81.135
# ENV DB_PORT=50005
# ENV DB_NAME=demo_bannayuu_db
# ENV DB_USERNAME=postgres
# ENV DB_PASSWORD=P@ssw0rd
# ENV URL_CALCULATE_LONGTIME=http://localhost:36008/api/v1/bannayuu/calculate/master/cal
# ENV JWT_TOKEN=f56c3775-07b0-45e7-800f-304274533cb7

CMD ["node", "bannayuu-calculate-api.js"]

