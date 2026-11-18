import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Renders the exact supplied Haus & Co logo PNG unmodified, preserving its
 * three stacked layers (Golden Amber, Golden Yellow, Pale Gold) without
 * redrawing, cropping, stretching, or recolouring.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', className = '' }) => {
  // The official 1024x1024 transparent PNG contains centered artwork; negative vertical margins
  // keep navbar height balanced without cropping or altering the image element bounds.
  const sizeClass =
    size === 'sm'
      ? 'h-24 w-24 -my-8'
      : size === 'lg'
        ? 'h-40 w-40 -my-12'
        : 'h-32 w-32 -my-10';

  return (
    <span className={`inline-flex items-center select-none ${className}`}>
      <img
        src="/assets/haus-co-logo.png"
        alt="Haus & Co logo"
        className={`${sizeClass} object-contain pointer-events-none`}
        draggable={false}
      />
    </span>
  );
};
