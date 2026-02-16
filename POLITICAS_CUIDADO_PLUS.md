# Políticas Oficiales: Paquetes de Servicio "Cuidado+"

Este documento centraliza las reglas de negocio, restricciones y políticas operativas aplicables a los servicios de tipo **Cuidado+** en la plataforma BuenCuidar.

*Última actualización: 13 de Febrero de 2026*

## 1. Definición y Alcance
Los paquetes "Cuidado+" son servicios de larga duración diseñados para ofrecer continuidad en el cuidado, permitiendo gestionar múltiples citas bajo un mismo agrupador lógico (`service_group_id`).

### Requisitos de Acceso
*   **Roles Permitidos:** `Admin`, `Caregiver`.
*   **Planes de Suscripción (Familiares):** El usuario debe tener una suscripción activa que incluya los términos:
    *   `cuidado`
    *   `plus`
    *   `premium`
    *   `gold`

---

## 2. Restricciones de Tiempo y Duración
Estas reglas se validan tanto en el *Asistente de Creación* (`CreateServiceWizard.jsx`) como en el Backend (`CalendarPage.jsx`).

| Regla | Valor / Descripción | Origen |
| :--- | :--- | :--- |
| **Duración Mínima** | **3 días** | `CreateServiceWizard.jsx` |
| **Duración Máxima** | **30 días** | `CalendarPage.jsx` |
| **Continuidad** | **Obligatoria** (Días consecutivos sin saltos) | Lógica de bucle `while` en generación de fechas |
| **Horarios** | Configurables por día, pero consistentes dentro del paquete inicial | `CalendarPage.jsx` |
| **Validación de Ciclos** | El fin puede ser igual al inicio, pero nunca menor (ej. 09:15 - 09:15 OK) | `CreateServiceWizard.jsx` |
| **Ciclos Cerrados** | **Obligatorio:** Hora de inicio y fin para toda actividad. Sin horarios abiertos. | `CreateServiceWizard.jsx` |
| **Límite de Ciclos** | **Obligatorio:** La hora de fin de un ciclo no puede exceder la hora de término del turno. | `CreateServiceWizard.jsx` |

---

## 3. Políticas de Edición y Modificación (Reglas Detalladas)
Las siguientes reglas aplican estrictamente cuando un usuario intenta modificar los parámetros de un paquete existente a través del Asistente Inteligente o el Panel de Gestión.

### A. Alcance Temporal de los Cambios
*   **Futuro Exclusivo:** Cualquier cambio realizado (horarios, fechas, programas) se aplicará **únicamente a las citas futuras** (citas cuya fecha sea igual o posterior al día actual).
*   **Protección Histórica:** Las citas pasadas, así como aquellas con estado `finalizado` (completed) o `cancelado` (cancelled), son inmutables. El sistema las bloquea para preservar el registro histórico de servicios prestados.

### B. Restricciones de Contenido (Paquete y Día Específico)
Estas reglas aplican tanto para la edición del **paquete completo** como para la modificación de un **día específico**.

1.  **Programas de Cuidado (Nivel Macro)**
    *   **Prohibido Agregar:** No se pueden añadir nuevos programas que no contrato originalmente.
    *   **Permitido Eliminar:** Se pueden deseleccionar programas existentes.
    *   **Regla de Mínimos:** No se permite dejar un día (o el paquete) sin **al menos un programa** seleccionado. El sistema impedirá guardar si se eliminan todos.

2.  **Actividades (Nivel Micro - Paso 3 del Asistente)**
    *   **Totalmente Flexible:** Dentro de los programas activos, **SÍ se permite agregar nuevas actividades**, modificar horarios o eliminar tareas específicas.
    *   **Visualización en Agenda:** La 'Agenda de Cuidado' generada por el Asistente mostrará explícitamente los ciclos completos (Inicio - Fin) para cada actividad.
    *   *Ejemplo:* Si tienes el programa "Movilidad", puedes agregar una nueva actividad de "Caminata vespertina" que antes no estaba, siempre que pertenezca a los programas válidos.

### C. Mecanismo de Actualización Inteligente (Preservación de Datos)
Al guardar los cambios en un paquete, el sistema prioriza la **estabilidad de la asignación**:

1.  **Actualización en Sitio:** El sistema busca las citas existentes del grupo (`service_group_id`) y actualiza su información (horarios, actividades, detalles) **sin eliminarlas**.
    *   *Resultado:* Se mantienen los IDs de cita originales.
2.  **Preservación de Personal:**
    *   Si una cita ya tenía un cuidador asignado (`caregiver_id`), **esta asignación se respeta y mantiene**.
    *   El cuidador asignado verá inmediatamente la información actualizada en su calendario (Sección "Mis Turnos").
3.  **Gestión de Excedentes:** Solo si la nueva duración es menor a la anterior, se eliminarán las citas sobrantes del final del rango. Si la duración aumenta, se crearán nuevas citas para los días adicionales.

### D. Edición vs. Cancelación
*   **Edición:** Modifica la estructura del servicio futuro, **manteniendo intactas las asignaciones de personal** y el historial.
*   **Cancelación:** Elimina la solicitud por completo. Solo debe usarse si el servicio ya no es requerido.

## 4. Ciclo de Vida y Aprobación
El flujo de estados para un paquete Cuidado+ es estricto para garantizar la integridad de los datos.

1.  **Creación (Estado: `pending`):**
    *   El paquete se crea y es visible en el "Tablero de Solicitudes".
    *   **Postulación Indivisible:** Los cuidadores se postulan al **paquete completo**. No es posible postularse a días individuales de un servicio "Cuidado+". El sistema genera automáticamente una solicitud para cada cita del grupo.

2.  **Aprobación (Estado: `confirmed`):**
    *   El cliente selecciona un cuidador.
    *   **Aprobación Atómica:** Al aprobar a un candidato, el sistema:
        *   Confirma **todas** las citas del paquete.
        *   Asigna al cuidador seleccionado a todo el grupo.
        *   **Rechaza automáticamente** todas las postulaciones de otros candidatos para ese mismo paquete.
    *   *Origen:* Función RPC `approve_service_group` (Base de Datos).

3.  **Cancelación:**
    *   **Política Destructiva:** Cancelar una solicitud pendiente elimina permanentemente las citas y todas las postulaciones asociadas. No se conserva en el historial como "Cancelado".

---

## 5. Notificaciones Inteligentes
Para evitar saturación (spam) a los usuarios:

*   **Deduplicación:** Las notificaciones sobre paquetes (nuevas postulaciones, cambios de estado) se agrupan.
    *   Si un cuidador se postula a múltiples días de un mismo paquete, el cliente recibe **una sola notificación**.
    *   Si se aprueba el paquete completo, el cuidador recibe **un solo aviso** de éxito.
*   *Origen:* Triggers `notify_on_new_application` y `notify_on_application_status_change` en SQL.

---

## 6. Reporte de Actividad y Bitácora
Para garantizar la trazabilidad del cuidado, se establece un sistema diferenciado de reporte:

*   **Actividades Breves:** Reporte de cumplimiento simple (Check).
*   **Actividades Extensas (> 1 hora):** Requieren reporte obligatorio de **inicio y fin del ciclo**. El sistema de bitácora cambiará dinámicamente según la duración definida en la agenda.

## 7. Calificaciones y Reseñas
*   **Unicidad:** Solo se permite calificar al cuidador **una vez** por cada cita completada.
*   **Bloqueo de Acción:** Una vez enviada la calificación y reseña, la opción se desactivará permanentemente para esa cita específica para evitar duplicados.
