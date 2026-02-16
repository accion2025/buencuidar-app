# PUNTO DE RESTAURACIÓN: Refinamiento de Direcciones en Calendario
Fecha: 2026-02-14

## Estado Alcanzado
- [x] **Distinción Estricta**: Etiqueta "Dirección del Servicio" implementada consistentemente.
- [x] **Fallback Inteligente**: Se muestra la dirección del cliente solo si no hay una específica del servicio, evitando el texto "no especificada".
- [x] **Corrección de Propagación**: La dirección (ej. "Motimbo") ahora fluye correctamente desde la lista de turnos al modal en la vista de cuidador.
- [x] **Validación en Wizard**: El Paso 4 del asistente ahora muestra la dirección para revisión.
- [x] **Bug de Edición**: Corregida la pérdida de dirección al editar actividades de días individuales.

## Archivos Clave Afectados
1.  `src/components/dashboard/ServiceGroupModal.jsx` (Visualización)
2.  `src/components/dashboard/ShiftDetailsModal.jsx` (Visualización individual)
3.  `src/components/dashboard/CreateServiceWizard.jsx` (Validación en Step 4)
4.  `src/pages/dashboard/CalendarPage.jsx` (Persistencia en edición restringida)
5.  `src/pages/caregiver/MyShifts.jsx` (Paso de datos al modal)

---
Punto de restauración creado por Antigravity.
