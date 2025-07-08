export interface Project {
  id: string;
  name: string;
  type: 'commercial' | 'residential' | 'infrastructure' | 'renovation' | 'industrial';
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  progress: number;
  manager: string;
  location: string;
  phases: string[];
  materials: ProjectMaterial[];
  labour: LabourEntry[];
  documents: ProjectDocument[];
  activities: ActivityEntry[];
}

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'blocked';
  startDate: string;
  endDate: string;
  progress: number;
  checklist: ChecklistItem[];
  dependencies: string[];
  budget: number;
  spent: number;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  estimatedHours?: number;
}

export interface ProjectMaterial {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantityNeeded: number;
  quantityOrdered: number;
  quantityReceived: number;
  unitPrice: number;
  totalCost: number;
  supplier?: string;
  orderDate?: string;
  expectedDelivery?: string;
}

export interface LabourEntry {
  id: string;
  date: string;
  worker: string;
  role: string;
  hours: number;
  hourlyRate: number;
  totalCost: number;
  phase?: string;
  description?: string;
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: 'blueprint' | 'permit' | 'contract' | 'inspection' | 'photo' | 'other';
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  size: number;
  phase?: string;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Downtown Office Complex',
    type: 'commercial',
    description: 'Modern 12-story office building with retail space on ground floor',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2025-06-30',
    budget: 2500000,
    spent: 850000,
    progress: 34,
    manager: 'Sarah Johnson',
    location: '123 Main Street, Downtown',
    phases: ['1', '2', '3', '4'],
    materials: [
      {
        id: 'm1',
        name: 'Steel Beams',
        category: 'Structural',
        unit: 'tons',
        quantityNeeded: 150,
        quantityOrdered: 100,
        quantityReceived: 80,
        unitPrice: 1200,
        totalCost: 180000,
        supplier: 'Steel Corp Ltd',
        orderDate: '2024-02-01',
        expectedDelivery: '2024-03-15'
      },
      {
        id: 'm2',
        name: 'Concrete Mix',
        category: 'Foundation',
        unit: 'cubic yards',
        quantityNeeded: 800,
        quantityOrdered: 400,
        quantityReceived: 400,
        unitPrice: 150,
        totalCost: 120000,
        supplier: 'Concrete Solutions',
        orderDate: '2024-01-20'
      }
    ],
    labour: [
      {
        id: 'l1',
        date: '2024-03-01',
        worker: 'Mike Wilson',
        role: 'Foreman',
        hours: 8,
        hourlyRate: 45,
        totalCost: 360,
        phase: '2',
        description: 'Foundation inspection and oversight'
      },
      {
        id: 'l2',
        date: '2024-03-01',
        worker: 'Juan Rodriguez',
        role: 'Mason',
        hours: 8,
        hourlyRate: 35,
        totalCost: 280,
        phase: '2',
        description: 'Foundation work'
      }
    ],
    documents: [
      {
        id: 'd1',
        name: 'Building Plans - Rev 3',
        type: 'blueprint',
        url: '/documents/building-plans-rev3.pdf',
        uploadedBy: 'Sarah Johnson',
        uploadedAt: '2024-02-15T10:30:00Z',
        size: 15728640,
        phase: '1'
      },
      {
        id: 'd2',
        name: 'Site Photos - Week 8',
        type: 'photo',
        url: '/documents/site-photos-week8.zip',
        uploadedBy: 'Mike Wilson',
        uploadedAt: '2024-03-01T16:45:00Z',
        size: 52428800
      }
    ],
    activities: [
      {
        id: 'a1',
        timestamp: '2024-03-01T14:30:00Z',
        user: 'Mike Wilson',
        action: 'Completed checklist item',
        details: 'Foundation concrete pour inspection completed',
        type: 'success'
      },
      {
        id: 'a2',
        timestamp: '2024-03-01T09:15:00Z',
        user: 'Sarah Johnson',
        action: 'Updated project status',
        details: 'Phase 2 moved to active status',
        type: 'info'
      }
    ]
  },
  {
    id: '2',
    name: 'Residential Complex A',
    type: 'residential',
    description: '24-unit apartment complex with parking garage',
    status: 'planning',
    startDate: '2024-04-01',
    endDate: '2025-02-28',
    budget: 1800000,
    spent: 120000,
    progress: 7,
    manager: 'David Kim',
    location: '456 Oak Avenue, Suburbs',
    phases: ['5', '6', '7'],
    materials: [],
    labour: [],
    documents: [],
    activities: []
  }
];

export const mockPhases: Phase[] = [
  {
    id: '1',
    projectId: '1',
    name: 'Site Preparation',
    description: 'Excavation, utilities, and foundation preparation',
    status: 'completed',
    startDate: '2024-01-15',
    endDate: '2024-02-29',
    progress: 100,
    budget: 300000,
    spent: 285000,
    dependencies: [],
    checklist: [
      {
        id: 'c1',
        title: 'Site Survey',
        description: 'Complete topographical survey of construction site',
        completed: true,
        completedBy: 'Survey Team Alpha',
        completedAt: '2024-01-18T10:00:00Z',
        priority: 'high',
        category: 'Survey',
        estimatedHours: 16
      },
      {
        id: 'c2',
        title: 'Utility Marking',
        description: 'Mark all underground utilities before excavation',
        completed: true,
        completedBy: 'City Utilities',
        completedAt: '2024-01-22T14:30:00Z',
        priority: 'high',
        category: 'Safety'
      },
      {
        id: 'c3',
        title: 'Excavation',
        description: 'Excavate foundation area to required depth',
        completed: true,
        completedBy: 'Excavation Crew',
        completedAt: '2024-02-15T16:00:00Z',
        priority: 'medium',
        category: 'Earthwork',
        estimatedHours: 40
      }
    ]
  },
  {
    id: '2',
    projectId: '1',
    name: 'Foundation',
    description: 'Pour foundation, install utilities rough-in',
    status: 'active',
    startDate: '2024-03-01',
    endDate: '2024-04-15',
    progress: 65,
    budget: 450000,
    spent: 280000,
    dependencies: ['1'],
    checklist: [
      {
        id: 'c4',
        title: 'Foundation Forms',
        description: 'Set up foundation forms and reinforcement',
        completed: true,
        completedBy: 'Form Crew',
        completedAt: '2024-03-05T12:00:00Z',
        priority: 'high',
        category: 'Concrete',
        estimatedHours: 24
      },
      {
        id: 'c5',
        title: 'Concrete Pour',
        description: 'Pour foundation concrete',
        completed: true,
        completedBy: 'Concrete Crew',
        completedAt: '2024-03-08T08:00:00Z',
        priority: 'high',
        category: 'Concrete',
        estimatedHours: 12
      },
      {
        id: 'c6',
        title: 'Utility Rough-in',
        description: 'Install underground plumbing and electrical',
        completed: false,
        priority: 'medium',
        category: 'Utilities',
        estimatedHours: 32
      },
      {
        id: 'c7',
        title: 'Foundation Inspection',
        description: 'City inspection of foundation work',
        completed: false,
        priority: 'high',
        category: 'Inspection'
      }
    ]
  },
  {
    id: '3',
    projectId: '1',
    name: 'Framing',
    description: 'Steel frame construction and deck installation',
    status: 'pending',
    startDate: '2024-04-16',
    endDate: '2024-07-30',
    progress: 0,
    budget: 800000,
    spent: 0,
    dependencies: ['2'],
    checklist: [
      {
        id: 'c8',
        title: 'Steel Delivery',
        description: 'Receive and organize steel beam delivery',
        completed: false,
        priority: 'high',
        category: 'Materials'
      },
      {
        id: 'c9',
        title: 'Frame Installation',
        description: 'Install main structural steel frame',
        completed: false,
        priority: 'high',
        category: 'Structural',
        estimatedHours: 120
      }
    ]
  }
];