# Cheap-but-good-enough: a single tiny Node/Express service, no database,
# no object storage — the bind-mounted shared folder (see docker-compose.yml)
# is the only state. Same base image family as the app's own Dockerfile for
# consistency.
FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./
COPY lib ./lib
COPY cli ./cli

ENV TABS_DIR=/data/tabs
ENV PORT=4001
# Unset by default — admin import is disabled until an operator sets this
# (see lib/adminAuth.js and the README's "Admin tab import" section).
ENV ADMIN_IMPORT_TOKEN=""
EXPOSE 4001

CMD ["node", "server.js"]
