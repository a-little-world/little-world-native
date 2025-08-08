#!/bin/bash
# Author: Tim Schupp
# Creates a nginx container, rerouts a development frontent 
# to be served *with* the backend api trough one container
# Allows to bypass same-site and cors oring of browser without modifying backend

# Reconfigure to your needs, lists are interated pair-wise
SERVER_URL=( "host.docker.internal:9000" "host.docker.internal:8000" )
PROXY_PATH=( "/" "/api/" )
SERVER_PATH=( "/" "/api/" )

# The port under which the routes will be availabol -> default: localhost:3333
ACESS_PORT="9001"

# Edit to your needs
read -r -d '' PATHS << EOM
location VAR_PATH {
    proxy_pass http://VAR_SERVERVAR_P_PROXY;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_cache_bypass \$http_upgrade;
}
EOM
ALL_PATHS=""

for i in "${!SERVER_URL[@]}"; do
    printf 'Server at "%s" w. path "%s" at proxy path "%s" \n' "${SERVER_URL[i]}" "${SERVER_PATH[i]}" "${PROXY_PATH[i]}"
    echo 
    EXTRA_PATH=$(echo "$PATHS" | sed "s|VAR_PATH|${PROXY_PATH[i]}|g" | sed "s|VAR_SERVER|${SERVER_URL[i]}|g" | sed "s|VAR_P_PROXY|${SERVER_PATH[i]}|g" )
    ALL_PATHS+="$EXTRA_PATH"
    ALL_PATHS+=$'\n\n'
done
echo "$ALL_PATHS"

# Default nginx config used, adopt to your needs
read -r -d '' CONFIG << EOM
worker_processes  4;
user              www-data;

events {
    use           epoll;
    worker_connections  128;
}

http {

	sendfile on;
	tcp_nopush on;
	tcp_nodelay on;
	keepalive_timeout 65;
	types_hash_max_size 2048;

	include /etc/nginx/mime.types;
	default_type application/octet-stream;

	ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3; # Dropping SSLv3, ref: POODLE
	ssl_prefer_server_ciphers on;

	gzip on;

    server {
        listen       80;
        server_name  localhost;
        include /etc/nginx/mime.types;

$ALL_PATHS

        }

}
EOM

# Write config to use by container
echo "$CONFIG" > nginx.conf

docker stop nginx-proxy # Stop old image
docker rm -v nginx-proxy # Remove old image
# Start routing container
docker run \
    --name nginx-proxy \
    --add-host=host.docker.internal:host-gateway \
    -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro \
    -p $ACESS_PORT:80 \
    -d nginx
