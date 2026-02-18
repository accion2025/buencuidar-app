# Políticas de creación de la "Agenda de Cuidado Básico" y de la "Agenda de Cuidado BC PULSO"

Este documento define las reglas de negocio, los permisos de acceso y los catálogos de actividades que rigen la creación y edición de las agendas en BuenCuidar V1.0.

---

## 1. Reglas Generales de Creación

### 1.1 Diferenciación por Suscripción
La capacidad de crear o editar una agenda depende estrictamente del plan del usuario:
*   **Plan Base**: Solo permite la selección de "Servicios" (Agenda Básica). Se guarda como texto descriptivo.
*   **Plan Pulso**: Habilita la "Agenda Profesional" (BC PULSO). Permite asignar horarios específicos y genera datos estructurados (JSON) para el monitor de bienestar.

### 1.2 Regla de Inmutabilidad
No se permite la creación ni modificación de agendas para citas con estado `finalized`, `cancelled` o citas cuya fecha sea anterior a la actual.

---

## 2. Catálogo: Servicio Básico (Intención de Cuidado)
Este catálogo se utiliza en el **Plan Base**. Su objetivo es informar al cuidador sobre las necesidades generales de la familia.

### Categorías y Actividades:
*   **Vida Diaria y Autonomía**
    *   Aseo personal básico
    *   Apoyo en movilidad
    *   Organización del día
*   **Hogar y Rutina**
    *   Preparación sencilla de alimentos
    *   Apoyo en tareas ligeras
    *   Recordatorio de actividades
*   **Compañía y Bienestar Emocional**
    *   Compañía activa
    *   Acompañamiento emocional
    *   Actividades recreativas
*   **Movilidad y Traslados**
    *   Acompañamiento fuera del hogar
    *   Apoyo en citas y gestiones
    *   Traslados seguros
*   **Apoyo Familiar y Coordinación**
    *   Comunicación con la familia
    *   Seguimiento de rutinas
    *   Organización de agenda
*   **Movimiento y Activación**
    *   Caminatas suaves
    *   Ejercicios ligeros
    *   Estiramientos básicos
*   **Cuidado Humanizado**
    *   Presencia cercana
    *   Atención personalizada
    *   Apoyo en momentos delicados

---

## 3. Catálogo: Servicio BC PULSO (Agenda Profesional)
Este catálogo se utiliza en el **Plan Pulso**. Requiere la asignación de un **horario** para cada actividad seleccionada.

### Categorías y Actividades:
*   **Acompañamiento Cognitivo**
    *   Conversación guiada, Lectura acompañada, Juegos de memoria, Recordatorio de rutinas, Revisión de fotos, Escritura/dibujo, Música, Orientación.
*   **Asistencia de Movilidad**
    *   Caminata supervisada, Apoyo al levantarse/sentarse, Traslado cama-silla, Apoyo en baño seguro, Calzado, Silla de ruedas, Desplazamiento hogar, Acompañamiento externo.
*   **Gestión de Vida Dependiente**
    *   Organización del día, Supervisión de descanso, Comidas, Higiene personal, Cambio de ropa, Supervisión general, Rutina nocturna, Comunicación familia.
*   **Apoyo Técnico Avanzado**
    *   Apoyo en procedimientos indicados, Seguimiento de indicaciones, Curaciones básicas, Hidratación especial, Uso de equipos, Registro de indicadores, Coordinación profesional.
*   **Cuidado Conectivo**
    *   Conversación afectiva, Compartir merienda, Juegos de mesa, Ver programas juntos, Paseo corto, Manualidades, Música, Videollamadas.
*   **Cuidado Técnico**
    *   Organización de rutinas especiales, Ejercicios guiados, Preparación adaptada de alimentos, Registro detallado, Uso de apoyos técnicos, Higiene asistida avanzada.
*   **Cuidado de Alta Especialización**
    *   Seguimiento de planes externos, Supervisión continua, Apoyo en procesos delicados, Registro ampliado, Atención prolongada, Observación continua.
*   **Apoyo en el Hogar y Alimentación**
    *   **Alimentación**: Preparación/calentado, Corte/adaptación, Supervisión, Horarios, Hidratación.
    *   **Orden Básico**: Espacio personal, Limpieza de área, Cambio de sábanas, Lavado de ropa.
    *   **Logística**: Compras pequeñas, Recepción de pedidos, Despensa, Lista de compras.

---

## 4. Almacenamiento Técnico
*   **Intención de Cuidado (Básico)**: Se guarda en la columna **`details`** (tipo `text`). Incluye los labels de los servicios seleccionados y un JSON stringificado con sus IDs entre marcadores `---SERVICES---`.
*   **Hoja de Ruta Operativa (PULSO)**: Se guarda en la columna **`care_agenda`** (tipo `jsonb`). Es un arreglo de objetos con `activity`, `time` y `program_name`.

---

## 5. Momentos de Definición

### 5.1 Intención de Cuidado (Agenda Básica)
1.  **Momento**: En la **Pantalla de Creación/Edición** de la cita.
2.  **Acción**: El usuario selecciona los items del "Explorador de Servicios" (ej. "Aseo personal básico", "Apoyo en movilidad").
3.  **Resultado**: Se genera el texto descriptivo del plan en la columna `details`.

### 5.2 Hoja de Ruta Operativa (Agenda BC PULSO)
1.  **Momento**: **Después de creada la cita**, a través del modal "Configurar Agenda BC PULSO".
2.  **Acción**: El usuario asigna horas específicas a las actividades técnicas de los programas (ej. "Acompañamiento Cognitivo", "Asistencia de Movilidad").
3.  **Resultado**: Se actualiza la columna `care_agenda` con la estructura JSON necesaria para el monitoreo y reportes.
