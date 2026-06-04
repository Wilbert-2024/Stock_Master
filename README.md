# StokMaster

Aplicacion movil para gestion offline de inventario, ventas, alertas, reportes y respaldos de una pulperia.

## Requisitos

- Node.js compatible con Expo SDK 54.
- Expo Go compatible con SDK 54.

## Comandos

Instalar dependencias:

```bash
npm install
```

Iniciar el proyecto:

```bash
npx expo start --clear
```

Si necesitas usar tunel:

```bash
npx expo start --tunnel
```

Verificar compilacion Android:

```bash
npx expo export --platform android --output-dir .expo-export-check
```

## Estructura principal

- `src/app`: pantallas y rutas con Expo Router.
- `src/components/ui`: componentes globales de interfaz.
- `src/constants`: reglas de unidades y formatos.
- `src/database`: conexion, migraciones y repositorios SQLite.
- `src/services`: logica de inventario, ventas, categorias, reportes y respaldos.
- `src/theme`: modo dia/noche de la aplicacion.
- `assets/images`: imagenes usadas por la app y configuracion de Expo.
