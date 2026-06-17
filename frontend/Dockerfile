# Stage 1: Build the React app
FROM node:20-alpine AS build

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL:-/api}

WORKDIR /app
COPY package*.json ./
RUN npm install   # this will generate node_modules (including dev dependencies for build)
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]