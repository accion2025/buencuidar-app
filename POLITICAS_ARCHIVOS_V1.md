# Políticas de Manejo de Fotos y Documentos V1.0

Este documento define los procedimientos técnicos y de negocio para la captura, procesamiento, almacenamiento y gestión de archivos (imágenes y PDFs) dentro de la plataforma BuenCuidar.

---

## 1. Flujo de Procesamiento y Carga (Frontend)

Para garantizar la estabilidad en dispositivos móviles y optimizar el uso de ancho de banda, se aplican las siguientes reglas:

### 1.1 Pre-procesamiento (RAM Safe)
- **Redimensionamiento**: Todas las imágenes subidas desde dispositivos móviles son redimensionadas automáticamente antes de la carga.
    - **Avatares**: Máximo 1200px (ancho o alto).
    - **Documentos**: Máximo 1500px (ancho o alto).
- **Formato**: Se convierte toda imagen a `image/jpeg` con una calidad del 80-85% para balancear nitidez y peso.
- **Recorte (Cropping)**: Las fotos de perfil deben pasar obligatoriamente por el componente `ImageCropper` para asegurar una relación de aspecto 1:1.

### 1.2 Resiliencia de Conexión
- **Reintentos**: El sistema realiza hasta **3 intentos automáticos** en caso de fallo de red.
- **Timeout**: Se permite una ventana de carga de hasta **120 segundos** por archivo.
- **Heartbeat**: Durante la carga, el sistema emite señales de estado ("latidos") para evitar que el navegador móvil suspenda el proceso.

---

## 2. Estrategia de Almacenamiento (Supabase Storage)

Los archivos se separan en contenedores (Buckets) según su nivel de sensibilidad:

| Bucket | Contenido | Visibilidad | Acceso |
| :--- | :--- | :--- | :--- |
| `avatars` | Fotos de perfil | Pública | Lectura libre, Escritura protegida (RLS) |
| `documents` | Identidad, Penales, Licencias | Privada | Solo Dueño y Admin (RLS) |

### Estructura de Rutas:
Los archivos se organizan por el ID único del usuario:
`{bucket}/{user_id}/{tipo_documento}-{timestamp}.{ext}`

---

## 3. Registro y Vinculación (Base de Datos)

### 3.1 Perfil de Usuario
- La URL resultante de la foto de perfil se guarda en `profiles.avatar_url`.

### 3.2 Gestión Documental
- Los documentos profesionales se registran en la tabla `caregiver_documents`.
- **Estados**:
    - `pending`: Recién subido, espera revisión humana.
    - `verified`: Validado por administración.
    - `rejected`: Rechazado (requiere motivo de rechazo).

### 3.3 Estatus de Verificación
- Al subir el primer documento, el `profiles.verification_status` cambia automáticamente de `pending` a `in_review`.

---

## 4. Políticas de Edición y Ciclo de Vida

### 4.1 Reemplazo (Sobrescritura Lógica)
- El usuario puede "Actualizar" un documento en cualquier momento.
- Al subir un nuevo archivo, el registro en la base de datos se actualiza mediante `upsert`, vinculando la nueva ruta y marcando el estado nuevamente como `pending`.

### 4.2 Eliminación Física (Implementado V1.0.33)
- **Eliminación Directa**: Se han añadido botones de "Eliminar" en Perfil y Portal de Verificación que ejecutan `.remove()` en el Storage.
- **Limpieza por Reemplazo**: Antes de subir un nuevo avatar o documento, el sistema identifica la ruta previa y borra el archivo físico para evitar acumulación de "archivos huérfanos".
- **Reversión de Estatus**: Al eliminar el último documento de verificación, el estatus del perfil vuelve automáticamente a `pending`.

### 4.3 Restricciones
- No se permite la eliminación definitiva de un documento verificado sin previa solicitud a soporte, para mantener la integridad de la validación del cuidador.
