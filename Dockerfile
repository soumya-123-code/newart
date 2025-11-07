FROM node:20-alpine AS builder
WORKDIR /app
ARG ENV_FILE=.env
COPY ${ENV_FILE} .env
COPY package.json yarn.lock ./

# Install dependencies using Yarn
RUN yarn install --frozen-lockfile

COPY . .

# Build the app
RUN yarn run build

# --- Building stage ---
FROM node:20-alpine AS prod

WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json /app/yarn.lock ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
#COPY --from=builder /app/next.config.js ./next.config.js
RUN yarn install --frozen-lockfile --production

# Expose 4000 port
ENV PORT=4000
EXPOSE 4000
CMD ["yarn", "run", "start"]
