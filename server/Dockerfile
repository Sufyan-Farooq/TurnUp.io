FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
# npm ci's postinstall hook runs `prisma generate`, which needs the schema
# already present -- hence copying prisma/ before installing. `generate`
# only reads the schema (never connects), but prisma.config.ts's env()
# resolution still requires DATABASE_URL to be *set* to something; the
# real value is supplied at container start and overrides this default.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
# Full install (not --omit=dev): the `prisma` CLI is required at container
# startup to run `prisma db push` against whatever DATABASE_URL is provided.
# Same placeholder-at-build-time rationale as the build stage above.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npm ci
COPY --from=build /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]
