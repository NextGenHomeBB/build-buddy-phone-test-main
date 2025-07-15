import { supabase } from '@/integrations/supabase/client';
import type { ParsedSchedule } from '@/lib/parseDagschema';

export interface AutoImportResult {
  createdProjects: number;
  createdWorkers: number;
  projectMapping: Record<string, string>; // address -> project_id
  workerMapping: Record<string, string>; // worker name -> user_id
}

export async function autoCreateMissingProjectsAndWorkers(
  parsedSchedule: ParsedSchedule
): Promise<AutoImportResult> {
  const result: AutoImportResult = {
    createdProjects: 0,
    createdWorkers: 0,
    projectMapping: {},
    workerMapping: {}
  };

  // Extract unique addresses and worker names
  const uniqueAddresses = [...new Set(parsedSchedule.items.map(item => 
    item.address.trim().replace(/\s+/g, ' ')
  ))];
  
  const allWorkerNames = [
    ...parsedSchedule.items.flatMap(item => item.workers.map(w => w.name)),
    ...parsedSchedule.absences.map(a => a.workerName)
  ];
  const uniqueWorkerNames = [...new Set(allWorkerNames.map(name => 
    name.trim().replace(/\s+/g, ' ')
  ))];

  // 1. Handle Projects - check for existing projects by name (case-insensitive)
  if (uniqueAddresses.length > 0) {
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('id, name')
      .ilike('name', `{${uniqueAddresses.map(addr => addr.replace(/'/g, "''")).join(',')}}`)
      .or(uniqueAddresses.map(addr => `name.ilike.${addr.replace(/'/g, "''")}`).join(','));

    const existingProjectNames = new Set(
      (existingProjects || []).map(p => p.name.toLowerCase())
    );

    // Map existing projects
    (existingProjects || []).forEach(project => {
      const matchingAddress = uniqueAddresses.find(addr => 
        addr.toLowerCase() === project.name.toLowerCase()
      );
      if (matchingAddress) {
        result.projectMapping[matchingAddress] = project.id;
      }
    });

    // Create missing projects
    for (const address of uniqueAddresses) {
      if (!existingProjectNames.has(address.toLowerCase())) {
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert({
            name: address,
            description: `Auto-imported from schedule on ${parsedSchedule.workDate.toDateString()}`,
            location: address,
            status: 'planning',
            source: 'auto_import',
            start_date: parsedSchedule.workDate.toISOString().split('T')[0],
            end_date: new Date(parsedSchedule.workDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days later
            budget: 10000, // Default budget
            remaining_budget: 10000
          })
          .select('id')
          .single();

        if (error) throw error;

        // Create default phase for the project
        await supabase
          .from('project_phases')
          .insert({
            project_id: newProject.id,
            name: 'General',
            description: 'Default phase for auto-imported project',
            status: 'planning',
            budget: 10000
          });

        result.projectMapping[address] = newProject.id;
        result.createdProjects++;
      }
    }
  }

  // 2. Handle Workers - check for existing workers by name (case-insensitive)
  if (uniqueWorkerNames.length > 0) {
    const { data: existingWorkers } = await supabase
      .from('profiles')
      .select('user_id, name')
      .or(uniqueWorkerNames.map(name => `name.ilike.${name.replace(/'/g, "''")}`).join(','));

    const existingWorkerNames = new Set(
      (existingWorkers || []).map(w => w.name.toLowerCase())
    );

    // Map existing workers
    (existingWorkers || []).forEach(worker => {
      const matchingName = uniqueWorkerNames.find(name => 
        name.toLowerCase() === worker.name.toLowerCase()
      );
      if (matchingName) {
        result.workerMapping[matchingName] = worker.user_id;
      }
    });

    // Create missing worker placeholders
    for (const workerName of uniqueWorkerNames) {
      if (!existingWorkerNames.has(workerName.toLowerCase())) {
        const newUserId = crypto.randomUUID();
        
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: crypto.randomUUID(),
            user_id: newUserId,
            name: workerName,
            role: 'worker',
            is_placeholder: true
          });

        if (error) throw error;

        result.workerMapping[workerName] = newUserId;
        result.createdWorkers++;
      }
    }
  }

  // 3. Add workers to projects via user_project_role
  for (const item of parsedSchedule.items) {
    const projectId = result.projectMapping[item.address];
    if (!projectId) continue;

    for (const worker of item.workers) {
      const userId = result.workerMapping[worker.name];
      if (!userId) continue;

      // Add worker to project (ignore conflicts if already exists)
      await supabase
        .from('user_project_role')
        .upsert({
          user_id: userId,
          project_id: projectId,
          role: 'worker'
        }, {
          onConflict: 'user_id,project_id,role'
        });
    }
  }

  return result;
}

export async function getNewItemsPreview(parsedSchedule: ParsedSchedule) {
  const uniqueAddresses = [...new Set(parsedSchedule.items.map(item => 
    item.address.trim().replace(/\s+/g, ' ')
  ))];
  
  const allWorkerNames = [
    ...parsedSchedule.items.flatMap(item => item.workers.map(w => w.name)),
    ...parsedSchedule.absences.map(a => a.workerName)
  ];
  const uniqueWorkerNames = [...new Set(allWorkerNames.map(name => 
    name.trim().replace(/\s+/g, ' ')
  ))];

  // Check existing projects
  const { data: existingProjects } = await supabase
    .from('projects')
    .select('name')
    .or(uniqueAddresses.map(addr => `name.ilike.${addr.replace(/'/g, "''")}`).join(','));
  
  const existingProjectNames = new Set(
    (existingProjects || []).map(p => p.name.toLowerCase())
  );

  // Check existing workers
  const { data: existingWorkers } = await supabase
    .from('profiles')
    .select('name')
    .or(uniqueWorkerNames.map(name => `name.ilike.${name.replace(/'/g, "''")}`).join(','));
  
  const existingWorkerNames = new Set(
    (existingWorkers || []).map(w => w.name.toLowerCase())
  );

  return {
    newProjects: uniqueAddresses.filter(addr => 
      !existingProjectNames.has(addr.toLowerCase())
    ),
    newWorkers: uniqueWorkerNames.filter(name => 
      !existingWorkerNames.has(name.toLowerCase())
    )
  };
}