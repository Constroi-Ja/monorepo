#!/bin/bash
set -e

# Create a default database with the same name as the user to avoid connection errors
# This prevents "database does not exist" errors when tools try to connect using the username
# Note: This script runs only on first initialization when /var/lib/postgresql/data is empty

# Check if the user database already exists
DB_EXISTS=$(psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -tc "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_USER'" || echo "")

if [ -z "$DB_EXISTS" ]; then
    # Create the database if it doesn't exist
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        CREATE DATABASE "$POSTGRES_USER";
EOSQL
fi
