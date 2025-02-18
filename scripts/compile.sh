START_TIME=$(date +%s)
npx tsc
EXIT_CODE=$?
END_TIME=$(date +%s)
ELAPSED_TIME=$((END_TIME - START_TIME))

GREEN="\033[0;32m"
RED="\033[0;31m"
NC="\033[0m" # No Color

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✔ tsc compiled in ${ELAPSED_TIME} seconds${NC}"
else
    echo -e "${RED}"✘ tsc compilation failed with exit code $EXIT_CODE in ${ELAPSED_TIME} seconds"${NC}" 
fi

exit $EXIT_CODE