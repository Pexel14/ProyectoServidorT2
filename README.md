# ProyectoServidorT2 — Tienda Online

Tienda Online desarrollada con **Angular 17+** y **Supabase** como backend (autenticación, base de datos PostgreSQL y almacenamiento de archivos).


---

## Descripción

Permite a los usuarios registrarse, explorar el catálogo de productos, añadirlos al carrito, crear un pedido y ver sus pedidos. Incluye un **panel de administración** protegido por rol para gestionar productos, pedidos y usuarios.

### Funcionalidades principales

- Registro e inicio de sesión con validación de formularios
- Autenticación JWT con persistencia de sesión (Supabase Auth)
- Catálogo de productos con búsqueda y filtrado
- Carrito de compra y creación de pedidos
- Historial de pedidos del usuario con estados y filtros
- Perfil editable con foto de avatar (Supabase Storage)
- Panel admin: CRUD de productos, gestión de pedidos y usuarios
- Guards de ruta (`authGuard`, `roleGuard`) e interceptor JWT
- Notificaciones globales y loaders de carga

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 17+ (Standalone Components, Signals, Reactive Forms) |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Lenguaje | TypeScript |
| Estilos | SCSS |
| Despliegue | Netlify |

---

## Instalación y ejecución local

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd ProyectoServidorT2
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Edita el archivo `src/environments/environment.ts` con tus credenciales de Supabase:

```typescript
export const environment = {
  supabaseUrl: 'TU_SUPABASE_URL',
  supabaseKey: 'TU_SUPABASE_ANON_KEY'
};
```

> Puedes obtener estos valores en **Supabase Dashboard → Project Settings → API**.

### 4. Ejecutar el servidor de desarrollo en local

```bash
ng serve
```

Navega a `http://localhost:4200/`.

### 5. Build de producción

```bash
ng build
```

Los artefactos se generan en `dist/`. Esta carpeta es la que se despliega en Netlify.

---

## Variables de entorno requeridas

| Variable | Descripción |
|----------|-------------|
| `supabaseUrl` | URL del proyecto Supabase |
| `supabaseKey` | Clave pública `anon` del proyecto Supabase |

---

## Cuentas de prueba

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Administrador | `admin@admin.com` | `admin123` |
| Usuario normal | `user@user.com` | `user123` |

- El **administrador** tiene acceso a `/admin/productos`, `/admin/pedidos` y `/admin/usuarios`.
- El **usuario** puede navegar el catálogo, añadir productos al carrito, crear y ver sus pedidos.

---

## Estructura del proyecto

```
src/app/
├── core/
│   ├── guards/          # authGuard (sesión) y roleGuard (rol admin)
│   ├── interceptors/    # AuthInterceptor — añade token JWT a las peticiones
│   ├── services/        # AuthService, NotificationService, StorageService
│   └── pages/           # Página 404 (Not Found)
├── features/
│   ├── auth/            # Login, Register, UserService
│   ├── products/        # Catálogo, CRUD admin, ProductService, CartService
│   ├── orders/          # Listado de pedidos, filtros, OrderService
│   └── admin/           # Panel admin (productos, pedidos, usuarios)
└── shared/
    └── components/      # Navbar, AlertCard, modales reutilizables
```

---

## Modelo de Datos
```java
    profiles (1:N) Pedidos : "realiza"
    Productos (1:N)  Pedido_items : "incluido en" 
    Pedidos (1:N) Pedido_items : "contiene" 
    auth_users (1:1) profiles : "extiende" 

    profiles {
        uuid id PK
        text full_name
        text avatar_url
        text role "admin | user"
        text email
    }

    Productos {
        int8 id PK
        text nombre
        numeric precio
        int8 cantidad
        text imagen
    }

    Pedidos {
        int8 id PK
        uuid id_user FK
        text state
        text ciudad
        numeric total
    }

    Pedido_items {
        int8 id PK
        int8 pedido_id FK
        int8 producto_id FK
        int8 cantidad
        numeric precio_unitario
    }
```

## URL de despliegue

La aplicación está desplegada en Netlify:

**[https://proyectoservidor.netlify.app/login](https://proyectoservidor.netlify.app/login)**

---