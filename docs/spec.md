# Requirements Document

## Introduction

VALORANT Performance Academy (VPA) es una plataforma de alto rendimiento para jugadores de VALORANT organizada como monorepo (Turborepo + pnpm workspaces). Permite a los usuarios adoptar rutinas de entrenamiento de jugadores profesionales, personalizar su duración (7, 14 o 30 días) y registrar su progreso diario. Combina carga manual de ejercicios (Galería) con sincronización automática de partidas Deathmatch (DM) vía la API de Riot Games. El sistema recompensa la consistencia con rachas de días y ofrece feedback dinámico. Todo el ciclo de sesiones se sincroniza con el reinicio global de VALORANT a las 00:00 UTC.

---

## Glossary

- **VPA**: VALORANT Performance Academy — la plataforma completa.
- **Platform**: El sistema VPA en su totalidad (backend + frontend + base de datos).
- **Backend**: Aplicación NestJS que expone la API REST y actúa como proxy de Riot.
- **Frontend**: Aplicación Vue.js 3 que consume la API del Backend.
- **Shared**: Paquete `@vpa/shared` con tipos TypeScript, enums y schemas Zod compartidos.
- **Database**: Instancia de PostgreSQL gestionada por Supabase.
- **Riot_Proxy**: Módulo del Backend responsable de comunicarse con la API de Riot Games.
- **Grading_Engine**: Servicio centralizado del Backend que calcula la nota de un resultado.
- **Session_Scheduler**: Cron Job del Backend que gestiona el ciclo de vida de las sesiones diarias.
- **Auth_Service**: Módulo del Backend que gestiona autenticación y verificación de cuentas Riot.
- **Training_Service**: Módulo del Backend que gestiona compromisos, sesiones y resultados.
- **Social_Service**: Módulo del Backend que gestiona follows y notificaciones.
- **RLS**: Row Level Security — políticas de acceso a nivel de fila en Supabase.
- **Commitment**: Suscripción activa de un usuario a una rutina con duración definida.
- **Daily_Session**: Registro de la sesión de entrenamiento de un usuario para un día concreto.
- **Exercise_Result**: Resultado individual de un ejercicio dentro de una Daily_Session.
- **Routine_Template**: Plantilla de rutina de entrenamiento creada por administradores del sistema.
- **Exercise_Template**: Plantilla de ejercicio individual perteneciente a una Routine_Template.
- **Gallery_Exercise**: Ejercicio de tipo `GALLERY` cuyo resultado se registra manualmente.
- **DM_Exercise**: Ejercicio de tipo `DM` cuyo resultado se sincroniza automáticamente desde Riot.
- **Grade**: Calificación de un Exercise_Result: `BAD`, `PASSABLE` o `EXCELLENT`.
- **Streak**: Contador de días consecutivos completados por un usuario.
- **UTC_Reset**: Evento que ocurre a las 00:00 UTC y marca el inicio de un nuevo día de entrenamiento.
- **riot_match_id**: Identificador único de partida provisto por la API de Riot Games.

---

## Requirements

### Requisito 1: Estructura del Monorepo

**Historia de Usuario:** Como desarrollador, quiero una estructura de monorepo gestionada con Turborepo y pnpm workspaces, para poder desarrollar, construir y probar todos los paquetes de forma coordinada y consistente.

#### Criterios de Aceptación

1. LA Plataforma DEBERÁ organizar su código en un monorepo con los siguientes workspaces: `apps/backend`, `apps/frontend` y `packages/shared`.
2. LA Plataforma DEBERÁ usar Turborepo como herramienta de orquestación de builds, configurada mediante `turbo.json`.
3. LA Plataforma DEBERÁ usar pnpm workspaces como gestor de paquetes.
4. EL paquete Shared DEBERÁ exportar tipos TypeScript, enums y schemas Zod bajo el namespace `@vpa/shared`.
5. CUANDO se aplique una migración de base de datos, LA Plataforma DEBERÁ regenerar los tipos TypeScript en `@vpa/shared` ejecutando `supabase gen types typescript`.

---

### Requisito 2: Gestión de Base de Datos

**Historia de Usuario:** Como desarrollador, quiero que todos los cambios de esquema de base de datos se gestionen exclusivamente mediante migraciones de Supabase, para que el esquema esté versionado, sea reproducible y auditable.

#### Criterios de Aceptación

1. LA Database DEBERÁ definir todas las tablas, índices y restricciones exclusivamente mediante archivos en `supabase/migrations`.
2. LA Database DEBERÁ rechazar la creación manual de tablas fuera del sistema de migraciones.
3. LA Plataforma DEBERÁ soportar inspección y validación agéntica del esquema mediante el Supabase MCP.
4. LA Database DEBERÁ almacenar todos los timestamps en UTC.

---

### Requisito 3: Identidad de Usuario y Perfil

**Historia de Usuario:** Como jugador, quiero crear y gestionar mi perfil, para poder identificarme en la plataforma y vincular mi cuenta de Riot.

#### Criterios de Aceptación

1. LA Plataforma DEBERÁ crear un registro `profiles` para cada usuario al registrarse, vinculado a `auth.users` mediante `id` (uuid).
2. LA Plataforma DEBERÁ garantizar la unicidad del campo `username` en la tabla `profiles`.
3. LA Plataforma DEBERÁ almacenar los siguientes campos de perfil: `username`, `riot_id`, `riot_tag`, `region`, `avatar_url`, `bio`, `title`, `current_streak`, `privacy_mode`, `timezone` y `last_sync_at`.
4. LA Plataforma DEBERÁ inicializar `current_streak` a `0` al crear el perfil.
5. CUANDO un usuario actualice su propio perfil, EL RLS DEBERÁ permitir la actualización solo si `auth.uid() == profiles.id`.
6. CUANDO un perfil tenga `privacy_mode = false`, EL RLS DEBERÁ permitir que cualquier usuario autenticado lo lea.
7. CUANDO un perfil tenga `privacy_mode = true`, EL RLS DEBERÁ restringir el acceso de lectura al propietario del perfil y seguidores aceptados únicamente.

---

### Requisito 4: Sistema Social (Follows)

**Historia de Usuario:** Como jugador, quiero seguir a otros jugadores, para poder ver su progreso e interactuar con la comunidad.

#### Criterios de Aceptación

1. LA Plataforma DEBERÁ almacenar relaciones de seguimiento en una tabla `follows` con campos: `follower_id`, `following_id`, `status` y `created_at`.
2. CUANDO un usuario envíe una solicitud de seguimiento a un perfil público, EL Social_Service DEBERÁ establecer el `status` del follow a `accepted` inmediatamente.
3. CUANDO un usuario envíe una solicitud de seguimiento a un perfil privado, EL Social_Service DEBERÁ establecer el `status` del follow a `pending` hasta que el usuario objetivo la acepte.
4. LA Plataforma DEBERÁ garantizar que `follower_id` y `following_id` referencien entradas válidas en `profiles`.

---

### Requisito 5: Catálogo de Rutinas y Ejercicios

**Historia de Usuario:** Como jugador, quiero explorar un catálogo de rutinas profesionales, para poder elegir un plan de entrenamiento que se ajuste a mis objetivos.

#### Criterios de Aceptación

1. LA Plataforma DEBERÁ almacenar plantillas de rutinas en una tabla `routine_templates` con campos: `id`, `pro_name`, `title`, `description` e `is_active`.
2. LA Plataforma DEBERÁ almacenar plantillas de ejercicios en una tabla `exercise_templates` con campos: `id`, `routine_id`, `name`, `metric_unit`, `type`, `threshold_pass`, `threshold_excellent` e `is_indefinite`.
3. EL campo `exercise_templates.type` DEBERÁ aceptar únicamente los valores `GALLERY` o `DM`.
4. CUANDO un usuario autenticado solicite el catálogo de rutinas, EL RLS DEBERÁ permitir acceso de lectura a todas las `routine_templates` donde `is_active = true`.
5. LA Plataforma DEBERÁ restringir la creación y modificación de `routine_templates` y `exercise_templates` a administradores del sistema.

---

### Requisito 6: Compromisos de Entrenamiento

**Historia de Usuario:** Como jugador, quiero comprometerme con una rutina por una duración definida o indefinida, para poder seguir un plan de entrenamiento estructurado o continuo.

#### Criterios de Aceptación

1. LA Plataforma DEBERÁ almacenar compromisos en una tabla `user_commitments` con campos: `id`, `user_id`, `routine_id`, `duration_days`, `start_date` y `status`.
2. EL campo `user_commitments.duration_days` DEBERÁ aceptar los valores `7`, `14`, `30`, `NULL` o `0` para representar compromisos indefinidos.
3. EL campo `user_commitments.status` DEBERÁ aceptar únicamente los valores `active`, `completed` o `dropped`.
4. CUANDO un usuario cree un nuevo Commitment, EL Training_Service DEBERÁ establecer `status` a `active` y `start_date` al timestamp UTC actual.
5. CUANDO los días activos de un Commitment con `duration_days` definido igualen `duration_days`, EL Training_Service DEBERÁ establecer el `status` del Commitment a `completed`.
6. CUANDO un Commitment tenga `duration_days = NULL` o `duration_days = 0`, EL Commitment DEBERÁ continuar indefinidamente hasta que el usuario lo termine manualmente mediante `status = dropped`.

---

### Requisito 7: Sesiones Diarias

**Historia de Usuario:** Como jugador, quiero que se cree una sesión de entrenamiento diaria para cada día de mi compromiso, para poder rastrear mi progreso diario.

#### Criterios de Aceptación

1. LA Plataforma DEBERÁ almacenar sesiones diarias en una tabla `daily_sessions` con campos: `id`, `commitment_id`, `date`, `status`, `is_gallery_done` e `is_dm_done`.
2. EL campo `daily_sessions.status` DEBERÁ aceptar únicamente los valores `IN_PROGRESS`, `COMPLETED` o `FAILED`.
3. LA Plataforma DEBERÁ garantizar la unicidad del par `(commitment_id, date)` en `daily_sessions`.
4. CUANDO un usuario solicite su entrenamiento de hoy, EL Training_Service DEBERÁ devolver la Daily_Session para la fecha UTC actual junto con el progreso de `is_gallery_done` e `is_dm_done`.
5. CUANDO tanto `is_gallery_done` como `is_dm_done` sean `true` para una Daily_Session, EL Training_Service DEBERÁ establecer el `status` de la sesión a `COMPLETED`.
6. CUANDO el `status` de una Daily_Session se establezca a `COMPLETED`, EL Training_Service DEBERÁ incrementar `profiles.current_streak` en `1` para el usuario correspondiente.

---

### Requisito 8: Resultados de Ejercicios y Grading Engine

**Historia de Usuario:** Como jugador, quiero que mis resultados de ejercicios sean calificados automáticamente, para recibir retroalimentación objetiva sobre mi desempeño.

#### Criterios de Aceptación

1. LA Plataforma DEBERÁ almacenar resultados de ejercicios en una tabla `exercise_results` con campos: `id`, `session_id`, `exercise_id`, `score`, `grade` y `riot_match_id`.
2. EL campo `exercise_results.grade` DEBERÁ aceptar únicamente los valores `BAD`, `PASSABLE` o `EXCELLENT`.
3. CUANDO se cree un Exercise_Result, EL Grading_Engine DEBERÁ asignar `grade = EXCELLENT` si `score >= exercise_templates.threshold_excellent`.
4. CUANDO se cree un Exercise_Result, EL Grading_Engine DEBERÁ asignar `grade = PASSABLE` si `score >= exercise_templates.threshold_pass` y `score < exercise_templates.threshold_excellent`.
5. CUANDO se cree un Exercise_Result, EL Grading_Engine DEBERÁ asignar `grade = BAD` si `score < exercise_templates.threshold_pass`.
6. EL RLS DEBERÁ permitir select, insert y update en `exercise_results` solo si `auth.uid()` coincide con el `user_id` del Commitment de la Daily_Session padre.

---

### Requisito 9: Carga Manual de Galería

**Historia de Usuario:** Como jugador, quiero enviar manualmente mis resultados de ejercicios de Galería, para poder registrar entrenamiento que no se rastrea automáticamente.

#### Criterios de Aceptación

1. CUANDO un usuario envíe resultados de Galería mediante `POST /training/submit-gallery`, EL Training_Service DEBERÁ validar el payload usando el schema Zod correspondiente de `@vpa/shared`.
2. CUANDO el payload sea válido, EL Training_Service DEBERÁ crear un registro Exercise_Result e invocar el Grading_Engine.
3. CUANDO todos los resultados de Gallery_Exercise para una Daily_Session sean enviados, EL Training_Service DEBERÁ establecer `daily_sessions.is_gallery_done = true`.
4. SI el payload falla la validación Zod, ENTONCES EL Training_Service DEBERÁ devolver una respuesta HTTP 422 con un mensaje de error descriptivo.

---

### Requisito 10: Sincronización Automática de Deathmatch (DM)

**Historia de Usuario:** Como jugador, quiero que mis partidas Deathmatch se sincronicen automáticamente desde Riot, para no tener que registrarlas manualmente.

#### Criterios de Aceptación

1. CUANDO un usuario active `PATCH /training/sync-dm`, EL Riot_Proxy DEBERÁ obtener partidas DM recientes desde la API de Riot Games para el `riot_id` y `riot_tag` del usuario.
2. EL Riot_Proxy DEBERÁ aplicar un límite de tasa de 30 solicitudes por minuto usando `@nestjs/throttler`.
3. CUANDO una partida obtenida tenga un `riot_match_id` que ya exista en `exercise_results`, EL Training_Service DEBERÁ omitir esa partida para prevenir entradas duplicadas.
4. CUANDO se procese una nueva partida DM, EL Training_Service DEBERÁ crear un Exercise_Result, invocar el Grading_Engine y actualizar `daily_sessions.is_dm_done` en consecuencia.
5. SI la API de Riot Games devuelve un error, ENTONCES EL Riot_Proxy DEBERÁ devolver una respuesta HTTP 502 con un mensaje de error descriptivo.

---

### Requisito 11: Verificación de Cuenta Riot

**Historia de Usuario:** Como jugador, quiero verificar mi cuenta de Riot, para que la plataforma pueda sincronizar mis datos de partidas de forma segura.

#### Criterios de Aceptación

1. CUANDO un usuario llame a `POST /auth/verify-riot` con un `riot_id` y `riot_tag`, EL Auth_Service DEBERÁ consultar la API de Riot Games para confirmar que la cuenta existe.
2. CUANDO la cuenta de Riot sea confirmada, EL Auth_Service DEBERÁ actualizar `profiles.riot_id`, `profiles.riot_tag` y `profiles.last_sync_at` para el usuario autenticado.
3. SI la cuenta de Riot no existe, ENTONCES EL Auth_Service DEBERÁ devolver una respuesta HTTP 404 con un mensaje de error descriptivo.
4. SI la API de Riot Games no está disponible, ENTONCES EL Auth_Service DEBERÁ devolver una respuesta HTTP 503 con un mensaje de error descriptivo.

---

### Requisito 12: Reinicio UTC y Ciclo de Vida de Sesiones (Session_Scheduler)

**Historia de Usuario:** Como operador de la plataforma, quiero que las sesiones se gestionen automáticamente en el reinicio UTC diario, para que el ciclo de entrenamiento permanezca sincronizado con el reinicio global de VALORANT.

#### Criterios de Aceptación

1. EL Session_Scheduler DEBERÁ ejecutarse al menos una vez por hora para evaluar sesiones que hayan pasado el límite de las 00:00 UTC.
2. CUANDO una Daily_Session tenga `status = IN_PROGRESS` y su `date` sea anterior a la fecha UTC actual, EL Session_Scheduler DEBERÁ establecer el `status` de la sesión a `FAILED`.
3. CUANDO una Daily_Session se establezca a `FAILED`, EL Session_Scheduler DEBERÁ reiniciar `profiles.current_streak` a `0` para el usuario correspondiente.
4. CUANDO una Daily_Session se establezca a `FAILED`, EL Session_Scheduler DEBERÁ crear una notificación `STREAK_ALERT` para el usuario correspondiente.
5. EL Session_Scheduler DEBERÁ procesar todas las sesiones elegibles en una sola ejecución sin requerir intervención manual.

---

### Requisito 13: Feedback Dinámico y Coaching Tips

**Historia de Usuario:** Como jugador, quiero recibir consejos de coaching basados en mi desempeño, para poder entender cómo mejorar.

#### Criterios de Aceptación

1. LA Plataforma DEBERÁ almacenar consejos de coaching en una tabla `coaching_tips` con campos: `id`, `category`, `grade_trigger` y `message`.
2. EL campo `coaching_tips.grade_trigger` DEBERÁ aceptar únicamente los valores `BAD` o `PASSABLE`.
3. CUANDO un Exercise_Result sea calificado como `BAD` o `PASSABLE`, EL Training_Service DEBERÁ crear una notificación `COACH_TIP` para el usuario, seleccionando un consejo que coincida con la categoría y calificación del resultado.
4. LA Plataforma DEBERÁ almacenar notificaciones en una tabla `notifications` con campos: `id`, `user_id`, `type`, `data`, `is_read` y `created_at`.
5. EL campo `notifications.type` DEBERÁ aceptar únicamente los valores `FOLLOW_REQ`, `STREAK_ALERT` o `COACH_TIP`.

---

### Requisito 14: Feed de Notificaciones

**Historia de Usuario:** Como jugador, quiero ver mis notificaciones, para mantenerme informado sobre mi entrenamiento y actividad social.

#### Criterios de Aceptación

1. CUANDO un usuario autenticado llame a `GET /social/notifications`, EL Social_Service DEBERÁ devolver todas las notificaciones donde `notifications.user_id = auth.uid()`, ordenadas por `created_at` descendente.
2. EL Social_Service DEBERÁ devolver únicamente notificaciones pertenecientes al usuario autenticado.
3. CUANDO un usuario lea una notificación, EL Social_Service DEBERÁ permitir actualizar `notifications.is_read = true` solo para notificaciones donde `notifications.user_id = auth.uid()`.

---

### Requisito 15: Parseo y Serialización de Schemas Compartidos

**Historia de Usuario:** Como desarrollador, quiero que todos los contratos de datos entre frontend y backend estén definidos y validados usando schemas Zod compartidos, para que la seguridad de tipos se aplique de extremo a extremo.

#### Criterios de Aceptación

1. EL paquete Shared DEBERÁ definir schemas Zod para todos los payloads de solicitud y respuesta de la API usados por el Backend y Frontend.
2. CUANDO el Frontend envíe un formulario, EL Frontend DEBERÁ validar la entrada contra el schema Zod correspondiente de `@vpa/shared` antes de enviar la solicitud.
3. CUANDO el Backend reciba una solicitud, EL Backend DEBERÁ validar el payload contra el schema Zod correspondiente de `@vpa/shared`.
4. PARA TODOS los objetos de datos válidos, serializar y luego deserializar usando los schemas Zod DEBERÁ producir un objeto equivalente (propiedad de round-trip).
5. SI un payload falla la validación del schema, ENTONCES EL Backend DEBERÁ devolver una respuesta HTTP 422 con los errores de campo específicos proporcionados por Zod.

---

### Requisito 16: Gestión de Títulos Desbloqueables

**Historia de Usuario:** Como jugador, quiero desbloquear títulos según mis logros, para poder mostrar mi progreso y dedicación en mi perfil.

#### Criterios de Aceptación

1. LA Plataforma DEBERÁ almacenar títulos disponibles en una tabla `unlockable_titles` con campos: `id`, `name`, `description`, `unlock_condition_type` y `unlock_condition_value`.
2. EL campo `unlockable_titles.unlock_condition_type` DEBERÁ aceptar únicamente los valores `STREAK_REACHED`, `ROUTINES_COMPLETED` o `SESSIONS_COMPLETED`.
3. LA Plataforma DEBERÁ almacenar títulos desbloqueados por usuarios en una tabla `user_titles` con campos: `user_id`, `title_id` y `unlocked_at`.
4. CUANDO un usuario alcance una condición de desbloqueo, LA Plataforma DEBERÁ crear automáticamente un registro en `user_titles` y enviar una notificación al usuario.
5. CUANDO un usuario actualice su perfil, LA Plataforma DEBERÁ permitir establecer `profiles.title` únicamente a títulos que el usuario haya desbloqueado.

---

### Requisito 17: Gestión de Regiones

**Historia de Usuario:** Como jugador, quiero que mi región sea validada correctamente, para que la plataforma pueda comunicarse con el servidor correcto de la API de Riot.

#### Criterios de Aceptación

1. EL campo `profiles.region` DEBERÁ aceptar únicamente los valores `na`, `latam`, `eu`, `ap` o `kr`.
2. CUANDO un usuario establezca su región, EL Backend DEBERÁ validar el valor contra el enum `Region` definido en `@vpa/shared`.
3. CUANDO el Riot_Proxy realice solicitudes a la API de Riot Games, DEBERÁ usar el endpoint regional correspondiente basado en `profiles.region` del usuario.
4. SI un usuario intenta establecer una región inválida, ENTONCES EL Backend DEBERÁ devolver una respuesta HTTP 422 con un mensaje de error descriptivo.

---

### Requisito 18: Manejo de Zona Horaria del Usuario

**Historia de Usuario:** Como jugador, quiero que la plataforma use mi zona horaria, para que las fechas y horas se muestren correctamente en mi ubicación.

#### Criterios de Aceptación

1. EL campo `profiles.timezone` DEBERÁ almacenar identificadores de zona horaria válidos según la base de datos IANA (ej: `America/New_York`, `Europe/Madrid`).
2. CUANDO el Frontend muestre timestamps al usuario, DEBERÁ convertir los timestamps UTC a la zona horaria especificada en `profiles.timezone`.
3. CUANDO un usuario actualice su zona horaria, EL Backend DEBERÁ validar que el valor sea un identificador IANA válido.
4. LA Plataforma DEBERÁ inicializar `profiles.timezone` a `UTC` al crear el perfil si no se proporciona otro valor.

---
### Requisito 19: Abandono de Compromisos

**Historia de Usuario:** Como jugador, quiero poder abandonar un compromiso activo, para poder cambiar de rutina si mis objetivos cambian.

#### Criterios de Aceptación

1. CUANDO un usuario llame a `PATCH /training/commitments/:id/drop`, EL Training_Service DEBERÁ establecer `user_commitments.status` a `dropped` para el compromiso especificado.
2. CUANDO un Commitment se establezca a `dropped`, EL Training_Service DEBERÁ establecer todas las Daily_Sessions asociadas con `status = IN_PROGRESS` a `FAILED`.
3. CUANDO un Commitment se establezca a `dropped`, EL Training_Service NO DEBERÁ modificar `profiles.current_streak` del usuario.
4. LA racha del usuario (`current_streak`) DEBERÁ reiniciarse a `0` únicamente cuando una Daily_Session pase el UTC_Reset sin completarse (gestionado por el Session_Scheduler).
5. EL RLS DEBERÁ permitir actualizar el status de un Commitment a `dropped` solo si `auth.uid()` coincide con el `user_id` del Commitment.
6. LA Plataforma DEBERÁ permitir que un usuario tenga solo un Commitment con `status = active` a la vez.e con el `user_id` del Commitment.
5. LA Plataforma DEBERÁ permitir que un usuario tenga solo un Commitment con `status = active` a la vez.

---

### Requisito 20: Aceptación y Rechazo de Follow Requests

**Historia de Usuario:** Como jugador con perfil privado, quiero gestionar solicitudes de seguimiento pendientes, para controlar quién puede ver mi progreso.

#### Criterios de Aceptación

1. CUANDO un usuario llame a `GET /social/follow-requests`, EL Social_Service DEBERÁ devolver todas las entradas de `follows` donde `following_id = auth.uid()` y `status = pending`.
2. CUANDO un usuario llame a `PATCH /social/follow-requests/:id/accept`, EL Social_Service DEBERÁ establecer `follows.status` a `accepted` para la solicitud especificada.
3. CUANDO un usuario llame a `DELETE /social/follow-requests/:id`, EL Social_Service DEBERÁ eliminar la entrada de `follows` correspondiente.
4. EL RLS DEBERÁ permitir actualizar o eliminar una solicitud de seguimiento solo si `auth.uid() = follows.following_id`.
5. CUANDO una solicitud de seguimiento sea aceptada, EL Social_Service DEBERÁ crear una notificación para el `follower_id` informándole de la aceptación.

---

### Requisito 21: Paginación y Límites

**Historia de Usuario:** Como jugador, quiero que las listas largas se paginen correctamente, para que la aplicación cargue rápidamente y sea fácil de navegar.

#### Criterios de Aceptación

1. CUANDO un usuario solicite notificaciones mediante `GET /social/notifications`, EL Social_Service DEBERÁ soportar parámetros de query `page` y `limit` con valores por defecto de `page=1` y `limit=20`.
2. CUANDO un usuario solicite su lista de seguidores o seguidos, EL Social_Service DEBERÁ soportar paginación con un límite máximo de `50` registros por página.
3. CUANDO un usuario solicite el catálogo de rutinas, EL Backend DEBERÁ soportar paginación con un límite máximo de `30` rutinas por página.
4. CUANDO un usuario solicite el historial de sesiones, EL Training_Service DEBERÁ soportar paginación con un límite máximo de `50` sesiones por página.
5. TODAS las respuestas paginadas DEBERÁN incluir metadatos: `total`, `page`, `limit` y `totalPages`.

---

### Requisito 22: Seed Data y Datos Iniciales

**Historia de Usuario:** Como operador de la plataforma, quiero que el sistema incluya datos iniciales, para que los usuarios puedan comenzar a usar la plataforma inmediatamente después del despliegue.

#### Criterios de Aceptación

1. LA Plataforma DEBERÁ incluir un script de seed en `supabase/seed.sql` que cree al menos 3 rutinas de ejemplo con ejercicios completos.
2. EL script de seed DEBERÁ poblar la tabla `coaching_tips` con al menos 10 consejos predefinidos cubriendo diferentes categorías y triggers.
3. EL script de seed DEBERÁ poblar la tabla `unlockable_titles` con al menos 5 títulos desbloqueables con condiciones variadas.
4. EL script de seed DEBERÁ ser idempotente, permitiendo múltiples ejecuciones sin crear datos duplicados.
5. LA Plataforma DEBERÁ documentar el proceso de ejecución del seed en el README del proyecto.

---

### Requisito 23: Manejo de Errores de Rate Limiting

**Historia de Usuario:** Como usuario de la API, quiero recibir respuestas claras cuando exceda los límites de tasa, para poder ajustar mi comportamiento en consecuencia.

#### Criterios de Aceptación

1. CUANDO un usuario exceda el límite de 30 solicitudes por minuto, EL Backend DEBERÁ devolver una respuesta HTTP 429 con el header `Retry-After` indicando cuándo puede reintentar.
2. LA respuesta HTTP 429 DEBERÁ incluir un cuerpo JSON con campos: `statusCode`, `message` y `retryAfter`.
3. EL Backend DEBERÁ aplicar rate limiting por usuario autenticado usando `auth.uid()` como identificador.
4. EL Backend DEBERÁ aplicar rate limiting por IP para solicitudes no autenticadas.
5. EL Frontend DEBERÁ mostrar un mensaje amigable al usuario cuando reciba una respuesta HTTP 429.

---

### Requisito 24: Actualización de Avatar

**Historia de Usuario:** Como jugador, quiero subir y actualizar mi avatar, para personalizar mi perfil visualmente.

#### Criterios de Aceptación

1. CUANDO un usuario suba un avatar mediante `POST /profile/avatar`, EL Backend DEBERÁ validar que el archivo sea una imagen con formato `jpg`, `png` o `webp`.
2. EL Backend DEBERÁ validar que el tamaño del archivo no exceda 2 MB.
3. CUANDO la validación sea exitosa, EL Backend DEBERÁ subir la imagen al bucket `avatars` de Supabase Storage y actualizar `profiles.avatar_url` con la URL pública.
4. SI el usuario ya tiene un avatar, EL Backend DEBERÁ eliminar el archivo anterior del storage antes de subir el nuevo.
5. SI la validación falla, ENTONCES EL Backend DEBERÁ devolver una respuesta HTTP 422 con un mensaje de error descriptivo.

### Requisito 25: Dashboard de Métricas y Análisis

**Historia de Usuario:** Como jugador, quiero visualizar mis métricas de entrenamiento a lo largo del tiempo, para poder analizar mi progreso y detectar tendencias de mejora o deterioro.

#### Criterios de Aceptación

1. CUANDO un usuario llame a `GET /training/analytics`, EL Training_Service DEBERÁ soportar los siguientes parámetros de filtrado: `exercise_id`, `date`, `week`, `start_date` y `end_date`.
2. CUANDO se especifique `exercise_id`, EL Training_Service DEBERÁ devolver métricas agregadas únicamente para ese ejercicio específico.
3. CUANDO se especifique `date`, EL Training_Service DEBERÁ devolver métricas para ese día específico en formato UTC.
4. CUANDO se especifique `week`, EL Training_Service DEBERÁ devolver métricas agregadas para los 7 días de esa semana.
5. CUANDO se especifiquen `start_date` y `end_date`, EL Training_Service DEBERÁ devolver métricas agregadas para ese rango de fechas personalizado.
6. LA respuesta DEBERÁ incluir los siguientes datos: progreso de scores a lo largo del tiempo, distribución de grades (`BAD`, `PASSABLE`, `EXCELLENT`), tendencias de mejora o deterioro y comparación entre períodos.
7. EL Frontend DEBERÁ visualizar estos datos mediante gráficos de línea para progreso temporal, gráficos de barras para distribución de grades y indicadores visuales claros para tendencias.
8. EL RLS DEBERÁ permitir acceso a analytics únicamente si `auth.uid()` coincide con el `user_id` del Commitment asociado a los Exercise_Results consultados.

---

### Requisito 26: Creación Automática de Sesiones Diarias

**Historia de Usuario:** Como jugador, quiero que mis sesiones diarias se creen automáticamente, para no tener que inicializarlas manualmente cada día.

#### Criterios de Aceptación

1. CUANDO un usuario cree un nuevo Commitment, EL Training_Service DEBERÁ crear inmediatamente una Daily_Session para la fecha UTC actual con `status = IN_PROGRESS`.
### Requisito 26: Validación de Scoresute después del UTC_Reset, DEBERÁ crear automáticamente la Daily_Session del nuevo día para todos los Commitments con `status = active`.
3. LA Plataforma DEBERÁ garantizar que no se creen Daily_Sessions duplicadas para el mismo `(commitment_id, date)`.
4. CUANDO se cree una Daily_Session, DEBERÁ inicializarse con `is_gallery_done = false` e `is_dm_done = false`.

---

### Requisito 27: Validación de Scores

**Historia de Usuario:** Como jugador, quiero que mis scores sean validados correctamente, para prevenir datos incorrectos o maliciosos en el sistema.

#### Criterios de Aceptación

1. CUANDO un usuario envíe un Exercise_Result, EL Backend DEBERÁ validar que `score` sea un número no negativo.
2. EL Backend DEBERÁ validar que `score` esté dentro de rangos razonables según `exercise_templates.metric_unit` (ej: kills entre 0-40, accuracy entre 0-100).
### Requisito 27: Historial de Rachasalidadores Zod específicos para cada `metric_unit` con límites apropiados.
4. SI un score está fuera del rango válido, ENTONCES EL Backend DEBERÁ devolver una respuesta HTTP 422 con un mensaje de error descriptivo.
5. EL Grading_Engine DEBERÁ rechazar scores que excedan límites físicamente posibles para el tipo de ejercicio.

---

### Requisito 28: Historial de Rachas

**Historia de Usuario:** Como jugador, quiero ver mi historial de rachas, para poder rastrear mi mejor desempeño a lo largo del tiempo.

#### Criterios de Aceptación

1. LA Plataforma DEBERÁ agregar un campo `max_streak` a la tabla `profiles` para almacenar la racha máxima alcanzada por el usuario.
2. CUANDO `profiles.current_streak` supere `profiles.max_streak`, LA Plataforma DEBERÁ actualizar `max_streak` al nuevo valor.
### Requisito 28: Búsqueda y Descubrimiento de Usuariosna tabla `streak_history` con campos: `user_id`, `streak_value`, `started_at`, `ended_at` y `status`.
4. CUANDO una racha se rompa, EL Session_Scheduler DEBERÁ crear un registro en `streak_history` con `status = broken` y establecer `ended_at` al timestamp actual.
5. CUANDO un usuario solicite su historial de rachas mediante `GET /profile/streak-history`, EL Backend DEBERÁ devolver todos los registros de `streak_history` ordenados por `started_at` descendente.

---

### Requisito 29: Búsqueda y Descubrimiento de Usuarios

**Historia de Usuario:** Como jugador, quiero buscar otros usuarios por nombre o Riot ID, para poder encontrar y seguir a amigos o jugadores que admiro.

#### Criterios de Aceptación

1. CUANDO un usuario llame a `GET /social/search?q=<query>`, EL Social_Service DEBERÁ buscar en `profiles` coincidencias parciales en los campos `username`, `riot_id` o `riot_tag`.
2. LA búsqueda DEBERÁ ser case-insensitive y soportar coincidencias parciales usando operadores `ILIKE` de PostgreSQL.
### Requisito 29: Desvinculación de Cuenta Riot perfiles públicos o perfiles privados que el usuario autenticado ya sigue.
4. LOS resultados de búsqueda DEBERÁN estar paginados con un límite máximo de 20 resultados por página.
5. EL RLS DEBERÁ garantizar que usuarios no autenticados no puedan realizar búsquedas.

---

### Requisito 30: Desvinculación de Cuenta Riot

**Historia de Usuario:** Como jugador, quiero poder desvincular o cambiar mi cuenta de Riot, para poder actualizar mi información si cambio de cuenta.

#### Criterios de Aceptación

1. CUANDO un usuario llame a `DELETE /auth/unlink-riot`, EL Auth_Service DEBERÁ establecer `profiles.riot_id`, `profiles.riot_tag` y `profiles.region` a `NULL` para el usuario autenticado.
2. CUANDO se desvincule una cuenta Riot, EL Auth_Service DEBERÁ establecer todos los Commitments activos del usuario a `status = dropped`.
3. CUANDO se desvincule una cuenta Riot, LA Plataforma DEBERÁ mantener el historial de Exercise_Results previos para propósitos de auditoría.
4. EL RLS DEBERÁ permitir la desvinculación solo si `auth.uid() = profiles.id`.
5. DESPUÉS de desvincular, EL usuario DEBERÁ poder vincular una nueva cuenta Riot usando el endpoint `POST /auth/verify-riot`.
