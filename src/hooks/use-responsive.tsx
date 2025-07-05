import { useState, useEffect } from 'react';

export type BreakpointSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface ResponsiveConfig {
  breakpoints: Record<BreakpointSize, number>;
  deviceBreakpoints: {
    mobile: number;
    tablet: number;
  };
}

const defaultConfig: ResponsiveConfig = {
  breakpoints: {
    xs: 475,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  deviceBreakpoints: {
    mobile: 768,
    tablet: 1024,
  },
};

export function useResponsive(config: Partial<ResponsiveConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };

  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Device type detection
  const deviceType: DeviceType =
    windowSize.width < finalConfig.deviceBreakpoints.mobile ? 'mobile' :
    windowSize.width < finalConfig.deviceBreakpoints.tablet ? 'tablet' : 'desktop';

  // Breakpoint checks
  const breakpoints = {
    xs: windowSize.width >= finalConfig.breakpoints.xs,
    sm: windowSize.width >= finalConfig.breakpoints.sm,
    md: windowSize.width >= finalConfig.breakpoints.md,
    lg: windowSize.width >= finalConfig.breakpoints.lg,
    xl: windowSize.width >= finalConfig.breakpoints.xl,
    '2xl': windowSize.width >= finalConfig.breakpoints['2xl'],
  };

  // Utility functions
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isDesktop = deviceType === 'desktop';
  const isTouchDevice = isMobile || isTablet;

  // Responsive values helper
  function getResponsiveValue<T>(values: {
    mobile?: T;
    tablet?: T;
    desktop?: T;
    default: T;
  }): T {
    if (isMobile && values.mobile !== undefined) return values.mobile;
    if (isTablet && values.tablet !== undefined) return values.tablet;
    if (isDesktop && values.desktop !== undefined) return values.desktop;
    return values.default;
  }

  // Responsive grid columns
  const getGridCols = (config: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    default: number;
  }) => getResponsiveValue(config);

  // Responsive spacing
  const getSpacing = (config: {
    mobile?: string | number;
    tablet?: string | number;
    desktop?: string | number;
    default: string | number;
  }) => getResponsiveValue(config);

  // Responsive font sizes
  const getFontSize = (config: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
    default: string;
  }) => getResponsiveValue(config);

  return {
    windowSize,
    deviceType,
    breakpoints,
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    getResponsiveValue,
    getGridCols,
    getSpacing,
    getFontSize,
  };
}

// Hook for media queries
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Predefined breakpoint hooks
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)');
}

export function useIsTablet() {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)');
}

// Touch device detection
export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
      );
    };

    checkTouchDevice();
    window.addEventListener('resize', checkTouchDevice);

    return () => window.removeEventListener('resize', checkTouchDevice);
  }, []);

  return isTouchDevice;
}

// Responsive container hook
export function useResponsiveContainer() {
  const { deviceType, windowSize } = useResponsive();

  const containerClass = {
    mobile: 'container mx-auto px-4 max-w-full',
    tablet: 'container mx-auto px-6 max-w-4xl',
    desktop: 'container mx-auto px-8 max-w-7xl',
  }[deviceType];

  const padding = {
    mobile: 'p-4',
    tablet: 'p-6',
    desktop: 'p-8',
  }[deviceType];

  return {
    containerClass,
    padding,
    deviceType,
    windowSize,
  };
}
