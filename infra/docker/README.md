# Docker

Primary Docker Compose for local development is in **`infrastructure/docker/`** at repo root:

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

This folder can hold additional Dockerfiles or compose overrides for staging/production.
