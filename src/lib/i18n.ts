// Simple i18n function for demo purposes
export function t(key: string, params?: Record<string, any>): string {
  let result = key;
  
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      result = result.replace(`{{${param}}}`, String(value));
    });
  }
  
  return result;
}

// Make it globally available
declare global {
  function t(key: string, params?: Record<string, any>): string;
}

(globalThis as any).t = t;