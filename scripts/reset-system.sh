#!/bin/bash

# Colors / styles
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

RULE="${DIM}────────────────────────────────────────────${NC}"

echo
echo -e "  ${BOLD}Reset · Multi-Agent Observability${NC}"
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

    echo -e "  ${CYAN}▸${NC} Port $port ${DIM}($name)${NC}"

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
                && echo -e "    ${GREEN}✓${NC} ${DIM}killed $PID${NC}" \
                || echo -e "    ${RED}✗${NC} failed to kill $PID"
        done
    else
        echo -e "    ${GREEN}✓${NC} ${DIM}nothing running${NC}"
    fi
}

# Kill server processes
kill_port $SERVER_PORT "server"

# Kill client dev server
kill_port $CLIENT_PORT "client"

# Kill any remaining bun processes related to our apps
echo -e "  ${CYAN}▸${NC} Remaining bun processes"
FOUND_BUN=""
ps aux | grep -E "bun.*(apps/(server|client))" | grep -v grep | awk '{print $2}' | while read PID; do
    if [ -n "$PID" ]; then
        kill -9 $PID 2>/dev/null && echo -e "    ${GREEN}✓${NC} ${DIM}killed $PID${NC}"
    fi
done

# Optional: Clear SQLite WAL files
echo -e "  ${CYAN}▸${NC} SQLite WAL files"
if [ -f "$PROJECT_ROOT/apps/server/events.db-wal" ]; then
    rm -f "$PROJECT_ROOT/apps/server/events.db-wal" "$PROJECT_ROOT/apps/server/events.db-shm"
    echo -e "    ${GREEN}✓${NC} ${DIM}removed${NC}"
else
    echo -e "    ${GREEN}✓${NC} ${DIM}none to clean${NC}"
fi

# Optional: Ask if user wants to clear the database
# echo -e "\n${YELLOW}Database Management${NC}"
# if [ -f "$PROJECT_ROOT/apps/server/events.db" ]; then
#     echo -n "Do you want to clear the event database? (y/N): "
#     read -r response
#     if [[ "$response" =~ ^[Yy]$ ]]; then
#         rm -f "$PROJECT_ROOT/apps/server/events.db"
#         echo -e "    ${GREEN}✓${NC} ${DIM}database cleared${NC}"
#     else
#         echo -e "    ${GREEN}✓${NC} ${DIM}database preserved${NC}"
#     fi
# else
#     echo -e "    ${GREEN}✓${NC} ${DIM}no database found${NC}"
# fi

echo
echo -e "  $RULE"
echo -e "  ${GREEN}${BOLD}✓ Reset complete${NC}"
echo
echo -e "  ${DIM}Start again:${NC} ${YELLOW}./scripts/start-system.sh${NC}"
echo
