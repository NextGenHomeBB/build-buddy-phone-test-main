-- A. add helper cols if missing
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS is_placeholder boolean DEFAULT false;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';

-- B. replace broken function
DROP FUNCTION IF EXISTS import_schedule_tx(jsonb);

CREATE OR REPLACE FUNCTION import_schedule_tx(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
BEGIN
  -- 1 ▸ schedule row
  SELECT id INTO sched_id FROM schedules WHERE work_date = work_date;
  IF sched_id IS NULL THEN
    INSERT INTO schedules (work_date, created_by) VALUES (work_date, auth.uid()) RETURNING id INTO sched_id;
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

      SELECT user_id INTO w_id
      FROM profiles
      WHERE lower(name) = lower(w_name);

      IF w_id IS NULL THEN
        w_id := gen_random_uuid();
        INSERT INTO profiles (user_id, name, is_placeholder)
        VALUES (w_id, w_name, true);
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
$$;