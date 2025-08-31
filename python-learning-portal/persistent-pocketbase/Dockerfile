FROM spectado/pocketbase:latest

# Install AWS CLI and utilities (Alpine Linux)
RUN apk add --no-cache \
    aws-cli \
    curl \
    tar \
    gzip

# Copy startup script with explicit permissions
COPY start-with-persistence.sh /usr/local/bin/start-with-persistence.sh
RUN chmod +x /usr/local/bin/start-with-persistence.sh

# Set working directory
WORKDIR /pb_data

# Expose port
EXPOSE 80

# Use our startup script
ENTRYPOINT ["/usr/local/bin/start-with-persistence.sh"]