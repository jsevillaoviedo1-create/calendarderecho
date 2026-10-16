import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number | string;
  withShadow?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = 'w-9 h-9',
  size,
  withShadow = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <img
        src="/icon.svg"
        alt="Calendario Derecho Pro"
        className={`w-full h-full object-contain rounded-xl ${
          withShadow ? 'drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]' : ''
        }`}
        loading="eager"
      />
    </div>
  );
};
