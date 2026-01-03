
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 100 }) => {
  return (
    <div 
      className={`relative flex items-center justify-center overflow-hidden ${className}`} 
      style={{ width: size, height: size }}
    >
      <img 
        src="assets/logo.png" 
        alt="Real Social Meet Logo" 
        className="w-full h-full object-contain"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          // Simple fallback if image fails to load
          if (target.parentElement) {
            target.parentElement.innerHTML = `
              <div class="flex flex-col items-center justify-center bg-zinc-900 rounded-full w-full h-full border border-white/10">
                <span class="text-[10px] font-black text-rose-500 italic">RSM</span>
              </div>
            `;
          }
        }}
      />
    </div>
  );
};

export default Logo;
