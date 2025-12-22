# SunMap

Aplicação full-stack para monitoramento climático, insights de IA e dashboard interativo.

## Serviços
- **frontend**: React + Vite + Tailwind + shadcn/ui
- **backend**: NestJS + MongoDB + JWT + exportação CSV/XLSX
- **worker-go**: Go + RabbitMQ
- **producer-py**: Python + Open-Meteo + RabbitMQ

## Como rodar
1. Instale Docker e Docker Compose
2. Execute:
   ```
   docker-compose up --build
   ```
3. Acesse o frontend em [http://localhost:5173](http://localhost:5173)

Nota: o `docker-compose.yml` inclui o serviço `frontend` (build + nginx) e um init helper `rabbitmq-init` que aplica as definições do RabbitMQ (DLQ/Retry). O primeiro `docker-compose up --build` pode demorar enquanto as imagens são construídas e as definições são aplicadas.

Testando o pipeline manualmente
- Para publicar uma mensagem de teste (rodando dentro do container `producer-py`):
   ```bash
   docker-compose run --rm producer-py python publisher.py
   ```
- Verifique o RabbitMQ Management: http://localhost:15672 (guest/guest)
- Verifique os logs dos workers/back-end:
   ```bash
   docker-compose logs -f sunmap-worker-go sunmap-worker-node sunmap-backend
   ```

Variáveis importantes (definidas no `docker-compose.yml`)
- `BACKEND_API_KEY`: chave usada pelos workers para autenticar no backend (definida como `supersecret_api_key` por padrão no compose). Mude em produção.
- `OPENWEATHER_API_KEY`: (opcional) chave da API do OpenWeatherMap usada pelo endpoint `GET /weather/fetch` para popular um único registro a partir de lat/lon. Configure em `backend/.env` ou em um arquivo `.env` na raiz e não compartilhe publicamente.

Para desenvolvedor (rodar frontend localmente com Vite)
- Se preferir rodar apenas o frontend em modo dev (hot reload):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Usuário padrão
- Email: admin@sunmap.com
- Senha: 123456

## Estrutura
- Dashboard climático
- CRUD de usuários
- Exportação de dados
- Insights de IA
- Integração opcional com API pública paginada

**Development (Local)**
- **Docker Compose:**: Run the full stack (Mongo, RabbitMQ, backend, frontend):
   ```
   docker-compose up -d
   ```
- **Mongo credentials:**: The development `docker-compose.yml` uses the root user with password `123456`. It is recommended to create a dedicated DB user for the `sunmap` database:
   ```
   docker run --rm mongo:6 mongosh "mongodb://root:123456@host.docker.internal:27017/admin?authSource=admin" --eval "db.getSiblingDB('sunmap').createUser({user:'sunmap',pwd:'sunmap123',roles:[{role:'readWrite',db:'sunmap'}]})"
   ```
- **Backend local run (load `.env` from `backend/.env`):**: Start the backend locally (reads `backend/.env`):
   ```
   cd backend
   node dist/main.js
   ```
- **Quick login test:**: Use the helper script to start backend and run a login POST (script will capture logs):
   ```
   node scripts/run_and_post.js
   ```
- **Notes:**: Do not commit sensitive secrets like `.env` to the repo; instead use environment variables or a secret manager in CI/CD.
