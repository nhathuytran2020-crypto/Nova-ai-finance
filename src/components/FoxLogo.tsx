import React from 'react';
import foxImg from '../assets/images/fox_logo_icon_1787548701390.jpg';

interface FoxLogoProps {
  className?: string;
  size?: number | string;
  useImage?: boolean;
}

export const FoxLogo: React.FC<FoxLogoProps> = ({ className = 'w-6 h-6', size, useImage = false }) => {
  if (useImage) {
    return (
      <img
        src={foxImg}
        alt="Nova Fox Logo"
        referrerPolicy="no-referrer"
        className={`object-contain rounded-full select-none ${className}`}
        style={size ? { width: size, height: size } : undefined}
      />
    );
  }

  // Crisp Vector SVG rendition of the majestic geometric Fox Head
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Nova Fox Logo"
    >
      {/* Outer Ears and Head Silhouette */}
      <path
        d="M 50 18 
           C 54 26, 62 30, 68 22 
           C 74 14, 82 10, 84 26 
           C 86 42, 80 48, 88 56 
           C 92 60, 84 66, 80 62 
           C 82 70, 76 76, 70 72 
           C 72 78, 64 86, 50 94 
           C 36 86, 28 78, 30 72 
           C 24 76, 18 70, 20 62 
           C 16 66, 8 60, 12 56 
           C 20 48, 14 42, 16 26 
           C 18 10, 26 14, 32 22 
           C 38 30, 46 26, 50 18 Z"
        fill="none"
      />
      {/* Fox Mask / Face Geometry matching the uploaded white fox emblem */}
      <g fill="currentColor">
        {/* Forehead center crown */}
        <path d="M 50 20 L 55 35 L 50 42 L 45 35 Z" />
        
        {/* Left Ear & Crown Wing */}
        <path d="M 48 22 C 42 28 34 26 28 17 C 27 28 32 40 40 44 C 36 36 42 27 48 22 Z" />
        
        {/* Right Ear & Crown Wing */}
        <path d="M 52 22 C 58 28 66 26 72 17 C 73 28 68 40 60 44 C 64 36 58 27 52 22 Z" />
        
        {/* Left Brow & Temple Arc */}
        <path d="M 46 45 C 38 41 28 42 19 32 C 21 44 28 50 38 52 C 32 48 38 45 46 45 Z" />
        
        {/* Right Brow & Temple Arc */}
        <path d="M 54 45 C 62 41 72 42 81 32 C 79 44 72 50 62 52 C 68 48 62 45 54 45 Z" />
        
        {/* Left Eye Slit (sleek wise eyes) */}
        <path d="M 37 49 C 41 49 44 52 44 54 C 41 53 38 52 35 52 C 34 50 35 49 37 49 Z" />
        
        {/* Right Eye Slit */}
        <path d="M 63 49 C 59 49 56 52 56 54 C 59 53 62 52 65 52 C 66 50 65 49 63 49 Z" />
        
        {/* Left Upper Cheek Whisker Tuft */}
        <path d="M 36 54 C 27 54 18 50 13 46 C 16 57 26 62 38 61 C 32 58 34 55 36 54 Z" />
        
        {/* Right Upper Cheek Whisker Tuft */}
        <path d="M 64 54 C 73 54 82 50 87 46 C 84 57 74 62 62 61 C 68 58 66 55 64 54 Z" />

        {/* Left Lower Cheek Tuft */}
        <path d="M 39 63 C 28 64 21 61 17 58 C 22 69 32 72 42 69 C 38 67 38 64 39 63 Z" />

        {/* Right Lower Cheek Tuft */}
        <path d="M 61 63 C 72 64 79 61 83 58 C 78 69 68 72 58 69 C 62 67 62 64 61 63 Z" />

        {/* Left Jaw Flare */}
        <path d="M 43 71 C 32 75 28 72 26 71 C 33 80 42 81 48 76 C 45 74 44 72 43 71 Z" />

        {/* Right Jaw Flare */}
        <path d="M 57 71 C 68 75 72 72 74 71 C 67 80 58 81 52 76 C 55 74 56 72 57 71 Z" />

        {/* Center Snout & Nose Bridge */}
        <path d="M 50 48 C 47 54 46 62 47 67 C 49 69 51 69 53 67 C 54 62 53 54 50 48 Z" />

        {/* Nose Tip & Muzzle Base */}
        <path d="M 48 69 C 48 68 52 68 52 69 C 53 71 52 73 50 73 C 48 73 47 71 48 69 Z" />

        {/* Center Beard / Chin Arrow Point */}
        <path d="M 50 76 C 47 79 43 83 45 86 C 48 89 50 93 50 93 C 50 93 52 89 55 86 C 57 83 53 79 50 76 Z" />
      </g>
    </svg>
  );
};
