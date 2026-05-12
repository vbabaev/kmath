# Deploy

Ansible playbook that ships the current working tree to
`klearn.vbabaev.uk` and brings the stack up.

## One-time setup

```sh
brew install ansible
ansible-galaxy collection install ansible.posix  # used for `synchronize` (rsync)
```

SSH access: an entry `Host kmath.vbabaev.uk` with the right key must exist
in `~/.ssh/config`. (The host was renamed to `klearn.vbabaev.uk` but the
SSH alias kept the old name.)

## Deploy

From the repo root:

```sh
ansible-playbook -i deploy/inventory.yml deploy/deploy.yml
```

Dry-run (no changes):

```sh
ansible-playbook -i deploy/inventory.yml deploy/deploy.yml --check --diff
```

## What the playbook does

1. **Local:** runs the backend test suite, then `npm run build` for the
   frontend. Aborts on failure.
2. **Remote (`/opt/klearn`):** rsyncs the working tree (excluding
   `.git`, `.claude`, IDE state, `node_modules`, `backend/.env`,
   `docker-compose.dev.yml`, and the `deploy/` directory itself).
3. **Remote:** `docker compose up -d --build` (rebuilds the backend
   image so source changes in `backend/` take effect; frontend `dist`
   is served straight off the filesystem by Caddy, no image rebuild
   needed).
4. **Remote:** polls `http://127.0.0.1/api/health` until it returns 200,
   then prints `docker compose ps`.

## What it does NOT do

- Does **not** touch `backend/.env` on the host. Update it manually over
  SSH when a new env var is needed.
- Does **not** push to git or tag a release. Commit and push separately
  via your normal git flow.
- Does **not** restore DB backups or run migrations — Mongo schema is
  applied lazily by the backend on connect (see `backend/src/db.js`).
