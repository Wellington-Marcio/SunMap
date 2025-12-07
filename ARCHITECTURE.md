# SunMap - Arquitetura

Aqui está um resumo da arquitetura e um diagrama Mermaid para referência rápida.

```mermaid
flowchart LR
  subgraph Producer
    PY[producer-py]
  end
  subgraph Broker
    RMQ[RabbitMQ\n(queues: weather, weather.retry, weather.dlq)]
  end
  subgraph Workers
    WG[worker-go]
    WN[worker-node]
  end
  subgraph Backend
    API[backend (NestJS)\n/api/weather/logs]
    Mongo[MongoDB]
  end
  subgraph Frontend
    FE[frontend (React + Vite)]
  end

  PY -->|publish weather| RMQ
  RMQ -->|consume| WG
  RMQ -->|consume| WN
  WG -->|POST /api/weather/logs (x-api-key)| API
  WN -->|POST /api/weather/logs (x-api-key)| API
  API -->|persist| Mongo
  API -->|read| FE
```

Descrição resumida

- Producer (Python): publica mensagens na fila `weather` no RabbitMQ.
- Broker (RabbitMQ): gerencia filas. Há um fluxo de retry implementado por duas filas (`weather` -> `weather.retry`) e uma DLQ (`weather.dlq`). Um init helper aplica `definitions.json` ao iniciar o broker.
- Workers (Go/Node): consomem mensagens da fila `weather` e encaminham por HTTP para o endpoint `POST /api/weather/logs` do backend. Os workers adicionam o header `x-api-key` para autenticação com o backend.
- Backend (NestJS): valida payload com DTOs (`class-validator`) e persiste os registros em MongoDB. Também expõe endpoints para o frontend (listagem, exportação, resumo).
- Frontend (React): consome endpoints do backend e apresenta dashboard com gráficos, tabelas e insights.

Observações operacionais

- Retry/DLQ: a definição cria a fila `weather.retry` com `x-message-ttl` (atualmente 60s) que, após expirar, reencaminha mensagens para a fila `weather`. Mensagens que atingirem a DLQ podem ser analisadas em `weather.dlq`.
- Autenticação entre workers e backend é feita via `x-api-key`. A `ApiKeyGuard` do backend permite execução sem chave se `BACKEND_API_KEY` não estiver definida (comodidade dev).

Recomendações

- Monitorar `weather.dlq` e adicionar uma rotina para inspeção/reprocessamento.
- Considerar centralizar consumo no backend se preferir única fonte de verdade para ingestão.
- Instrumentar métricas (Prometheus) e logs estruturados (JSON) para facilitar observabilidade.
