# Políticas de Notificaciones - BuenCuidar V1.0

Este documento define los eventos que disparan notificaciones dentro de la plataforma para los roles de Familia y Cuidador.

## 1. Usuario Familia 🏠

El usuario de tipo familia recibirá notificaciones en los siguientes casos:

*   **Postulaciones**: Al recibir una nueva postulación de un cuidador para una cita publicada.
*   **Respuestas a Solicitudes**: Al recibir la aceptación o rechazo de una solicitud directa enviada a un cuidador.
*   **Actividad en Curso**: Cuando un cuidador completa una actividad programada durante un turno activo.
*   **Reporte PULSO**: Al recibir un nuevo reporte de bienestar enviado por el cuidador al finalizar o durante el turno.
*   **Confirmaciones de Lectura**: Al recibir confirmación de que el cuidador ha visto avisos importantes (cancelaciones, cambios de fecha/hora o agenda). *Nota: Pinchar estas notificaciones redirige al DASHBOARD.*
*   **Avisos Automáticos vía Chat**: Recepción de un mensaje automático en el chat cuando el cuidador es notificado de cambios críticos en sus citas asignadas.

---

## 2. Usuario Cuidador 👩‍⚕️

El usuario de tipo cuidador recibirá notificaciones en los siguientes casos:

*   **Estado de Postulación**: Al recibir la aprobación o denegación de una postulación realizada a una vacante.
*   **Cancelaciones**: Aviso inmediato cuando una familia cancela una cita previamente confirmada.
*   **Reprogramaciones**: Aviso cuando hay cambios en la fecha u hora de una cita asignada.
*   **Cambios en Agenda**: Aviso cuando el usuario familia modifica las tareas o instrucciones (agenda) de una cita.
*   **Solicitudes Directas**: Al recibir una invitación o solicitud directa de un usuario familia para cubrir un servicio.
*   **Calificaciones y Reseñas**: Al recibir una calificación (estrellas) y reseña de un usuario familia tras completar un turno.

---

## 3. Comportamiento Estándar 📲

Para todos los tipos de notificaciones mencionados, se establece la siguiente regla de navegación:

*   **Redirección Inteligente**: Al hacer clic o "pinchar" sobre una notificación, la aplicación redirigirá automáticamente al usuario a la sección o página específica relacionada con el evento (por ejemplo, al detalle de la cita, al perfil del cuidador o a la bitácora PULSO).---

## 4. Tabla de Redireccionamiento 📍

La siguiente tabla resume el destino al que será dirigido el usuario al interactuar con cada tipo de notificación:

| Perfil | Tipo de Notificación | Destino (Página) |
| :--- | :--- | :--- |
| **FAMILIA** | Postulación a una cita publicada | DASHBOARD |
| **FAMILIA** | Respuesta a solicitud hecha a un cuidador | DASHBOARD |
| **FAMILIA** | Actividad completada por el cuidador | BC PULSO |
| **FAMILIA** | Recepción de reporte de bienestar | BC PULSO |
| **CUIDADOR** | Aprobación o denegación de postulación | BOLSA DE TRABAJO |
| **CUIDADOR** | Aviso de cancelación de cita | BOLSA DE TRABAJO |
| **CUIDADOR** | Cambio de fecha u hora en una cita | MIS TURNOS / PRÓXIMOS |
| **CUIDADOR** | Cambio de agenda de cuidado | MIS TURNOS / PRÓXIMOS |
| **CUIDADOR** | Solicitud directa de usuario familia | DASHBOARD |
| **FAMILIA** | Confirmación: Cuidador vio aviso de cancelación | DASHBOARD |
| **FAMILIA** | Confirmación: Cuidador vio cambio de fecha/hora | DASHBOARD |
| **FAMILIA** | Confirmación: Cuidador vio cambio de agenda | DASHBOARD |
