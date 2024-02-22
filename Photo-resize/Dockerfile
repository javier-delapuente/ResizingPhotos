# Use la imagen oficial de Node.js como base
FROM node:14-slim

# Crea un directorio de trabajo
WORKDIR /app

# Copia el archivo package.json y package-lock.json al directorio de trabajo
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código al directorio de trabajo
COPY . .

# Exponer el puerto 8080
EXPOSE 8080

# Ejecuta el archivo index.js cuando se inicie el contenedor
CMD ["node", "index.js"]