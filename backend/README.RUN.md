# Backend run notes

This file documents recommended ways to run the backend during development and in Docker to avoid port conflicts (EADDRINUSE).

Commands

- Start in development mode (local, watch):

  - Windows `cmd`:

    ```cmd
    cd "C:\Users\Wellington Martins\Documents\Portifolio\SunMap\backend"
    set PORT=3002 && npm run start:dev
    ```

  - PowerShell (use `npm.cmd` to avoid `npm.ps1` ExecutionPolicy issues):

    ```powershell
    cd 'C:\Users\Wellington Martins\Documents\Portifolio\SunMap\backend'
    $env:PORT=3002; npm.cmd run start:dev
    ```

- Start in Docker (container exposes `3001`):

  ```cmd
  docker-compose build backend
  docker-compose up -d backend
  ```

Pre-check port

Before starting a dev server you can verify if the port is free using the helper scripts included:

 - `check-port.cmd [port]` (Windows cmd)
 - `check-port.ps1 [port]` (PowerShell)

Example:

```cmd
backend\check-port.cmd 3001
```

Port fallback

The backend supports a simple fallback mechanism: set `PORT_FALLBACK=true` to let the process try the configured `PORT`, then `PORT+1`, then `PORT+2` in case of `EADDRINUSE`.

Example (Docker or env):

```env
PORT=3001
PORT_FALLBACK=true
```

When developing locally, we recommend using a different dev port (e.g. 3002) or stopping the Docker backend before starting the local dev server.
