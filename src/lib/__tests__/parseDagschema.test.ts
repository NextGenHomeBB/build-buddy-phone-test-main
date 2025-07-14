import { describe, it, expect } from 'vitest';
import { parseDagschema } from '../parseDagschema';

const sampleMondayText = `
Dagschema Maandag:

Hoofdstraat 123 Amsterdam 08:00-16:00:
- Jan de Vries
- Piet Janssen [assist]
- Maria van der Berg

Kerkstraat 45 Utrecht 09:00-17:00:
- Tom Bakker
- Lisa de Jong
- Frank Peters [assist material check]

Materiaaldepot Almere 07:30-15:30:
- Sandra Visser
- Robert Klein
- Mike de Groot [assist]

Storing Nieuwegein 10:00-14:00:
- Carlos Mendez
- Emma de Wit

Special Project Rotterdam 08:30-16:30:
- Alex Johnson
- Sophie van Dam
- Tim Verhoeven [assist coordination]
`;

describe('parseDagschema', () => {
  it('should parse the sample Monday schedule correctly', () => {
    const result = parseDagschema(sampleMondayText);
    
    // Check work date is set (should be next Monday)
    expect(result.workDate).toBeInstanceOf(Date);
    
    // Should have 5 address blocks
    expect(result.items).toHaveLength(5);
    
    // Count total workers across all blocks
    const totalWorkers = result.items.reduce((sum, item) => sum + item.workers.length, 0);
    expect(totalWorkers).toBe(14);
    
    // Check first block
    const firstItem = result.items[0];
    expect(firstItem.address).toBe('Hoofdstraat 123 Amsterdam');
    expect(firstItem.startTime).toBe('08:00');
    expect(firstItem.endTime).toBe('16:00');
    expect(firstItem.category).toBe('normal');
    expect(firstItem.workers).toHaveLength(3);
    expect(firstItem.workers[0]).toEqual({ name: 'Jan de Vries', isAssistant: false });
    expect(firstItem.workers[1]).toEqual({ name: 'Piet Janssen', isAssistant: true });
    expect(firstItem.workers[2]).toEqual({ name: 'Maria van der Berg', isAssistant: false });
    
    // Check materials category detection
    const materialItem = result.items.find(item => item.address.includes('Materiaaldepot'));
    expect(materialItem?.category).toBe('materials');
    
    // Check storingen category detection
    const storingItem = result.items.find(item => item.address.includes('Storing'));
    expect(storingItem?.category).toBe('storingen');
    
    // Check specials category detection
    const specialItem = result.items.find(item => item.address.includes('Special'));
    expect(specialItem?.category).toBe('specials');
    
    // Should have 0 absences in this sample
    expect(result.absences).toHaveLength(0);
  });

  it('should handle assistant annotations correctly', () => {
    const textWithAssistants = `
Teststraat 1 08:00-16:00:
- John Doe
- Jane Smith [assist]
- Bob Wilson (assist coordination)
- Alice Brown assist only
`;

    const result = parseDagschema(textWithAssistants);
    const item = result.items[0];
    
    expect(item.workers[0].isAssistant).toBe(false);
    expect(item.workers[1].isAssistant).toBe(true);
    expect(item.workers[2].isAssistant).toBe(true);
    expect(item.workers[3].isAssistant).toBe(true);
  });

  it('should parse absences when present', () => {
    const textWithAbsences = `
Teststraat 1 08:00-16:00:
- John Doe

Afwezig: Peter van der Laan
Absent: Sarah Johnson
`;

    const result = parseDagschema(textWithAbsences);
    
    expect(result.absences).toHaveLength(2);
    expect(result.absences[0].workerName).toBe('Peter van der Laan');
    expect(result.absences[1].workerName).toBe('Sarah Johnson');
  });

  it('should handle empty or malformed input gracefully', () => {
    const result = parseDagschema('');
    
    expect(result.items).toHaveLength(0);
    expect(result.absences).toHaveLength(0);
    expect(result.workDate).toBeInstanceOf(Date);
  });
});