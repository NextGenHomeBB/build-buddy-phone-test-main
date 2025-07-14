import { format, nextMonday, parse } from 'date-fns';

export interface ParsedWorker {
  name: string;
  isAssistant: boolean;
}

export interface ParsedScheduleItem {
  address: string;
  category: 'normal' | 'materials' | 'storingen' | 'specials';
  startTime: string;
  endTime: string;
  workers: ParsedWorker[];
}

export interface ParsedAbsence {
  workerName: string;
  reason?: string;
}

export interface ParsedSchedule {
  workDate: Date;
  items: ParsedScheduleItem[];
  absences: ParsedAbsence[];
}

const CATEGORY_KEYWORDS = {
  materials: ['materiaal', 'material', 'materials'],
  storingen: ['storing', 'storingen', 'emergency', 'urgent'],
  specials: ['special', 'specials', 'bijzonder', 'extra']
};

function detectCategory(address: string): 'normal' | 'materials' | 'storingen' | 'specials' {
  const addressLower = address.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => addressLower.includes(keyword))) {
      return category as 'materials' | 'storingen' | 'specials';
    }
  }
  
  return 'normal';
}

function parseTimeRange(timeStr: string): { start: string; end: string } | null {
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
  if (!timeMatch) return null;
  
  const [, startHour, startMin, endHour, endMin] = timeMatch;
  return {
    start: `${startHour.padStart(2, '0')}:${startMin}`,
    end: `${endHour.padStart(2, '0')}:${endMin}`
  };
}

function parseWorkerLine(line: string): ParsedWorker | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('-')) return null;
  
  const workerText = trimmed.substring(1).trim();
  const isAssistant = workerText.includes('assist') || workerText.includes('Assist');
  
  // Extract name (remove assist annotations)
  let name = workerText
    .replace(/\[.*assist.*\]/gi, '')
    .replace(/\(.*assist.*\)/gi, '')
    .replace(/assist/gi, '')
    .trim();
  
  // Remove any trailing punctuation
  name = name.replace(/[.,;:]$/, '').trim();
  
  if (!name) return null;
  
  return { name, isAssistant };
}

function parseWorkDate(text: string): Date {
  // Look for date patterns in the text
  const dayNames = {
    'maandag': 1,
    'dinsdag': 2,
    'woensdag': 3,
    'donderdag': 4,
    'vrijdag': 5,
    'zaterdag': 6,
    'zondag': 0
  };
  
  const textLower = text.toLowerCase();
  for (const [dayName, dayOfWeek] of Object.entries(dayNames)) {
    if (textLower.includes(dayName)) {
      // Find the next occurrence of this day
      const today = new Date();
      const nextDay = nextMonday(today);
      const daysToAdd = (dayOfWeek - 1 + 7) % 7;
      const targetDate = new Date(nextDay);
      targetDate.setDate(targetDate.getDate() + daysToAdd);
      return targetDate;
    }
  }
  
  // Default to next Monday if no day is found
  return nextMonday(new Date());
}

export function parseDagschema(raw: string): ParsedSchedule {
  const lines = raw.split('\n').map(line => line.trim()).filter(Boolean);
  const workDate = parseWorkDate(raw);
  const items: ParsedScheduleItem[] = [];
  const absences: ParsedAbsence[] = [];
  
  let currentItem: Partial<ParsedScheduleItem> | null = null;
  
  for (const line of lines) {
    // Skip header lines
    if (line.toLowerCase().includes('dagschema') || line.toLowerCase().includes('schema')) {
      continue;
    }
    
    // Try to parse as address block with time
    const timeRange = parseTimeRange(line);
    if (timeRange) {
      // Save previous item if exists
      if (currentItem && currentItem.address && currentItem.startTime && currentItem.endTime) {
        items.push({
          address: currentItem.address,
          category: currentItem.category || 'normal',
          startTime: currentItem.startTime,
          endTime: currentItem.endTime,
          workers: currentItem.workers || []
        });
      }
      
      // Extract address (everything before the time)
      const addressMatch = line.match(/^(.+?)\s+\d{1,2}:\d{2}-\d{1,2}:\d{2}/);
      const address = addressMatch ? addressMatch[1].trim() : 'Unknown Address';
      
      currentItem = {
        address,
        category: detectCategory(address),
        startTime: timeRange.start,
        endTime: timeRange.end,
        workers: []
      };
      continue;
    }
    
    // Try to parse as worker line
    const worker = parseWorkerLine(line);
    if (worker && currentItem) {
      currentItem.workers = currentItem.workers || [];
      currentItem.workers.push(worker);
      continue;
    }
    
    // Check for absence indicators
    if (line.toLowerCase().includes('afwezig') || line.toLowerCase().includes('absent')) {
      // Parse absence - this is a simple implementation
      const name = line.replace(/afwezig|absent/gi, '').replace(/[-:]/g, '').trim();
      if (name) {
        absences.push({ workerName: name });
      }
    }
  }
  
  // Don't forget the last item
  if (currentItem && currentItem.address && currentItem.startTime && currentItem.endTime) {
    items.push({
      address: currentItem.address,
      category: currentItem.category || 'normal',
      startTime: currentItem.startTime,
      endTime: currentItem.endTime,
      workers: currentItem.workers || []
    });
  }
  
  return {
    workDate,
    items,
    absences
  };
}