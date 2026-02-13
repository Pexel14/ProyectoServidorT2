# ProyectoServidorT2 - Tienda Online

Este proyecto es una aplicación de comercio electrónico desarrollada con **Angular 17+** y **Supabase** como backend (Base de datos y Autenticación).

## Descripción

La aplicación permite a los usuarios registrarse, explorar productos, añadirlos al carrito y realizar pedidos. Incluye un panel de administración para gestionar productos, pedidos y usuarios.

## Tecnologías

*   **Frontend:** Angular 17+ (Standalone Components, Signals, Reactive Forms)
*   **Backend:** Supabase (PostgreSQL, Auth, Storage)
*   **Lenguaje:** TypeScript
*   **Estilos:** SCSS

## Instalación y Despliegue Local

1.  **Clonar el repositorio:**
    ```bash
    git clone <url-del-repo>
    cd ProyectoServidorT2
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo o asegúrate de tener `src/environments/environment.ts` con tus credenciales de Supabase:
    ```typescript
    export const environment = {
      supabaseUrl: 'TU_SUPABASE_URL',
      supabaseKey: 'TU_SUPABASE_ANON_KEY'
    };
    ```

4.  **Ejecutar el servidor de desarrollo:**
    ```bash
    ng serve
    ```
    Navega a `http://localhost:4200/`.

## Cuentas de Prueba

Para probar la aplicación puedes usar las siguientes credenciales o registrar un usuario nuevo.

*   **Administrador:**
    *   Email: `admin@admin.com`
    *   Password: `password` (o la que hayas configurado)
    *   Rol: Tiene acceso completo a /admin/productos, /admin/usuarios, etc.

*   **Usuario:**
    *   Email: `user@user.com`
    *   Password: `password`
    *   Rol: Puede ver productos y hacer pedidos.

## Estructura del Proyecto

*   `src/app/core`: Guardias, Interceptores y Servicios globales (Auth, Storage).
*   `src/app/features`: Módulos funcionales (Auth, Productos, Admin, Orders).
*   `src/app/shared`: Componentes reutilizables (Navbar, Alertas).

## URL de Despliegue

La aplicación está desplegada en: **[TU_URL_VERCEL_NETLIFY]**

---
Desarrollado para el módulo de Desarrollo Web en Entorno Servidor.

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
