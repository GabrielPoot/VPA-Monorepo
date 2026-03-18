# Tareas de Implementación - VPA Monorepo

## Tarea 1: Configuración del Monorepo

- [ ] 1.1 Crear `package.json` raíz con Turborepo, pnpm workspaces y scripts globales (`build`, `dev`, `lint`, `type-check`, `test`, `test:unit`, `test:property`, `test:integration`)
- [ ] 1.2 Crear `pnpm-workspace.yaml` con rutas `apps/*` y `packages/*`
- [ ] 1.3 Crear `turbo.json` con pipeline de build, dev, lint, type-check, test:unit, test:property, test:integration
- [ ] 1.4 Crear `.gitignore`, `.prettierrc` y `tsconfig.base.json` raíz con paths para `@vpa/shared`
- [ ] 1.5 Crear estructura de directorios: `apps/backend`, `apps/frontend`, `packages/shared`, `supabase/migrations`
- [ ] 1.6 Crear `.env.example` raíz con todas las variables de entorno requeridas (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, RIOT_API_KEY, JWT_SECRET, VITE_*)

**Requisitos que implementa:** REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4

---

## Tarea 2: Paquete Shared (@vpa/shared)

- [ ] 2.1 Crear `packages/shared/package.json` con dependencias (zod, vitest, fast-check) y configuración de exports
- [ ] 2.2 Crear `packages/shared/tsconfig.json` extendiendo `tsconfig.base.json`
- [ ] 2.3 Implementar enums en `src/enums/`:
  - `grade.enum.ts`: `Grade` (BAD, PASSABLE, EXCELLENT)
  - `region.enum.ts`: `Region` (na, latam, eu, ap, kr)
  - `exercise-type.enum.ts`: `ExerciseType` (GALLERY, DM)
  - `index.ts` exportando todos los enums
- [ ] 2.4 Implementar schemas Zod en `src/schemas/`:
  - `auth.schemas.ts`: `RegisterSchema`, `LoginSchema`, `VerifyRiotSchema`
  - `profile.schemas.ts`: `UpdateProfileSchema` (username 3-20 chars, bio max 500, IANA timezone, privacyMode, title UUID)
  - `training.schemas.ts`: `CreateCommitmentSchema`, `SubmitGallerySchema`, `AnalyticsQuerySchema`
  - `social.schemas.ts`: `SearchQuerySchema` (q min 3 chars), `PaginationSchema`
- [ ] 2.5 Implementar tipos de API en `src/types/api.types.ts`: interfaces de respuesta para todos los endpoints, `PaginationMeta`, `ErrorResponse`
- [ ] 2.6 Crear `src/types/database.types.ts` con tipos generados por Supabase (placeholder inicial)
- [ ] 2.7 Crear `src/index.ts` exportando todos los schemas, tipos y enums
- [ ] 2.8 Escribir property-based tests para Property 15 (HTTP 422 en payload inválido) y Property 19 (round-trip Zod)

**Requisitos que implementa:** REQ-15.1, REQ-15.4, REQ-15.5, REQ-27.1

---

## Tarea 3: Migraciones de Base de Datos

- [ ] 3.1 Migración 001: Tabla `unlockable_titles` con índice en `unlock_condition_type` y RLS (lectura para usuarios autenticados)
- [ ] 3.2 Migración 002: Tabla `profiles` con índices en `username` y `(riot_id, riot_tag)`, RLS (lectura pública/privada según `privacy_mode`, actualización solo propietario)
- [ ] 3.3 Migración 003: Tablas `routine_templates` y `exercise_templates` con constraint `valid_thresholds` y RLS (lectura para autenticados)
- [ ] 3.4 Migración 004: Tabla `user_commitments` con constraint `one_active_commitment_per_user` (partial unique index) y RLS (CRUD solo propietario)
- [ ] 3.5 Migración 005: Tabla `daily_sessions` con constraint `unique_session_per_day` y RLS (lectura/actualización solo propietario del commitment)
- [ ] 3.6 Migración 006: Tabla `exercise_results` con constraint `unique_riot_match` (partial unique index) y RLS (ALL solo propietario del commitment)
- [ ] 3.7 Migración 007: Tabla `follows` con constraints `no_self_follow` y `unique_follow`, RLS (lectura follower/following, inserción follower, actualización following, eliminación ambos)
- [ ] 3.8 Migración 008: Tabla `notifications` con índices en `user_id`, `type`, `is_read`, `created_at DESC` y RLS (lectura/actualización solo propietario)
- [ ] 3.9 Migración 009: Tabla `coaching_tips` con índices en `category` y `grade_trigger`, RLS (lectura para autenticados)
- [ ] 3.10 Migración 010: Tablas `user_titles` y `streak_history` con RLS (lectura solo propietario)
- [ ] 3.11 Crear trigger `on_auth_user_created` en `auth.users` para auto-crear perfil con `current_streak=0`, `max_streak=0`, `privacy_mode=false`, `timezone='UTC'`
- [ ] 3.12 Crear `supabase/seed.sql` con: mínimo 3 rutinas de ejemplo, ejercicios GALLERY y DM por rutina, coaching tips por categoría y grade_trigger, títulos desbloqueables con condiciones STREAK_REACHED/ROUTINES_COMPLETED/SESSIONS_COMPLETED

**Requisitos que implementa:** REQ-2.1, REQ-3.1, REQ-3.4, REQ-6.1, REQ-10.3, REQ-19.2, REQ-28.1

---

## Tarea 4: Backend - Configuración Base y Auth Module

- [ ] 4.1 Crear `apps/backend/package.json` con dependencias: `@nestjs/core`, `@nestjs/platform-fastify`, `@nestjs/throttler`, `@nestjs/schedule`, `@nestjs/config`, `@supabase/supabase-js`, `@vpa/shared`, `zod`
- [ ] 4.2 Crear `apps/backend/tsconfig.json` con `experimentalDecorators: true`, `emitDecoratorMetadata: true`, extendiendo `tsconfig.base.json`
- [ ] 4.3 Implementar `src/main.ts` con Fastify adapter, CORS configurado, ValidationPipe global, puerto desde env
- [ ] 4.4 Implementar `src/app.module.ts` con `ConfigModule.forRoot()`, `ThrottlerModule` (60 req/min global), `ScheduleModule.forRoot()`
- [ ] 4.5 Implementar `src/supabase/supabase.module.ts` y `supabase.service.ts` con cliente Supabase (anon key para operaciones de usuario, service role para scheduler)
- [ ] 4.6 Implementar `src/common/guards/auth.guard.ts` para verificar JWT de Supabase en cada request
- [ ] 4.7 Implementar `src/common/filters/zod-exception.filter.ts` que retorna HTTP 422 con detalles de errores Zod en formato `ErrorResponse`
- [ ] 4.8 Implementar `src/common/filters/http-exception.filter.ts` con formato `ErrorResponse` consistente (statusCode, message, error, timestamp, path)
- [ ] 4.9 Implementar `src/auth/auth.module.ts`, `auth.controller.ts`, `auth.service.ts`:
  - `POST /auth/register`: crea usuario en Supabase Auth + perfil (trigger lo crea automáticamente), retorna token
  - `POST /auth/login`: autentica con Supabase Auth, retorna JWT + perfil
  - `POST /auth/verify-riot`: llama a Riot API para verificar cuenta, actualiza `riot_id`, `riot_tag`, `region`, `last_sync_at`
  - `DELETE /auth/unlink-riot`: limpia `riot_id`, `riot_tag`, `region`, `last_sync_at` del perfil
- [ ] 4.10 Implementar `src/profile/profile.module.ts`, `profile.controller.ts`, `profile.service.ts`:
  - `GET /profile`: retorna perfil completo del usuario autenticado
  - `PATCH /profile`: actualiza username (validar unicidad), bio, timezone (validar IANA), privacyMode, title (validar que el título esté desbloqueado por el usuario)
  - `POST /profile/avatar`: sube archivo a Supabase Storage (validar MIME jpg/png/webp, max 2MB), actualiza `avatar_url`
  - `GET /profile/streak-history`: historial paginado de `streak_history` del usuario
- [ ] 4.11 Escribir property-based tests para Properties 1, 2, 3, 4

**Requisitos que implementa:** REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4, REQ-3.5, REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4, REQ-16.1, REQ-16.2, REQ-28.1, REQ-28.2

---

## Tarea 5: Backend - Grading Engine y Training Module

- [ ] 5.1 Implementar `src/grading/grading.service.ts`:
  - `calculateGrade(score, thresholdPass, thresholdExcellent): Grade`
  - Lógica: `score >= thresholdExcellent` → EXCELLENT, `score >= thresholdPass` → PASSABLE, else → BAD
- [ ] 5.2 Implementar `src/training/commitment.service.ts`:
  - Crear commitment: validar que no exista otro activo (HTTP 422 si existe), crear `user_commitments` con `status='active'`
  - Listar commitments del usuario con `completedDays` calculado
  - Abandonar commitment: `status → 'dropped'`, sesiones `IN_PROGRESS → FAILED`, racha NO se modifica
  - Auto-completar: cuando `completed_days == duration_days` (solo si `duration_days` no es NULL), `status → 'completed'`
- [ ] 5.3 Implementar `src/training/session.service.ts`:
  - Obtener sesión de hoy: buscar `daily_sessions` para el commitment activo con `date = today UTC`
  - Actualizar flags `is_gallery_done` / `is_dm_done` al registrar resultados
  - Marcar sesión como COMPLETED cuando ambos flags son true
  - Al completar: incrementar `current_streak += 1`, actualizar `max_streak = max(max_streak, current_streak)`, actualizar `streak_history`
  - Verificar condiciones de desbloqueo de títulos al completar sesión
- [ ] 5.4 Implementar `src/training/result.service.ts`:
  - Guardar resultados de Galería: validar score por `metric_unit` (kills: 0-40, accuracy: 0-100, score: 0-10000)
  - Calcular grade usando GradingEngine
  - Crear notificación `COACH_TIP` si grade es BAD o PASSABLE (seleccionar tip aleatorio por categoría)
  - Marcar `is_gallery_done = true` cuando todos los ejercicios GALLERY tienen resultado
- [ ] 5.5 Implementar `src/training/analytics.service.ts`:
  - Métricas por día, semana o rango de fechas
  - Distribución de grades (excellent/passable/bad counts)
  - Tendencias de progreso (improving/declining basado en promedio de últimas sesiones)
  - `summary`: totalSessions, completedSessions, failedSessions, averageScore
- [ ] 5.6 Implementar `src/training/training.controller.ts` con rate limiting específico:
  - `GET /training/routines` (60 req/min)
  - `POST /training/commitments` (30 req/min)
  - `GET /training/commitments` (60 req/min)
  - `PATCH /training/commitments/:id/drop` (30 req/min)
  - `GET /training/today` (60 req/min)
  - `POST /training/submit-gallery` (30 req/min)
  - `PATCH /training/sync-dm` (10 req/min)
  - `GET /training/analytics` (60 req/min)
  - `GET /training/sessions` (60 req/min)
- [ ] 5.7 Escribir property-based tests para Properties 7, 8, 9, 10, 11, 12, 13, 14, 20, 21, 23, 24

**Requisitos que implementa:** REQ-6.1, REQ-6.2, REQ-6.3, REQ-6.4, REQ-6.5, REQ-7.1, REQ-7.2, REQ-7.3, REQ-7.4, REQ-7.5, REQ-7.6, REQ-8.1, REQ-8.2, REQ-8.3, REQ-8.4, REQ-8.5, REQ-9.1, REQ-9.2, REQ-9.3, REQ-9.4, REQ-19.1, REQ-19.2, REQ-19.3, REQ-22.1, REQ-27.1, REQ-27.4

---

## Tarea 6: Backend - Riot Proxy Module

- [ ] 6.1 Implementar `src/riot/riot-api.service.ts`:
  - Cliente HTTP con endpoints regionales según `profiles.region` (na1, latam, eu, ap, kr)
  - Rate limiting: 30 req/min con `@nestjs/throttler`
  - Retry logic en errores 502/503/504: máx 3 intentos con backoff exponencial (1s, 2s, 4s)
  - Timeout de 10 segundos por request
- [ ] 6.2 Implementar `src/riot/riot-account.service.ts`:
  - `verifyAccount(riotId, riotTag, region)`: llama a Riot Account API para verificar existencia
  - Retorna datos de la cuenta o lanza HTTP 404 si no existe
- [ ] 6.3 Implementar `src/riot/riot-match.service.ts`:
  - `getDeathmatchMatches(puuid, region)`: obtiene partidas DM recientes del usuario
  - Parsea y transforma datos de Riot al formato VPA (score, kills, etc. según `metric_unit`)
  - Filtra partidas ya procesadas por `riot_match_id` (deduplicación)
- [ ] 6.4 Integrar sincronización DM en `training/result.service.ts`:
  - `syncDeathmatch(userId)`: llama a RiotMatchService con el `puuid` del usuario
  - Crea `exercise_results` para partidas nuevas con grade calculado
  - Actualiza `last_sync_at` en profiles
  - Marca `is_dm_done = true` cuando se procesan partidas DM
  - Retorna `{ synced: number, results: [...], session: {...} }`
- [ ] 6.5 Escribir property-based test para Property 16 (prevención de duplicados de Riot Match)

**Requisitos que implementa:** REQ-10.1, REQ-10.2, REQ-10.3, REQ-10.4, REQ-11.1, REQ-11.2, REQ-11.3

---

## Tarea 7: Backend - Session Scheduler y Streak/Titles Logic

- [ ] 7.1 Implementar `src/scheduler/session-scheduler.service.ts`:
  - Cron job cada hora (`0 * * * *`) en UTC usando `@nestjs/schedule`
  - Buscar sesiones `IN_PROGRESS` con `date < today UTC`
  - Marcar sesiones como `FAILED` (idempotente: verificar antes de modificar)
  - Resetear `current_streak = 0` para usuarios afectados
  - Crear notificación `STREAK_ALERT` para usuarios afectados
  - Crear `daily_sessions` para el día actual en todos los commitments activos (idempotente con `ON CONFLICT DO NOTHING`)
- [ ] 7.2 Implementar lógica de `streak_history` en `session.service.ts`:
  - Al iniciar racha (primer día completado): crear entrada con `status='active'`, `started_at=now()`
  - Al incrementar racha: actualizar `streak_value` en la entrada activa
  - Al resetear racha (sesión FAILED): cerrar entrada con `ended_at=now()`, `status='broken'`
- [ ] 7.3 Implementar lógica de `unlockable_titles` en `session.service.ts`:
  - Al completar sesión: verificar condiciones de desbloqueo (STREAK_REACHED, ROUTINES_COMPLETED, SESSIONS_COMPLETED)
  - Si se cumple condición y el título no está desbloqueado: crear entrada en `user_titles`
  - Crear notificación de tipo `COACH_TIP` con datos del título desbloqueado
- [ ] 7.4 Escribir property-based tests para Properties 17, 18, 25

**Requisitos que implementa:** REQ-12.1, REQ-12.2, REQ-12.3, REQ-12.4, REQ-13.1, REQ-13.2, REQ-14.1, REQ-14.2, REQ-28.1, REQ-28.2

---

## Tarea 8: Backend - Social Module

- [ ] 8.1 Implementar `src/social/follow.service.ts`:
  - `follow(followerId, followingId)`: si `privacy_mode=false` → `status='accepted'`, si `privacy_mode=true` → `status='pending'`; HTTP 400 si auto-follow, HTTP 422 si ya existe
  - `unfollow(followerId, followingId)`: eliminar registro de follows
  - `acceptRequest(followId, userId)`: solo el `following_id` puede aceptar, `status → 'accepted'`
  - `rejectRequest(followId, userId)`: eliminar solicitud pendiente
  - `getFollowers(userId, pagination)`: lista paginada de seguidores con datos de perfil
  - `getFollowing(userId, pagination)`: lista paginada de seguidos con datos de perfil
  - `getPendingRequests(userId)`: solicitudes pendientes donde `following_id = userId`
- [ ] 8.2 Implementar `src/social/notification.service.ts`:
  - `getNotifications(userId, filters, pagination)`: lista paginada con filtros por `type` e `isRead`
  - `markAsRead(notificationId, userId)`: actualiza `is_read = true`
  - `createNotification(userId, type, data)`: usado internamente por otros servicios
- [ ] 8.3 Implementar `src/social/search.service.ts`:
  - `searchUsers(query, requesterId, pagination)`: búsqueda por username, riot_id, riot_tag (mínimo 3 caracteres)
  - Resultados paginados (máx 20 por página)
  - Incluir flag `isFollowing` en cada resultado
  - Respetar `privacy_mode`: no mostrar datos sensibles de perfiles privados no seguidos
- [ ] 8.4 Implementar `src/social/social.controller.ts` con rate limiting:
  - `POST /social/follow/:userId` (30 req/min)
  - `DELETE /social/follow/:userId` (30 req/min)
  - `GET /social/followers` (60 req/min)
  - `GET /social/following` (60 req/min)
  - `GET /social/follow-requests` (60 req/min)
  - `PATCH /social/follow-requests/:id/accept` (30 req/min)
  - `DELETE /social/follow-requests/:id` (30 req/min)
  - `GET /social/notifications` (60 req/min)
  - `PATCH /social/notifications/:id/read` (30 req/min)
  - `GET /social/search` (20 req/min)
- [ ] 8.5 Escribir property-based tests para Properties 5, 6, 22

**Requisitos que implementa:** REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4, REQ-4.5, REQ-17.1, REQ-17.2, REQ-17.3, REQ-18.1, REQ-18.2, REQ-20.1, REQ-20.2, REQ-21.1, REQ-21.5

---

## Tarea 9: Frontend - Setup y Autenticación

- [ ] 9.1 Crear `apps/frontend/package.json` con: `vue@3`, `vite`, `@vitejs/plugin-vue`, `typescript`, `tailwindcss`, `@shadcn/ui`, `pinia`, `vue-router@4`, `@vpa/shared`, `zod`
- [ ] 9.2 Configurar `vite.config.ts` con alias `@vpa/shared`, `tailwind.config.ts` con content paths, `tsconfig.json` extendiendo base
- [ ] 9.3 Instalar y configurar componentes Shadcn/ui base: Button, Card, Input, Dialog, Badge, Tabs, Select, Sheet, Avatar, Progress, Table
- [ ] 9.4 Configurar Vue Router con rutas y guards de autenticación:
  - `/login`, `/register` (públicas)
  - `/verify-riot` (requiere auth, sin Riot vinculado)
  - `/dashboard`, `/training`, `/profile`, `/social` (requieren auth)
  - Redirect automático a `/login` si no autenticado
- [ ] 9.5 Implementar Pinia store `src/stores/auth.store.ts`:
  - `login(email, password)`, `register(email, password, username)`, `logout()`
  - `verifyRiot(riotId, riotTag, region)`, `unlinkRiot()`
  - Token refresh automático, persistencia en httpOnly cookies
  - Estado: `user`, `profile`, `isAuthenticated`, `isLoading`
- [ ] 9.6 Implementar `src/composables/useApi.ts`:
  - Cliente HTTP con base URL desde `VITE_API_URL`
  - Interceptor para añadir JWT en headers
  - Manejo de errores HTTP (401 → logout, 422 → mostrar errores Zod, 429 → mostrar rate limit)
- [ ] 9.7 Implementar componentes de autenticación (Shadcn/ui + TailwindCSS):
  - `src/components/auth/LoginForm.vue`: Card + Input (email, password) + Button, validación Zod en cliente
  - `src/components/auth/RegisterForm.vue`: Card + Input (email, password, username) + Button, validación Zod
  - `src/components/auth/RiotVerification.vue`: Dialog + Input (riotId, riotTag) + Select (región) + Button
- [ ] 9.8 Implementar componentes de perfil (Shadcn/ui + TailwindCSS):
  - `src/components/profile/ProfileView.vue`: Card + Badge (racha) + Tabs (info/títulos/historial)
  - `src/components/profile/ProfileEdit.vue`: Dialog + Input + Select, validación con `UpdateProfileSchema`
  - `src/components/profile/AvatarUpload.vue`: Dialog + Button con drag & drop, validación MIME/tamaño
  - `src/components/profile/StreakDisplay.vue`: Card + Badge mostrando `current_streak` y `max_streak`

**Requisitos que implementa:** REQ-3.1, REQ-3.2, REQ-3.3, REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4, REQ-16.1, REQ-16.2

---

## Tarea 10: Frontend - Módulos de Entrenamiento y Social

- [ ] 10.1 Implementar Pinia store `src/stores/training.store.ts`:
  - `fetchRoutines()`, `createCommitment(routineId, durationDays)`, `dropCommitment(id)`
  - `fetchTodaySession()`, `submitGallery(sessionId, results)`, `syncDM()`
  - `fetchAnalytics(filters)`, `fetchSessions(pagination)`
  - Estado: `routines`, `commitments`, `todaySession`, `analytics`, `isLoading`, `errors`
- [ ] 10.2 Implementar componentes de entrenamiento (Shadcn/ui + TailwindCSS):
  - `src/components/training/RoutineCatalog.vue`: Card + Badge (tipo ejercicio) + Button (comprometerse)
  - `src/components/training/CommitmentCard.vue`: Card + Badge (status) + Progress (días completados/total)
  - `src/components/training/DailySessionView.vue`: Tabs (Galería/DM) + Card por ejercicio + Badge (grade)
  - `src/components/training/GallerySubmitForm.vue`: Dialog + Input (score por ejercicio) + Button, validación `SubmitGallerySchema`
  - `src/components/training/DMSyncButton.vue`: Button + Badge (estado: sincronizando/sincronizado/error)
  - `src/components/training/AnalyticsDashboard.vue`: Card + Tabs (día/semana/rango) + Select (ejercicio) + visualización de distribución de grades y tendencias
- [ ] 10.3 Implementar Pinia store `src/stores/social.store.ts`:
  - `searchUsers(query)`, `follow(userId)`, `unfollow(userId)`
  - `fetchFollowers()`, `fetchFollowing()`, `fetchFollowRequests()`
  - `acceptRequest(id)`, `rejectRequest(id)`
  - `fetchNotifications(filters)`, `markNotificationRead(id)`
  - Estado: `searchResults`, `followers`, `following`, `requests`, `notifications`, `unreadCount`
- [ ] 10.4 Implementar componentes sociales (Shadcn/ui + TailwindCSS):
  - `src/components/social/UserSearch.vue`: Input (debounce 300ms, mín 3 chars) + Card por resultado + FollowButton
  - `src/components/social/FollowButton.vue`: Button con estados (Seguir/Pendiente/Dejar de seguir)
  - `src/components/social/FollowersList.vue`: Card + Avatar + username + racha actual
  - `src/components/social/NotificationFeed.vue`: Sheet lateral + Badge (unread count) + Card por notificación (FOLLOW_REQ/STREAK_ALERT/COACH_TIP)
  - `src/components/social/FollowRequestCard.vue`: Card + Button (Aceptar/Rechazar) para solicitudes pendientes
- [ ] 10.5 Implementar validación de formularios con Zod schemas de `@vpa/shared` en todos los formularios
- [ ] 10.6 Implementar manejo de errores HTTP 422 con mensajes descriptivos por campo en UI

**Requisitos que implementa:** REQ-6.1, REQ-6.2, REQ-7.1, REQ-7.2, REQ-8.1, REQ-9.1, REQ-10.1, REQ-17.1, REQ-18.1, REQ-20.1, REQ-21.1, REQ-22.1, REQ-23.1, REQ-24.1, REQ-25.1

---

## Tarea 11: Testing de Integración

- [ ] 11.1 Configurar entorno de testing de integración con Supabase local (`supabase start`) y MSW para mocking de Riot API
- [ ] 11.2 Escribir integration tests para flujo de Auth:
  - Registro → trigger crea perfil → login → obtener perfil
  - Verificar Riot → vincular cuenta → desvincular cuenta
- [ ] 11.3 Escribir integration tests para flujo de Training:
  - Crear commitment → obtener sesión de hoy → enviar galería → sincronizar DM → verificar sesión COMPLETED
  - Abandonar commitment → verificar sesiones FAILED → verificar racha no modificada
  - Commitment con `duration_days` → completar todos los días → verificar `status='completed'`
- [ ] 11.4 Escribir integration tests para Session Scheduler:
  - Crear sesión con fecha de ayer → ejecutar scheduler → verificar `status='FAILED'`
  - Verificar `current_streak` reseteado a 0
  - Verificar notificación `STREAK_ALERT` creada
  - Verificar `daily_sessions` creadas para hoy (idempotencia)
- [ ] 11.5 Escribir integration tests para Social Module:
  - Follow a perfil público → verificar `status='accepted'` inmediato
  - Follow a perfil privado → verificar `status='pending'`
  - Aceptar solicitud → verificar `status='accepted'`
  - Búsqueda de usuarios → verificar flag `isFollowing`
- [ ] 11.6 Escribir integration tests para RLS policies:
  - Verificar que usuario A no puede leer datos privados de usuario B
  - Verificar que usuario A no puede modificar perfil de usuario B
  - Verificar que perfiles privados solo visibles para followers aceptados

**Requisitos que implementa:** REQ-2.1, REQ-3.5, REQ-4.2, REQ-4.3, REQ-6.5, REQ-7.5, REQ-12.2, REQ-12.3, REQ-19.2, REQ-19.3

---

## Tarea 12: CI/CD y Configuración de Deployment

- [ ] 12.1 Crear `.github/workflows/ci.yml` con jobs: lint, type-check, test:unit, test:property, test:integration (en paralelo donde sea posible)
- [ ] 12.2 Crear `.github/workflows/deploy.yml` con jobs: test → deploy-backend (Railway) + deploy-frontend (Vercel) + migrate-db (supabase db push) en paralelo tras tests
- [ ] 12.3 Configurar generación automática de tipos Supabase en CI: `supabase gen types typescript > packages/shared/src/types/database.types.ts`
- [ ] 12.4 Crear `apps/backend/Dockerfile` para deployment en Railway
- [ ] 12.5 Crear `vercel.json` en `apps/frontend` con configuración de build y rewrites para SPA
- [ ] 12.6 Documentar en `README.md` raíz: setup local, variables de entorno requeridas, comandos de desarrollo, proceso de deployment

**Requisitos que implementa:** REQ-1.3, REQ-1.4

---
