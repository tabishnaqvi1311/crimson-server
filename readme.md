### how to run server

npm run compile

npm run dev (also compiles)

### to run with docker

- `docker build -t crimson-server .`
- `docker run -d -p 8080:8080 --env-file .env --name crimson-server crimson-server`
