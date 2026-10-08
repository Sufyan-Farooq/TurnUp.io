# Oracle deployment

Production: https://turnup.sufyanfarooq.com. Caddy already forwards to `127.0.0.1:8080` on the ARM64 Oracle host.

GitHub Actions tests pull requests. Successful pushes to `main` build native ARM64 client/server images in GHCR, tagged with the full commit SHA, then deploy through the `production` environment. Manual workflow runs from `main` also redeploy that commit.

The production environment needs secrets `ORACLE_SSH_KEY` and `ORACLE_KNOWN_HOSTS`, and variables `ORACLE_HOST` and `ORACLE_USER`. The SSH key is dedicated to this repository; its authorized-key entry forces `/home/ubuntu/apps/turnup-ci/deploy.sh` and disables forwarding and interactive shells. The server host key is obtained over the existing administrator connection, and CI verifies it strictly. The temporary GitHub token authenticates image pulls and is removed from the server after deployment.

The existing `/home/ubuntu/apps/turnup/.env` remains on the server. Production reuses the external `turnup_postgres-data` volume, keeps PostgreSQL private, and binds the web service only to loopback. No Caddy change is needed. Update the installed `deploy.sh` through the administrator connection when changing that script in this repository; CI cannot replace its own SSH entry point.

Before replacing the application containers, the deployer takes a compressed PostgreSQL dump in `/home/ubuntu/apps/turnup-ci/backups`. Docker health checks, database readiness, and a Socket.IO handshake must pass before the new SHA is recorded in `current-release`. If these fail, the previous application images are restored when a previous CI release exists. This restores application code, not schema or data. Prisma's current `db push` refuses changes that require accepting data loss; the pipeline never supplies that flag. Schema migrations should be introduced before future destructive schema changes.

For rollback, select the earlier successful commit in GitHub Actions and rerun its deployment job; its SHA-tagged images remain available. Database restore requires an administrator and a selected backup. Monitor free disk space and archive old backups as needed.

Active games are currently held in memory. A deployment restarts the game server and ends those sessions. Persistent room storage is required before uninterrupted game deployments are possible.

After copying `deploy.sh`, `bootstrap.sh`, and the dedicated public key as `deploy.pub` into `/home/ubuntu/apps/turnup-ci`, run `bash bootstrap.sh` through the administrator SSH connection. Existing database credentials and Caddy routes are preserved.

References: [GitHub ARM64 runners](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job), [GHCR workflow authentication](https://docs.github.com/en/packages/managing-github-packages-using-github-actions-workflows/publishing-and-installing-a-package-with-github-actions).
