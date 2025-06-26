# Elysia with Bun runtime

## Getting Started
To get started with this template, simply paste this command into your terminal:
```bash
bun create elysia ./elysia-example
```

## Development
To start the development server run:
```bash
bun run dev
```

Open http://localhost:3000/ with your browser to see the result.

## Docker Deployment
To build the Docker image:
```bash
docker build -t os-process-api .
```

To run the Docker container:
```bash
docker run -p 3000:3000 os-process-api
```
