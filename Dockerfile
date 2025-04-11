FROM node:18.7-alpine3.15

ENV NODE_PATH=/usr/local/lib/node_modules

RUN npm install -g tar html-to-docx ali-oss

EXPOSE 8000

WORKDIR /data

CMD nodejs app.js

#docker run -it --name ftrans -v $(pwd):/data -p 8002:8000 banli/util-h2d sh