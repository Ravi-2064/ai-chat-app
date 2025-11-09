import { ComponentType, SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  withBackground?: boolean;
  rounded?: boolean;
}

const sizeMap = {
  // Extra extra small - for very small indicators (80% of original)
  '2xs': 'h-2.5 w-2.5',
  // Extra small - for small action buttons (80% of original)
  'xs': 'h-3 w-3',
  // Small - for most UI icons (80% of original)
  'sm': 'h-3.5 w-3.5',
  // Medium - default size (80% of original)
  'md': 'h-4 w-4',
  // Large - for more prominent icons (80% of original)
  'lg': 'h-5 w-5',
  // Extra large - for important actions (80% of original)
  'xl': 'h-6 w-6',
  // 2XL - for very prominent icons (80% of original)
  '2xl': 'h-7 w-7',
  // 3XL - for hero/feature icons (80% of original)
  '3xl': 'h-8 w-8',
};

export const Icon = ({ 
  icon: IconComponent, 
  size = 'md',
  className = '',
  withBackground = false,
  rounded = true,
  ...props 
}: IconProps) => {
  const sizeClass = sizeMap[size] || sizeMap.md;
  const backgroundClass = withBackground 
    ? `p-1.5 ${rounded ? 'rounded-full' : 'rounded-md'} bg-opacity-10` 
    : '';
  
  return (
    <span className={`inline-flex items-center justify-center ${backgroundClass} ${className}`}>
      <IconComponent 
        className={`flex-shrink-0 ${sizeClass}`}
        aria-hidden="true"
        {...props}
      />
    </span>
  );
};

export default Icon;
