FROM node:22.13.0 AS builder
WORKDIR /crimson-server
COPY package.json package-lock.json tsconfig.json ./
COPY ./prisma ./prisma
RUN npm install
COPY . .
RUN npm run compile
RUN npx prisma generate

# ---- #

FROM node:22.13.0-slim
WORKDIR /crimson-server
RUN apt-get update -y && apt-get install -y openssl
COPY --from=builder /crimson-server/package*.json ./
COPY --from=builder /crimson-server/node_modules ./node_modules
COPY --from=builder /crimson-server/dist ./dist
COPY --from=builder /crimson-server/prisma ./prisma

EXPOSE 8080

CMD ["node", "dist/index.js"]
