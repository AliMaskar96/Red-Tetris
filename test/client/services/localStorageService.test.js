// Mock localStorage before importing the service
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Replace global localStorage with our mock
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

const {
  getFromLocalStorage,
  saveToLocalStorage,
  removeFromLocalStorage,
  clearLocalStorage,
  isLocalStorageAvailable
} = require('../../../src/client/services/localStorageService');

describe('localStorageService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('getFromLocalStorage', () => {
    test('should return parsed value when item exists', () => {
      const testData = { score: 1000, level: 5 };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));
      
      const result = getFromLocalStorage('test-key', {});
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(testData);
    });

    test('should return default value when item does not exist', () => {
      const defaultValue = { score: 0, level: 1 };
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = getFromLocalStorage('non-existent-key', defaultValue);
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('non-existent-key');
      expect(result).toEqual(defaultValue);
    });

    test('should return default value when JSON parsing fails', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json-string');
      const defaultValue = { score: 0 };
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = getFromLocalStorage('invalid-json', defaultValue);
      
      expect(result).toEqual(defaultValue);
      expect(consoleSpy).toHaveBeenCalledWith('Error reading from localStorage:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    test('should handle localStorage.getItem throwing error', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      const defaultValue = { score: 0 };
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = getFromLocalStorage('test-key', defaultValue);
      
      expect(result).toEqual(defaultValue);
      expect(consoleSpy).toHaveBeenCalledWith('Error reading from localStorage:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('saveToLocalStorage', () => {
    test('should save value to localStorage as JSON string', () => {
      const testData = { score: 1500, level: 7 };
      
      saveToLocalStorage('test-key', testData);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(testData));
    });

    test('should handle localStorage.setItem throwing error', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      saveToLocalStorage('test-key', { score: 100 });
      
      expect(consoleSpy).toHaveBeenCalledWith('Error saving to localStorage:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    test('should handle JSON.stringify throwing error', () => {
      const circularObj = {};
      circularObj.self = circularObj; // Create circular reference
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      saveToLocalStorage('test-key', circularObj);
      
      expect(consoleSpy).toHaveBeenCalledWith('Error saving to localStorage:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('removeFromLocalStorage', () => {
    test('should remove item from localStorage', () => {
      removeFromLocalStorage('test-key');
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    test('should handle localStorage.removeItem throwing error', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      removeFromLocalStorage('test-key');
      
      expect(consoleSpy).toHaveBeenCalledWith('Error removing from localStorage:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('clearLocalStorage', () => {
    test('should clear all localStorage', () => {
      clearLocalStorage();
      
      expect(mockLocalStorage.clear).toHaveBeenCalled();
    });

    test('should handle localStorage.clear throwing error', () => {
      mockLocalStorage.clear.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      clearLocalStorage();
      
      expect(consoleSpy).toHaveBeenCalledWith('Error clearing localStorage:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('isLocalStorageAvailable', () => {
    test('should return true when localStorage is available', () => {
      // Ensure mocks don't throw errors for success case
      mockLocalStorage.setItem.mockImplementation(() => {});
      mockLocalStorage.removeItem.mockImplementation(() => {});
      
      const result = isLocalStorageAvailable();
      
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('__test__', 'test');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('__test__');
    });

    test('should return false when localStorage is not available', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = isLocalStorageAvailable();
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('localStorage is not available:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    test('should return false when localStorage.removeItem throws error', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = isLocalStorageAvailable();
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('localStorage is not available:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});