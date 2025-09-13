import { renderHook, act } from '@testing-library/react';
import { 
  useKeyboardNavigation, 
  useFocusManagement, 
  useReducedMotion,
  useLiveRegion,
  useResponsive 
} from '../useAccessibility';

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean) => ({
  matches,
  media: '',
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

describe('useKeyboardNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onEscape when Escape key is pressed', () => {
    const onEscape = jest.fn();
    renderHook(() => useKeyboardNavigation(onEscape));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
    });

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('calls onEnter when Enter key is pressed', () => {
    const onEnter = jest.fn();
    renderHook(() => useKeyboardNavigation(undefined, onEnter));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);
    });

    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('calls onArrowKeys with correct direction', () => {
    const onArrowKeys = jest.fn();
    renderHook(() => useKeyboardNavigation(undefined, undefined, onArrowKeys));

    act(() => {
      const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      document.dispatchEvent(upEvent);
    });

    expect(onArrowKeys).toHaveBeenCalledWith('up');

    act(() => {
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(downEvent);
    });

    expect(onArrowKeys).toHaveBeenCalledWith('down');
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useKeyboardNavigation());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});

describe('useFocusManagement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('focuses element by ID', () => {
    const { result } = renderHook(() => useFocusManagement());
    
    // Create a test element
    const testElement = document.createElement('button');
    testElement.id = 'test-button';
    document.body.appendChild(testElement);

    act(() => {
      result.current.focusById('test-button');
    });

    expect(document.activeElement).toBe(testElement);
  });

  it('focuses first focusable element', () => {
    const { result } = renderHook(() => useFocusManagement());
    
    // Create test elements
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    document.body.appendChild(button1);
    document.body.appendChild(button2);

    act(() => {
      result.current.focusFirst();
    });

    expect(document.activeElement).toBe(button1);
  });

  it('focuses last focusable element', () => {
    const { result } = renderHook(() => useFocusManagement());
    
    // Create test elements
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    document.body.appendChild(button1);
    document.body.appendChild(button2);

    act(() => {
      result.current.focusLast();
    });

    expect(document.activeElement).toBe(button2);
  });
});

describe('useReducedMotion', () => {
  beforeEach(() => {
    // Reset window.matchMedia mock
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn(),
    });
  });

  it('returns true when user prefers reduced motion', () => {
    (window.matchMedia as jest.Mock).mockReturnValue(mockMatchMedia(true));

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);
  });

  it('returns false when user does not prefer reduced motion', () => {
    (window.matchMedia as jest.Mock).mockReturnValue(mockMatchMedia(false));

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
  });

  it('updates when media query changes', () => {
    const mockMedia = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    (window.matchMedia as jest.Mock).mockReturnValue(mockMedia);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      const changeHandler = mockMedia.addEventListener.mock.calls[0][1];
      changeHandler({ matches: true });
    });

    expect(result.current).toBe(true);
  });
});

describe('useLiveRegion', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates live region for announcements', () => {
    const { result } = renderHook(() => useLiveRegion());

    act(() => {
      result.current.announce('Test announcement');
    });

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveTextContent('Test announcement');
  });

  it('removes live region after timeout', () => {
    const { result } = renderHook(() => useLiveRegion());

    act(() => {
      result.current.announce('Test announcement');
    });

    expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(document.querySelector('[aria-live="polite"]')).not.toBeInTheDocument();
  });

  it('supports assertive announcements', () => {
    const { result } = renderHook(() => useLiveRegion());

    act(() => {
      result.current.announce('Urgent announcement', 'assertive');
    });

    const liveRegion = document.querySelector('[aria-live="assertive"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveTextContent('Urgent announcement');
  });
});

describe('useResponsive', () => {
  beforeEach(() => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // Mock addEventListener and removeEventListener
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
  });

  it('detects desktop breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024 });
    
    const { result } = renderHook(() => useResponsive());

    expect(result.current.breakpoint).toBe('lg');
    expect(result.current.isDesktop).toBe(false); // lg is still tablet
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isMobile).toBe(false);
  });

  it('detects mobile breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500 });
    
    const { result } = renderHook(() => useResponsive());

    expect(result.current.breakpoint).toBe('sm');
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it('detects large desktop breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1400 });
    
    const { result } = renderHook(() => useResponsive());

    expect(result.current.breakpoint).toBe('2xl');
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isMobile).toBe(false);
  });
});