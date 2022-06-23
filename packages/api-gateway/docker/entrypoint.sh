#!/bin/sh
set -e

COMMAND=$1 && shift 1

case "$COMMAND" in
  'start-local' )
    echo "Building the project..."
    yarn workspace @standardnotes/api-gateway build
    echo "Starting Web..."
    yarn workspace @standardnotes/api-gateway start
    ;;

  'start-web' )
    echo "Starting Web..."
    yarn workspace @standardnotes/api-gateway start
    ;;

  'report' )
    echo "Starting Usage Report Generation..."
    yarn workspace @standardnotes/api-gateway report
    ;;

   * )
    echo "Unknown command"
    ;;
esac

exec "$@"