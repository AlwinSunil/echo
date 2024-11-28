# Use the official Go image as a base
FROM golang:1.23-alpine

# Set the working directory to /app inside the container
WORKDIR /app

# Copy the Go module files and install dependencies
COPY go.mod go.sum ./
RUN go mod tidy

# Copy the entire Go project to the /app directory inside the container
COPY . .

# Build the Go binary. Make sure the binary is named "main"
RUN go build -o /app/main .

# Expose the port that the Go server will run on
EXPOSE 3000

# Start the Go application by running the "main" binary
CMD ["/app/main"]
