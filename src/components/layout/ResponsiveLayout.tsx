import React, { type ReactNode } from 'react';
import { useResponsive, useResponsiveContainer } from '../../hooks/use-responsive';
import { cn } from '../../lib/utils';

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
  sidebar?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  fullWidth?: boolean;
}

export function ResponsiveLayout({
  children,
  className,
  sidebar,
  header,
  footer,
  fullWidth = false,
}: ResponsiveLayoutProps) {
  const { isMobile, isTablet, deviceType } = useResponsive();
  const { containerClass, padding } = useResponsiveContainer();

  const layoutClasses = {
    mobile: 'flex flex-col min-h-screen',
    tablet: 'flex flex-col min-h-screen',
    desktop: sidebar ? 'flex min-h-screen' : 'flex flex-col min-h-screen',
  };

  const mainClasses = {
    mobile: 'flex-1 overflow-auto',
    tablet: 'flex-1 overflow-auto',
    desktop: sidebar ? 'flex-1 overflow-auto ml-0' : 'flex-1 overflow-auto',
  };

  const contentClasses = {
    mobile: fullWidth ? 'w-full px-4' : containerClass,
    tablet: fullWidth ? 'w-full px-6' : containerClass,
    desktop: fullWidth ? 'w-full px-8' : containerClass,
  };

  return (
    <div className={cn(layoutClasses[deviceType], className)}>
      {/* Header - sempre no topo */}
      {header && (
        <header className={cn(
          'w-full border-b bg-white shadow-sm',
          isMobile ? 'sticky top-0 z-40' : 'relative'
        )}>
          {header}
        </header>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - hidden em mobile */}
        {sidebar && !isMobile && (
          <aside className="w-64 border-r bg-white shadow-sm overflow-y-auto">
            {sidebar}
          </aside>
        )}

        {/* Conteúdo principal */}
        <main className={cn(mainClasses[deviceType])}>
          <div className={cn(contentClasses[deviceType], padding)}>
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      {footer && (
        <footer className="w-full border-t bg-white">
          {footer}
        </footer>
      )}
    </div>
  );
}

// Componente para grids responsivos
interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    default: number;
  };
  gap?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    default: number;
  };
  className?: string;
}

export function ResponsiveGrid({
  children,
  cols = { default: 1 },
  gap = { default: 4 },
  className,
}: ResponsiveGridProps) {
  const { getGridCols, getSpacing } = useResponsive();

  const gridCols = getGridCols(cols);
  const gridGap = getSpacing(gap);

  const gridClass = `grid grid-cols-${gridCols} gap-${gridGap}`;

  return (
    <div className={cn(gridClass, className)}>
      {children}
    </div>
  );
}

// Componente para cards responsivos
interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
  padding?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
    default: string;
  };
  shadow?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
    default: string;
  };
}

export function ResponsiveCard({
  children,
  className,
  padding = { default: 'p-4' },
  shadow = { default: 'shadow-md' },
}: ResponsiveCardProps) {
  const { getResponsiveValue } = useResponsive();

  const cardPadding = getResponsiveValue(padding);
  const cardShadow = getResponsiveValue(shadow);

  return (
    <div className={cn(
      'bg-white rounded-lg border',
      cardPadding,
      cardShadow,
      className
    )}>
      {children}
    </div>
  );
}

// Componente para navegação mobile
interface MobileNavigationProps {
  items: Array<{
    icon: React.ElementType;
    label: string;
    path: string;
    isActive?: boolean;
    onClick?: () => void;
  }>;
  className?: string;
}

export function MobileNavigation({ items, className }: MobileNavigationProps) {
  const { isMobile } = useResponsive();

  if (!isMobile) return null;

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50',
      'bg-white border-t shadow-lg',
      'grid grid-cols-5 gap-1 p-2',
      className
    )}>
      {items.slice(0, 5).map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={index}
            onClick={item.onClick}
            className={cn(
              'flex flex-col items-center justify-center',
              'py-2 px-1 rounded-lg transition-colors',
              'text-xs font-medium',
              item.isActive
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            <Icon className="h-5 w-5 mb-1" />
            <span className="truncate max-w-full">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// Componente para stack responsivo (flex direction muda conforme tela)
interface ResponsiveStackProps {
  children: ReactNode;
  direction?: {
    mobile?: 'row' | 'col';
    tablet?: 'row' | 'col';
    desktop?: 'row' | 'col';
    default: 'row' | 'col';
  };
  align?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
    default: string;
  };
  gap?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    default: number;
  };
  className?: string;
}

export function ResponsiveStack({
  children,
  direction = { default: 'col' },
  align = { default: 'items-start' },
  gap = { default: 4 },
  className,
}: ResponsiveStackProps) {
  const { getResponsiveValue, getSpacing } = useResponsive();

  const flexDirection = getResponsiveValue(direction);
  const alignment = getResponsiveValue(align);
  const spacing = getSpacing(gap);

  const stackClass = cn(
    'flex',
    flexDirection === 'row' ? 'flex-row' : 'flex-col',
    alignment,
    `gap-${spacing}`,
    className
  );

  return (
    <div className={stackClass}>
      {children}
    </div>
  );
}

// Hook para detectar orientação em mobile
export function useOrientation() {
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait');

  React.useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return orientation;
}

// Componente para texto responsivo
interface ResponsiveTextProps {
  children: ReactNode;
  size?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
    default: string;
  };
  weight?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
    default: string;
  };
  className?: string;
}

export function ResponsiveText({
  children,
  size = { default: 'text-base' },
  weight = { default: 'font-normal' },
  className,
}: ResponsiveTextProps) {
  const { getResponsiveValue } = useResponsive();

  const fontSize = getResponsiveValue(size);
  const fontWeight = getResponsiveValue(weight);

  return (
    <span className={cn(fontSize, fontWeight, className)}>
      {children}
    </span>
  );
}
