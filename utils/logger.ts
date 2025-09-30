// Simple logger utility for secure logging
export const secureLogger = {
  log: (message: string, data?: any) => {
    console.log(`[LOG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  
  info: (message: string, data?: any) => {
    console.info(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },
  
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
};