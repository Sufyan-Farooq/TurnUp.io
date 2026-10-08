#!/usr/bin/env bash
# Run via the administrator SSH key after copying deploy.sh and deploy.pub here.
set -euo pipefail
deploy_root=/home/ubuntu/apps/turnup-ci
test -f /home/ubuntu/apps/turnup/.env
docker volume inspect turnup_postgres-data > /dev/null
chmod 700 "$deploy_root" "$deploy_root/deploy.sh"
bash -n "$deploy_root/deploy.sh"
install -m 700 -d "$deploy_root/releases" "$deploy_root/backups" /home/ubuntu/.ssh
touch /home/ubuntu/.ssh/authorized_keys
chmod 600 /home/ubuntu/.ssh/authorized_keys
public_key=$(cat "$deploy_root/deploy.pub")
[[ "$public_key" == ssh-ed25519\ * ]] || { echo 'Expected an Ed25519 deployment key' >&2; exit 2; }
forced_key="restrict,command=\"$deploy_root/deploy.sh\" $public_key"
grep -qxF "$forced_key" /home/ubuntu/.ssh/authorized_keys || printf '\n%s\n' "$forced_key" >> /home/ubuntu/.ssh/authorized_keys
echo 'Dedicated CI key installed with a forced deployment command.'
