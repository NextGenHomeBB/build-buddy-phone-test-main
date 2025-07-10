-- Create AI cost estimation edge function
CREATE OR REPLACE FUNCTION estimate_phase_costs(p_phase_id UUID)
RETURNS JSON AS $$
DECLARE
    phase_record RECORD;
    material_estimate NUMERIC DEFAULT 1000;
    labour_estimate NUMERIC DEFAULT 800;
    result JSON;
BEGIN
    -- Get phase details for estimation
    SELECT pp.name, pp.description, p.type, p.location
    INTO phase_record
    FROM project_phases pp
    JOIN projects p ON p.id = pp.project_id
    WHERE pp.id = p_phase_id;
    
    -- Simple estimation logic based on phase name and project type
    -- In real implementation, this would use AI/ML
    
    -- Adjust estimates based on project type
    CASE phase_record.type
        WHEN 'commercial' THEN
            material_estimate := material_estimate * 2.5;
            labour_estimate := labour_estimate * 2.0;
        WHEN 'infrastructure' THEN
            material_estimate := material_estimate * 3.0;
            labour_estimate := labour_estimate * 2.5;
        WHEN 'renovation' THEN
            material_estimate := material_estimate * 1.5;
            labour_estimate := labour_estimate * 1.2;
        ELSE -- residential
            material_estimate := material_estimate * 1.0;
            labour_estimate := labour_estimate * 1.0;
    END CASE;
    
    -- Adjust based on phase name keywords
    IF phase_record.name ILIKE '%foundation%' OR phase_record.name ILIKE '%concrete%' THEN
        material_estimate := material_estimate * 1.8;
        labour_estimate := labour_estimate * 1.5;
    ELSIF phase_record.name ILIKE '%electrical%' THEN
        material_estimate := material_estimate * 1.2;
        labour_estimate := labour_estimate * 1.8;
    ELSIF phase_record.name ILIKE '%plumbing%' THEN
        material_estimate := material_estimate * 1.3;
        labour_estimate := labour_estimate * 1.6;
    ELSIF phase_record.name ILIKE '%roofing%' THEN
        material_estimate := material_estimate * 1.4;
        labour_estimate := labour_estimate * 1.7;
    ELSIF phase_record.name ILIKE '%finishing%' OR phase_record.name ILIKE '%interior%' THEN
        material_estimate := material_estimate * 1.1;
        labour_estimate := labour_estimate * 1.3;
    END IF;
    
    -- Round to reasonable amounts
    material_estimate := ROUND(material_estimate, 0);
    labour_estimate := ROUND(labour_estimate, 0);
    
    -- Return JSON result
    result := json_build_object(
        'materials', material_estimate,
        'labour', labour_estimate,
        'total', material_estimate + labour_estimate,
        'confidence', 0.75
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;