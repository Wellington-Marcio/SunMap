FROM golang:1.20-alpine AS builder

WORKDIR /src

# install git for go modules
RUN apk add --no-cache git

COPY go.mod go.sum* ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags='-s -w' -o /worker ./

FROM alpine:3.18
RUN apk add --no-cache ca-certificates
COPY --from=builder /worker /usr/local/bin/worker

EXPOSE 8080

ENV RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
ENV BACKEND_URL=http://backend:3001/api/weather/logs

CMD ["/usr/local/bin/worker"]
