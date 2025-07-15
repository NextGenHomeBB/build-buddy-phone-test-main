-- Fix the import_schedule_tx function to handle auth context and correct column mappings

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
  system_user_id   uuid;
BEGIN
  -- Get a system user for created_by or use a default UUID for auto-imports
  SELECT user_id INTO system_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
  IF system_user_id IS NULL THEN
    system_user_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  -- 1 ▸ schedule row
  SELECT id INTO sched_id FROM schedules WHERE work_date = work_date;
  IF sched_id IS NULL THEN
    INSERT INTO schedules (work_date, created_by) VALUES (work_date, system_user_id) RETURNING id INTO sched_id;
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
        (name, location, status, source, start_date, end_date)
      VALUES
        (trim(it->>'address'),
         trim(it->>'address'),
         'planning',
         'auto_import',
         work_date,
         work_date + interval '30 days')
      RETURNING id INTO proj_id;

      INSERT INTO project_phases (project_id, name, status)
      VALUES (proj_id, 'General', 'planning')
      RETURNING id INTO phase_id;

      new_projects := new_projects + 1;
    END IF;

    --------------------------------------------------
    -- schedule_item
    --------------------------------------------------
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

    --------------------------------------------------
    -- workers
    --------------------------------------------------
    FOR w_name IN SELECT jsonb_array_elements_text(it->'workers')
    LOOP
      w_name := trim(w_name);
      IF w_name = '' THEN CONTINUE; END IF;

      -- Fix: Use 'id' column instead of 'user_id' for lookup
      SELECT id INTO w_id
      FROM profiles
      WHERE lower(name) = lower(w_name);

      IF w_id IS NULL THEN
        w_id := gen_random_uuid();
        -- Fix: Set both id and user_id for placeholder users
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
    'success',          true,
    'schedule_id',      sched_id,
    'created_projects', new_projects,
    'created_workers',  new_workers
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error',   SQLERRM,
    'code',    SQLSTATE
  );
END;
$function$;