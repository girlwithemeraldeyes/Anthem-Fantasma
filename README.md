npm install debug
npm install mongoose
npm install dotenv
____________________
npm install bcryptjs
npm install core-js@2 --save (NO HACE FALTA QUE LO INSTALES PORQUE LO HE HECHO PARA 
SOLUCIONAR EL PROBLEMA CON NODE MODULES).
npm install reactstrap bootstrap

_ _ _ _ _ _ _ _ _ 
# 1) Crear la carpeta del frontend (/frontend) con su propio package.json de Vite
npm create vite@latest frontend -- --template react
npm install react-router-dom

# 2) Instalar dependencias del frontend
cd frontend
npm install
npm install reactstrap bootstrap
npm run build --> se crea la carpeta dist en /frontend --> frontend/dist

# 3) configurar el proxy en frontend/vite.config.js

# 4) Arrancar todo para DESARROLLO

# Terminal A (backend):
cd ..           # vuelve a la raíz del proyecto
npm start       # o "node ./bin/www" si ese es tu script

# Terminal B (frontend):
cd frontend
npm run dev     # abrir http://localhost:5173

En Powershell para ejecutar el proyecto (si se logra ejecutar esto es porque se ha logrado conectar el frontend al backend):
$env:NODE_ENV="production"; npm start


