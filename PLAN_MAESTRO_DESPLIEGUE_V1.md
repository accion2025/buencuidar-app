# 🚀 Plan Maestro: De V1.0 a V1.1 (Despliegue y Control)

## Fase 1: Asegurar el Presente (Snapshot V1.1)
*El objetivo es "tomar una foto" de todo el trabajo de Cuidado+ para que nada se pierda.*
1.  **Commit Maestro**: Guardar todo el estado actual en el repositorio Git.
2.  **Rama Vanguardia**: Crear la rama `develop/v1.1` donde vivirá Cuidado+.

## Fase 2: Extracción Quirúrgica (Nace la V1.0)
*Aquí creamos la versión "Luz" con todas las mejoras estéticas pero sin Cuidado+.*
1.  **Crear Rama**: `release/v1.0` (deriva de la v1.1 actual).
2.  **Limpieza Rápida**:
    *   Desactivar los botones de "Cuidado+" en el Dashboard.
    *   Ocultar las rutas del menú lateral para paquetes.
    *   **Lo que se queda**: Terminología "Persona atendida", diseño premium, carga rápida de notificaciones.

## Fase 3: Configuración en la Nube (Vercel)
*Alineamos Vercel con la nueva estructura.*
1.  **Producción**: Seleccionar `release/v1.0` como la rama oficial.
2.  **Vista Previa**: Dejar `develop/v1.1` para probar Cuidado+ en una URL privada.

## Fase 4: Refinamiento V1.0
*Trabajo sobre la rama de producción.*
1.  Ajustes de texto, colores y terminología.
2.  Despliegue instantáneo mediante Vercel tras cada commit.

## Fase 5: El "Puente" de Sincronización
*Mantenimiento de ambas versiones al día.*
1.  Integrar (merge) los arreglos de la **V1.0** dentro de la **V1.1**.
2.  La **V1.1** siempre hereda la estabilidad de la **V1.0**.

## Fase 6: El Gran Lanzamiento (V1.1)
1.  Cambiar en Vercel la rama de Producción de `release/v1.0` a `develop/v1.1`.
2.  **Resultado**: Actualización instantánea para los usuarios.

---

### 📊 Cuadro Resumen de Ramas

| Rama | Contenido | URL en Vercel | Propósito |
| :--- | :--- | :--- | :--- |
| **`release/v1.0`** | App estándar + Mejoras estéticas | `app.tusitio.com` | **Producción (Público)** |
| **`develop/v1.1`** | App completa + BC Cuidado+ | `test-v11.tusitio.com` | **Laboratorio (Privado)** |
