# Build from the REPOSITORY ROOT, this image needs the npm workspace layout:
#   docker build -f admin-api/Dockerfile -t workadventure-admin-api .
#
# Only the workspaces admin-api actually depends on are copied, so the image does not
# carry play's dependency tree. `libs/messages` is needed for the zod contracts, and
# play's woka.json / companions.json are the Woka catalog this API serves.
FROM node:24-trixie-slim

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
COPY admin-api/package.json admin-api/package.json
COPY libs/messages/package.json libs/messages/package.json

ENV NODE_ENV=production
# tsx is a runtime dependency (the start script runs the TypeScript sources directly),
# so --omit=dev is safe here.
RUN npm ci --omit=dev --workspace @workadventure/self-hosted-admin-api

# Only the hand-written JSON schemas are imported; the ts-proto generated code is not,
# which is why this image needs no protoc stage.
COPY libs/messages ./libs/messages
COPY admin-api ./admin-api
COPY play/src/pusher/data ./play/src/pusher/data

# The SQLite database lives here; mount a volume on it in production.
RUN mkdir -p /usr/src/app/admin-api/data && chown -R node:node /usr/src/app/admin-api/data

USER node

ENV ADMIN_API_PORT=3000
ENV ADMIN_API_DB_PATH=/usr/src/app/admin-api/data/profiles.sqlite

EXPOSE 3000

# play blocks on GET /api/capabilities at startup and will not listen until it answers,
# so expose that as the health signal and let compose gate play on `service_healthy`.
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=6 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.ADMIN_API_PORT||3000)+'/api/capabilities').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "run", "start", "--workspace", "@workadventure/self-hosted-admin-api"]
