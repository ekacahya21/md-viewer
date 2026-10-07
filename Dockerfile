FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ENV DB_PATH=/data/shared_docs.db

RUN mkdir -p /data && chown -R node:node /data

COPY package*.json ./
RUN npm ci --omit=dev && chown -R node:node /app

COPY --from=builder /app/dist ./dist
COPY public ./public
COPY server.mjs ./
RUN chown -R node:node /app

USER node

VOLUME ["/data"]
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/api/health || exit 1

CMD ["node", "server.mjs"]
