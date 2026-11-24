#!/bin/bash
# The site now runs as one Node server with its database. This starts the full local preview.
cd "$(dirname "$0")" || exit 1
exec ./start-admin-preview.command
