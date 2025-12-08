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

## Usuário padrão
- Email: admin@sunmap.com
- Senha: 123456

## Estrutura
- Dashboard climático
- CRUD de usuários
- Exportação de dados
- Insights de IA
- Integração opcional com API pública paginada
