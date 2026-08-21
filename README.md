# EventManager Mobile

Aplicación móvil separada en React + Ionic + Capacitor para consumir la misma API del backend.

## Arranque

```bash
cd mobile
pnpm install
pnpm dev
```

## Capacitor

```bash
pnpm cap:sync
pnpm cap:android
pnpm cap:ios
```

## Variables de entorno

Crear `.env` con la URL del backend que vaya a usar la app.

Para navegador local:

```bash
VITE_API_URL=http://localhost:3001/api
```

Para Android físico en la misma Wi-Fi:

```bash
VITE_API_URL=http://192.168.1.50:3001/api
```

Para emulador Android:

```bash
VITE_API_URL=https://10.0.2.2:3443/api
```

Si el backend está en la misma máquina y querés usar el emulador Android, usá la URL HTTPS del backend local y evitá `http` para que no aparezca mixed content.

### Backend HTTPS local

Si levantás el backend con `mkcert`, podés usar:

```bash
VITE_API_URL=https://10.0.2.2:3443/api
```

Comandos:

```bash
cd backend
pnpm dev:https
```

El certificado local vive en `backend/certs/localhost.pem` y `backend/certs/localhost-key.pem`.

Si abrís el backend desde el navegador usando la IP de tu máquina, por ejemplo `https://192.168.0.24:3443`, ese host también está incluido en el certificado local generado. También está incluido `10.0.2.2` para el emulador Android.

Si no querés tocar el archivo cada vez, podés crear variantes como `.env.local`,
`.env.android` o usar exportación de variables antes de compilar.
