# Build from the REPOSITORY ROOT, this image needs the whole workspace:
#   docker build -f admin-api/Dockerfile -t workadventure-admin-api .
FROM node:24-trixie-slim

WORKDIR /usr/src/app

COPY . .

RUN npm ci

# The SQLite database lives here; mount a volume on it in production.
RUN mkdir -p /usr/src/app/admin-api/data && chown -R node:node /usr/src/app/admin-api/data

USER node

ENV ADMIN_API_PORT=3000
ENV ADMIN_API_DB_PATH=/usr/src/app/admin-api/data/profiles.sqlite

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace", "@workadventure/self-hosted-admin-api"]
