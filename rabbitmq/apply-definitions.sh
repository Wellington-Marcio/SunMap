#!/bin/sh
# apply-definitions.sh
# waits for rabbitmq management API and uploads definitions.json
set -eu
DEFS=/scripts/definitions.json
URL=http://rabbitmq:15672/api/definitions
AUTH=guest:guest

echo "Waiting for RabbitMQ management API..."
# retry loop until success
while true; do
  if curl -s -f -u "$AUTH" "$URL" > /dev/null 2>&1; then
    echo "RabbitMQ management API reachable"
    break
  fi
  echo "RabbitMQ not ready yet - sleeping 2s"
  sleep 2
done

# try upload definitions
for i in 1 2 3 4 5; do
  echo "Applying definitions (attempt $i)"
  if curl -s -f -u "$AUTH" -X PUT -H "Content-Type: application/json" --data-binary @"$DEFS" "$URL"; then
    echo "Definitions applied"
    exit 0
  fi
  echo "Failed to apply definitions, retrying in 2s"
  sleep 2
done

echo "Failed to apply definitions after retries" >&2
exit 1
