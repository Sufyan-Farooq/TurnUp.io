#!/usr/bin/env bash
# Installed as the forced command for TurnUp's dedicated CI SSH key.
# stdin: a full Git commit SHA, followed by a short-lived GHCR token.
set -euo pipefail
umask 077
IFS= read -r release_sha
IFS= read -r registry_token
[[ "$release_sha" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid release SHA' >&2; exit 2; }
[[ -n "$registry_token" ]] || { echo 'Missing registry token' >&2; exit 2; }
deploy_root=/home/ubuntu/apps/turnup-ci
env_file=/home/ubuntu/apps/turnup/.env
cd "$deploy_root"
exec 9>deploy.lock
flock -w 600 9
release_dir="$deploy_root/releases/$release_sha"
mkdir -p "$release_dir" "$deploy_root/backups"
compose_file="$release_dir/compose.yml"
curl --fail --silent --show-error --retry 3 \
  "https://raw.githubusercontent.com/Sufyan-Farooq/TurnUp.io/$release_sha/deploy/oracle/compose.yml" -o "$compose_file"
export RELEASE_SHA="$release_sha"
# Keep the runner token out of the server's persistent Docker credentials.
export DOCKER_CONFIG
DOCKER_CONFIG=$(mktemp -d "$deploy_root/registry.XXXXXX")
trap 'rm -f "$DOCKER_CONFIG/config.json"; rmdir "$DOCKER_CONFIG" 2>/dev/null || true' EXIT
printf '%s' "$registry_token" | docker login ghcr.io -u Sufyan-Farooq --password-stdin > /dev/null
unset registry_token
compose=(docker compose --project-name turnup --env-file "$env_file" -f "$compose_file")
"${compose[@]}" config --quiet
"${compose[@]}" pull
"${compose[@]}" up -d --wait --wait-timeout 90 postgres
backup="$deploy_root/backups/$(date -u +%Y%m%dT%H%M%SZ)-$release_sha.sql.gz"
"${compose[@]}" exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$backup"
gzip -t "$backup"
previous_sha=''
if [[ -f current-release ]]; then previous_sha=$(cat current-release); fi
rollback() {
  echo 'Deployment failed; restoring the previous application images.' >&2
  if [[ "$previous_sha" =~ ^[0-9a-f]{40}$ && -f "$deploy_root/releases/$previous_sha/compose.yml" ]]; then
    RELEASE_SHA="$previous_sha" docker compose --project-name turnup --env-file "$env_file" \
      -f "$deploy_root/releases/$previous_sha/compose.yml" up -d --wait --wait-timeout 180 server client
  else
    echo 'No previous CI release exists. Database and backup are retained for recovery.' >&2
  fi
  exit 1
}
# db push refuses destructive changes. No --accept-data-loss is permitted here.
if ! "${compose[@]}" up -d --wait --wait-timeout 180 server client; then rollback; fi
if ! curl --fail --silent --show-error --retry 8 --retry-all-errors --retry-delay 3 http://127.0.0.1:8080/api/health/ready; then rollback; fi
if ! curl --fail --silent --show-error 'http://127.0.0.1:8080/socket.io/?EIO=4&transport=polling' | grep -q '^0{"sid"'; then rollback; fi
printf '%s\n' "$release_sha" > current-release.next
mv current-release.next current-release
echo "Deployed $release_sha successfully. Database backup: $(basename "$backup")"
