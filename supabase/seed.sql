-- ============================================================
-- Seed Data: Datos iniciales para VPA
-- Idempotente: usa ON CONFLICT DO NOTHING para permitir
-- múltiples ejecuciones sin duplicar datos.
-- ============================================================

-- ========== RUTINAS DE ENTRENAMIENTO ==========

INSERT INTO public.routine_templates (id, pro_name, title, description, is_active) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'TenZ', 'TenZ Aim Routine', 'Rutina de aim training del profesional TenZ. Enfocada en precisión y velocidad de reacción con ejercicios de Galería y Deathmatch.', true),
  ('a1b2c3d4-0001-4000-8000-000000000002', 'Shroud', 'Shroud Warmup', 'Rutina de calentamiento inspirada en Shroud. Combina tracking, flicking y partidas DM para preparar antes de competitivo.', true),
  ('a1b2c3d4-0001-4000-8000-000000000003', 'Asuna', 'Asuna Aggro Training', 'Rutina agresiva de Asuna enfocada en duelos, entradas y control de recoil. Ideal para duelistas.', true)
ON CONFLICT DO NOTHING;

-- ========== EJERCICIOS DE ENTRENAMIENTO ==========

-- Ejercicios para TenZ Aim Routine
INSERT INTO public.exercise_templates (id, routine_id, name, metric_unit, type, threshold_pass, threshold_excellent, is_indefinite) VALUES
  ('b2c3d4e5-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'Gridshot Precision', 'score', 'GALLERY', 80000, 95000, false),
  ('b2c3d4e5-0001-4000-8000-000000000002', 'a1b2c3d4-0001-4000-8000-000000000001', 'Microshot Speed', 'score', 'GALLERY', 60000, 80000, false),
  ('b2c3d4e5-0001-4000-8000-000000000003', 'a1b2c3d4-0001-4000-8000-000000000001', 'Deathmatch Kills', 'kills', 'DM', 20, 30, false)
ON CONFLICT DO NOTHING;

-- Ejercicios para Shroud Warmup
INSERT INTO public.exercise_templates (id, routine_id, name, metric_unit, type, threshold_pass, threshold_excellent, is_indefinite) VALUES
  ('b2c3d4e5-0002-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000002', 'Tracking Practice', 'accuracy', 'GALLERY', 60, 85, false),
  ('b2c3d4e5-0002-4000-8000-000000000002', 'a1b2c3d4-0001-4000-8000-000000000002', 'Flick Training', 'score', 'GALLERY', 70000, 90000, false),
  ('b2c3d4e5-0002-4000-8000-000000000003', 'a1b2c3d4-0001-4000-8000-000000000002', 'DM Warmup', 'kills', 'DM', 15, 25, false)
ON CONFLICT DO NOTHING;

-- Ejercicios para Asuna Aggro Training
INSERT INTO public.exercise_templates (id, routine_id, name, metric_unit, type, threshold_pass, threshold_excellent, is_indefinite) VALUES
  ('b2c3d4e5-0003-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000003', 'Entry Frag Drill', 'kills', 'GALLERY', 15, 25, false),
  ('b2c3d4e5-0003-4000-8000-000000000002', 'a1b2c3d4-0001-4000-8000-000000000003', 'Recoil Control', 'accuracy', 'GALLERY', 65, 90, false),
  ('b2c3d4e5-0003-4000-8000-000000000003', 'a1b2c3d4-0001-4000-8000-000000000003', 'Aggro DM', 'kills', 'DM', 25, 35, false)
ON CONFLICT DO NOTHING;

-- ========== COACHING TIPS ==========

INSERT INTO public.coaching_tips (id, category, grade_trigger, message) VALUES
  (gen_random_uuid(), 'aim', 'BAD', 'Tu precisión necesita trabajo. Intenta bajar tu sensibilidad un 10% y practica movimientos lentos y controlados.'),
  (gen_random_uuid(), 'aim', 'PASSABLE', 'Vas por buen camino con el aim. Enfócate en la consistencia: intenta mantener este nivel en 3 sesiones seguidas.'),
  (gen_random_uuid(), 'movement', 'BAD', 'Tu movimiento te está costando duelos. Practica counter-strafing en el Range antes de cada sesión.'),
  (gen_random_uuid(), 'movement', 'PASSABLE', 'Tu movimiento es decente. Para mejorar, combina jiggle-peeking con pre-aim en ángulos comunes.'),
  (gen_random_uuid(), 'positioning', 'BAD', 'Estás tomando duelos en desventaja. Revisa tus replays y busca posiciones donde tengas cover cercano.'),
  (gen_random_uuid(), 'positioning', 'PASSABLE', 'Tu posicionamiento está mejorando. Intenta variar tus ángulos para no ser predecible.'),
  (gen_random_uuid(), 'crosshair', 'BAD', 'Tu crosshair placement está bajo. Practica mantener la mira a nivel de cabeza mientras caminas por los mapas.'),
  (gen_random_uuid(), 'crosshair', 'PASSABLE', 'Buen crosshair placement. Para llegar a EXCELLENT, enfócate en pre-aim en los ángulos más comunes del mapa.'),
  (gen_random_uuid(), 'reaction', 'BAD', 'Tu tiempo de reacción necesita mejora. Asegúrate de calentar al menos 10 minutos antes de jugar competitivo.'),
  (gen_random_uuid(), 'reaction', 'PASSABLE', 'Tus reflejos son buenos. Para el siguiente nivel, practica la anticipación: predice dónde aparecerá el enemigo.')
ON CONFLICT DO NOTHING;

-- ========== TÍTULOS DESBLOQUEABLES ==========

INSERT INTO public.unlockable_titles (id, name, description, unlock_condition_type, unlock_condition_value) VALUES
  (gen_random_uuid(), 'Dedicado', 'Completa una racha de 7 días consecutivos', 'STREAK_REACHED', 7),
  (gen_random_uuid(), 'Imparable', 'Completa una racha de 14 días consecutivos', 'STREAK_REACHED', 14),
  (gen_random_uuid(), 'Leyenda', 'Completa una racha de 30 días consecutivos', 'STREAK_REACHED', 30),
  (gen_random_uuid(), 'Graduado', 'Completa tu primera rutina de entrenamiento', 'ROUTINES_COMPLETED', 1),
  (gen_random_uuid(), 'Veterano', 'Completa 5 rutinas de entrenamiento', 'ROUTINES_COMPLETED', 5),
  (gen_random_uuid(), 'Constante', 'Completa 50 sesiones de entrenamiento', 'SESSIONS_COMPLETED', 50),
  (gen_random_uuid(), 'Máquina', 'Completa 100 sesiones de entrenamiento', 'SESSIONS_COMPLETED', 100)
ON CONFLICT DO NOTHING;
