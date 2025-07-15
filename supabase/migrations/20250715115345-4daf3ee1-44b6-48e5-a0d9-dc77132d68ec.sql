-- Fix the creator UID extraction to handle empty strings properly
CREATE OR REPLACE FUNCTION public.import_schedule_tx(payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  work_date        date := (payload->>'workDate')::date;
  items            jsonb :=  payload->'scheduleItems';
  sched_id         uuid;
  it               jsonb;
  proj_id          uuid;
  phase_id         uuid;
  sched_item_id    uuid;
  w_name           text;
  w_id             uuid;
  new_projects     int := 0;
  new_workers      int := 0;
  new_schedule_items int := 0;
  skipped_items    int := 0;
  system_user_id   uuid;
  creator_uid      uuid;
BEGIN
  -- Get the authenticated user from JWT context (cleaner approach)
  creator_uid := nullif(current_setting('request.jwt.claims', true)::json->>'sub','')::uuid;

  -- Get a system user for fallback or use a default UUID for auto-imports
  SELECT user_id INTO system_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
  IF system_user_id IS NULL THEN
    system_user_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  -- Use creator_uid if available, otherwise fall back to system_user_id
  creator_uid := COALESCE(creator_uid, system_user_id);

  -- 1 ▸ schedule row - fix ambiguous work_date reference
  SELECT s.id INTO sched_id FROM schedules s WHERE s.work_date = work_date;
  IF sched_id IS NULL THEN
    INSERT INTO schedules (work_date, created_by) VALUES (work_date, creator_uid) RETURNING id INTO sched_id;
  END IF;

  -- 2 ▸ loop blocks
  FOR it IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    --------------------------------------------------
    -- project
    --------------------------------------------------
    SELECT id INTO proj_id
    FROM projects
    WHERE lower(trim(name)) = lower(trim(it->>'address'));

    IF proj_id IS NULL THEN
      INSERT INTO projects
        (name, location, status, source, start_date, end_date, created_by)
      VALUES
        (trim(it->>'address'),
         trim(it->>'address'),
         'planning',
         'auto_import',
         work_date,
         work_date + interval '30 days',
         creator_uid)
      RETURNING id INTO proj_id;

      INSERT INTO project_phases (project_id, name, status)
      VALUES (proj_id, 'General', 'planning')
      RETURNING id INTO phase_id;

      -- Ensure the creator becomes manager of the new project
      INSERT INTO user_project_role (user_id, project_id, role)
      VALUES (creator_uid, proj_id, 'manager')
      ON CONFLICT (user_id, project_id, role) DO NOTHING;

      new_projects := new_projects + 1;
    END IF;

    --------------------------------------------------
    -- schedule_item (check for duplicates first)
    --------------------------------------------------
    -- Check if schedule item already exists
    SELECT si.id INTO sched_item_id
    FROM schedule_items si
    WHERE si.schedule_id = sched_id
      AND lower(trim(si.address)) = lower(trim(it->>'address'))
      AND si.start_time = (it->>'startTime')::time
      AND si.end_time = (it->>'endTime')::time;

    IF sched_item_id IS NULL THEN
      -- Insert new schedule item if it doesn't exist
      INSERT INTO schedule_items
        (schedule_id, address, category, start_time, end_time, project_id)
      VALUES
        (sched_id,
         trim(it->>'address'),
         coalesce(it->>'category', 'General'),
         (it->>'startTime')::time,
         (it->>'endTime')::time,
         proj_id)
      RETURNING id INTO sched_item_id;
      
      new_schedule_items := new_schedule_items + 1;
    ELSE
      -- Schedule item already exists, skip creation but still process workers
      skipped_items := skipped_items + 1;
    END IF;

    --------------------------------------------------
    -- workers (process regardless of whether schedule item was new or existing)
    --------------------------------------------------
    FOR w_name IN SELECT jsonb_array_elements_text(it->'workers')
    LOOP
      w_name := trim(w_name);
      IF w_name = '' THEN CONTINUE; END IF;

      -- Fix: Use 'user_id' column for lookup (profiles table uses user_id as primary identifier)
      SELECT user_id INTO w_id
      FROM profiles
      WHERE lower(name) = lower(w_name);

      IF w_id IS NULL THEN
        w_id := gen_random_uuid();
        -- Create placeholder user profile
        INSERT INTO profiles (id, user_id, name, is_placeholder)
        VALUES (gen_random_uuid(), w_id, w_name, true);
        new_workers := new_workers + 1;
      END IF;

      INSERT INTO schedule_item_workers (schedule_item_id, user_id)
      VALUES (sched_item_id, w_id) ON CONFLICT DO NOTHING;

      INSERT INTO user_project_role (user_id, project_id, role)
      VALUES (w_id, proj_id, 'worker')
      ON CONFLICT (user_id, project_id, role) DO NOTHING;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'success',            true,
    'schedule_id',        sched_id,
    'created_projects',   new_projects,
    'created_workers',    new_workers,
    'created_schedule_items', new_schedule_items,
    'skipped_duplicate_items', skipped_items
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error',   SQLERRM,
    'code',    SQLSTATE
  );
END;
$function$;