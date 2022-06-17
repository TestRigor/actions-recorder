#!/usr/bin/env bash

PURPLE='\033[0;35m'
NC='\033[0m'
GREEN='\033[0;32m'

printf "${PURPLE}Uploading ...${NC}\n"
az storage blob upload --connection-string "${STORAGE_ACCOUNT_CONNECTION_STRING}" -f lib/actions-recorder.min.js -c '$root' -n actions-recorder.min.js --overwrite true
printf "${GREEN}Done${NC}\n"
