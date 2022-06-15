#!/usr/bin/env bash

PURPLE='\033[0;35m'
NC='\033[0m'
GREEN='\033[0;32m'

printf "${PURPLE}Authenticating ...${KUBECONFIG}${NC}\n"
az login --service-principal -u "${AZURE_CLIENT_ID}" -p "${AZURE_CLIENT_SECRET}" -t "${AZURE_TENANT_ID}" --output none
az account set --subscription "${AZURE_SUBSCRIPTION_ID}"
printf "${GREEN}Done${NC}\n"

printf "${PURPLE}Uploading ...${KUBECONFIG}${NC}\n"
az storage blob upload --connection-string "${STORAGE_ACCOUNT_CONNECTION_STRING}" -f lib/actions-recorder.min.js -c '$root' -n actions-recorder.min.js --overwrite true
printf "${GREEN}Done${NC}\n"
