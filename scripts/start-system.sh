#!/bin/bash

# Colors / styles
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

RULE="${DIM}────────────────────────────────────────────${NC}"

echo
echo -e "  ${BOLD}Multi-Agent Observability${NC}"
echo -e "  $RULE"

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the project root directory (parent of scripts)
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Read ports from environment variables or use defaults
SERVER_PORT=${SERVER_PORT:-4000}
CLIENT_PORT=${CLIENT_PORT:-5173}

echo -e "  ${DIM}Server${NC}  ${GREEN}$SERVER_PORT${NC}    ${DIM}Client${NC}  ${GREEN}$CLIENT_PORT${NC}"
echo

# Function to kill processes on a port
kill_port() {
    local port=$1
    local name=$2

    echo -e "  ${CYAN}▸${NC} Checking port $port ${DIM}($name)${NC}"

    # Find PIDs using the port
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        PIDS=$(lsof -ti :$port 2>/dev/null)
    else
        # Linux
        PIDS=$(lsof -ti :$port 2>/dev/null || fuser -n tcp $port 2>/dev/null | awk '{print $2}')
    fi

    if [ -n "$PIDS" ]; then
        for PID in $PIDS; do
            kill -9 $PID 2>/dev/null \
                && echo -e "    ${GREEN}✓${NC} ${DIM}freed (killed $PID)${NC}" \
                || echo -e "    ${RED}✗${NC} failed to kill $PID"
        done
        sleep 1
    else
        echo -e "    ${GREEN}✓${NC} ${DIM}available${NC}"
    fi
}

# Kill any existing processes on our ports
kill_port $SERVER_PORT "server"
kill_port $CLIENT_PORT "client"

# Start server
echo -e "  ${CYAN}▸${NC} Starting server"
cd "$PROJECT_ROOT/apps/server"
SERVER_PORT=$SERVER_PORT bun run dev &
SERVER_PID=$!

# Wait for server to be ready
for i in {1..10}; do
    if curl -s http://localhost:$SERVER_PORT/health >/dev/null 2>&1 || curl -s http://localhost:$SERVER_PORT/events/filter-options >/dev/null 2>&1; then
        echo -e "    ${GREEN}✓${NC} ${DIM}ready${NC}"
        break
    fi
    sleep 1
done

# Start client
echo -e "  ${CYAN}▸${NC} Starting client"
cd "$PROJECT_ROOT/apps/client"
VITE_PORT=$CLIENT_PORT bun run dev &
CLIENT_PID=$!

# Wait for client to be ready
for i in {1..10}; do
    if curl -s http://localhost:$CLIENT_PORT >/dev/null 2>&1; then
        echo -e "    ${GREEN}✓${NC} ${DIM}ready${NC}"
        break
    fi
    sleep 1
done

# Display status
echo
echo -e "  $RULE"
echo -e "  ${GREEN}${BOLD}✓ System running${NC}"
echo
echo -e "    ${DIM}Client   ${NC} ${CYAN}http://localhost:$CLIENT_PORT${NC}"
echo -e "    ${DIM}Server   ${NC} ${CYAN}http://localhost:$SERVER_PORT${NC}"
echo -e "    ${DIM}WebSocket${NC} ${CYAN}ws://localhost:$SERVER_PORT/stream${NC}"
echo
echo -e "    ${DIM}Server PID $SERVER_PID · Client PID $CLIENT_PID${NC}"
echo -e "    ${DIM}Stop:${NC} ${YELLOW}./scripts/reset-system.sh${NC}"
echo
echo -e "  ${DIM}Press Ctrl+C to stop both processes${NC}"

# Function to cleanup on exit
cleanup() {
    echo
    echo -e "  ${YELLOW}▸${NC} Shutting down…"
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    echo -e "    ${GREEN}✓${NC} ${DIM}stopped all processes${NC}"
    exit 0
}

# Set up trap to cleanup on Ctrl+C
trap cleanup INT

# Wait for both processes
wait $SERVER_PID $CLIENT_PID
