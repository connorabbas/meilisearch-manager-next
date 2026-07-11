#!/usr/bin/env bash

set -e

curl -fsSL https://opencode.ai/install | bash
PATH="/home/node/.opencode/bin:$PATH"

chown -R 1000:1000 /workspace && npm i