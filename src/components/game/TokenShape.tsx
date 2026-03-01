import { PlayerColor } from './types';

interface TokenShapeProps {
  color: PlayerColor;
  shape: string;
  size?: string | number;
}

const C: Record<PlayerColor, { main: string; light: string; dark: string }> = {
  red: { main: '#E53935', light: '#EF5350', dark: '#B71C1C' },
  green: { main: '#43A047', light: '#66BB6A', dark: '#1B5E20' },
  blue: { main: '#1E88E5', light: '#42A5F5', dark: '#0D47A1' },
  yellow: { main: '#FDD835', light: '#FFEE58', dark: '#F57F17' },
};

/**
 * Custom SVG token shapes - Chess-style designs
 * Each token is rendered as a custom shape matching the player's color
 */
export const renderTokenShape = (shape: string, color: PlayerColor, size?: string | number) => {
  const colorObj = C[color];

  switch (shape) {
    case 'horse':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ fill: colorObj.main }}>
          {/* Classic Chess Knight */}
          <defs>
            <linearGradient id={`horseGrad-${color}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={colorObj.light} />
              <stop offset="50%" stopColor={colorObj.main} />
              <stop offset="100%" stopColor={colorObj.dark} />
            </linearGradient>
          </defs>
          
          {/* Base/Pedestal */}
          <ellipse cx="50" cy="92" rx="22" ry="6" fill={colorObj.dark} opacity="0.7" />
          <rect x="42" y="82" width="16" height="10" fill={`url(#horseGrad-${color})`} stroke={colorObj.dark} strokeWidth="1" />
          
          {/* Front Left Leg */}
          <rect x="38" y="78" width="5" height="12" fill={`url(#horseGrad-${color})`} stroke={colorObj.dark} strokeWidth="0.8" rx="2" />
          
          {/* Back Right Leg */}
          <rect x="57" y="78" width="5" height="12" fill={`url(#horseGrad-${color})`} stroke={colorObj.dark} strokeWidth="0.8" rx="2" />
          
          {/* Body - Compact and curved */}
          <ellipse cx="50" cy="65" rx="18" ry="15" fill={`url(#horseGrad-${color})`} stroke={colorObj.dark} strokeWidth="1.2" />
          
          {/* Shoulder/Neck connection */}
          <path d="M 60 60 Q 68 55 72 45" fill="none" stroke={colorObj.dark} strokeWidth="1.2" strokeLinecap="round" />
          
          {/* Neck - Curved and elegant */}
          <path d="M 72 45 Q 75 38 76 28 L 72 28 Q 71 38 68 45 Z" fill={`url(#horseGrad-${color})`} stroke={colorObj.dark} strokeWidth="1.2" />
          
          {/* Head - Horse-like profile */}
          <path d="M 72 28 Q 78 25 80 16 L 75 14 Q 72 22 68 28 Z" fill={`url(#horseGrad-${color})`} stroke={colorObj.dark} strokeWidth="1.2" />
          
          {/* Main Head */}
          <ellipse cx="74" cy="22" rx="10" ry="12" fill={`url(#horseGrad-${color})`} stroke={colorObj.dark} strokeWidth="1.2" />
          
          {/* Snout/Nose */}
          <ellipse cx="82" cy="24" rx="6" ry="5" fill={colorObj.light} stroke={colorObj.dark} strokeWidth="0.8" />
          <circle cx="85" cy="24" r="1.5" fill={colorObj.dark} />
          
          {/* Ear - Standing tall */}
          <path d="M 76 12 L 78 4 L 74 10 Z" fill={`url(#horseGrad-${color})`} stroke={colorObj.dark} strokeWidth="0.8" />
          <path d="M 72 13 L 70 5 L 71 11 Z" fill={`url(#horseGrad-${color})`} stroke={colorObj.dark} strokeWidth="0.8" />
          
          {/* Forelock/Mane */}
          <path d="M 73 18 Q 75 12 77 10" fill="none" stroke={colorObj.dark} strokeWidth="1" strokeLinecap="round" />
          <path d="M 70 20 Q 72 13 74 10" fill="none" stroke={colorObj.dark} strokeWidth="1" strokeLinecap="round" />
          
          {/* Eye */}
          <circle cx="70" cy="20" r="1.5" fill={colorObj.dark} />
          
          {/* Mane along neck */}
          <path d="M 68 28 Q 70 22 71 16" fill="none" stroke={colorObj.dark} strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
          <path d="M 66 32 Q 68 26 69 18" fill="none" stroke={colorObj.dark} strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
          
          {/* Tail - Flowing */}
          <path d="M 35 68 Q 28 68 24 75" fill="none" stroke={colorObj.dark} strokeWidth="2" strokeLinecap="round" />
          <path d="M 33 65 Q 25 63 20 72" fill="none" stroke={colorObj.dark} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          
          {/* Highlight on body for depth */}
          <ellipse cx="48" cy="60" rx="8" ry="10" fill={colorObj.light} opacity="0.5" />
        </svg>
      );

    case 'lion':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ fill: colorObj.main }}>
          {/* Lion Head with Mane */}
          <defs>
            <radialGradient id={`lionGrad-${color}`} cx="35%" cy="35%">
              <stop offset="0%" stopColor={colorObj.light} />
              <stop offset="100%" stopColor={colorObj.dark} />
            </radialGradient>
          </defs>
          
          {/* Mane (back) */}
          <circle cx="50" cy="50" r="40" fill="none" stroke={`url(#lionGrad-${color})`} strokeWidth="12" opacity="0.8" />
          
          {/* Head */}
          <circle cx="50" cy="50" r="28" fill={`url(#lionGrad-${color})`} stroke={colorObj.dark} strokeWidth="2" />
          
          {/* Mane (front) */}
          <path d="M 25 35 Q 20 30 18 40 Q 22 38 25 42 Z" fill={colorObj.dark} />
          <path d="M 30 25 Q 25 20 28 30 Q 32 26 35 30 Z" fill={colorObj.dark} />
          <path d="M 75 25 Q 80 20 77 30 Q 73 26 70 30 Z" fill={colorObj.dark} />
          <path d="M 75 35 Q 80 30 82 40 Q 78 38 75 42 Z" fill={colorObj.dark} />
          
          {/* Snout */}
          <ellipse cx="50" cy="60" rx="12" ry="10" fill={colorObj.light} stroke={colorObj.dark} strokeWidth="1" />
          
          {/* Nose */}
          <circle cx="50" cy="62" r="3" fill={colorObj.dark} />
          
          {/* Eyes */}
          <circle cx="43" cy="45" r="3" fill={colorObj.dark} />
          <circle cx="57" cy="45" r="3" fill={colorObj.dark} />
          
          {/* Mouth */}
          <path d="M 50 62 L 48 68 M 50 62 L 52 68" stroke={colorObj.dark} strokeWidth="1.5" />
          
          {/* Whiskers */}
          <line x1="30" y1="55" x2="15" y2="53" stroke={colorObj.dark} strokeWidth="1" />
          <line x1="70" y1="55" x2="85" y2="53" stroke={colorObj.dark} strokeWidth="1" />
        </svg>
      );

    case 'wolf':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ fill: colorObj.main }}>
          {/* Wolf Head */}
          <defs>
            <linearGradient id={`wolfGrad-${color}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={colorObj.light} />
              <stop offset="100%" stopColor={colorObj.dark} />
            </linearGradient>
          </defs>
          
          {/* Head Shape */}
          <ellipse cx="50" cy="50" rx="30" ry="32" fill={`url(#wolfGrad-${color})`} stroke={colorObj.dark} strokeWidth="2" />
          
          {/* Snout */}
          <ellipse cx="50" cy="62" rx="18" ry="14" fill={colorObj.light} stroke={colorObj.dark} strokeWidth="1.5" />
          
          {/* Ears */}
          <path d="M 30 25 L 25 8 L 32 20 Z" fill={`url(#wolfGrad-${color})`} stroke={colorObj.dark} strokeWidth="1.5" />
          <path d="M 70 25 L 75 8 L 68 20 Z" fill={`url(#wolfGrad-${color})`} stroke={colorObj.dark} strokeWidth="1.5" />
          
          {/* Nose */}
          <ellipse cx="50" cy="63" rx="4" ry="3" fill={colorObj.dark} />
          
          {/* Eyes - Intense */}
          <circle cx="40" cy="42" r="4" fill={colorObj.dark} />
          <circle cx="60" cy="42" r="4" fill={colorObj.dark} />
          <circle cx="41" cy="41" r="1.5" fill="#FFF" opacity="0.7" />
          <circle cx="61" cy="41" r="1.5" fill="#FFF" opacity="0.7" />
          
          {/* Mouth */}
          <path d="M 50 63 L 50 72" stroke={colorObj.dark} strokeWidth="2" />
          <path d="M 46 68 L 50 72 L 54 68" stroke={colorObj.dark} strokeWidth="1.5" fill="none" />
          
          {/* Whiskers */}
          <line x1="28" y1="50" x2="10" y2="48" stroke={colorObj.dark} strokeWidth="1" />
          <line x1="72" y1="50" x2="90" y2="48" stroke={colorObj.dark} strokeWidth="1" />
        </svg>
      );

    case 'bomb':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ fill: colorObj.main }}>
          {/* Bomb Body */}
          <defs>
            <radialGradient id={`bombGrad-${color}`} cx="40%" cy="40%">
              <stop offset="0%" stopColor={colorObj.light} />
              <stop offset="100%" stopColor={colorObj.dark} />
            </radialGradient>
          </defs>
          
          {/* Main Sphere */}
          <circle cx="50" cy="55" r="32" fill={`url(#bombGrad-${color})`} stroke={colorObj.dark} strokeWidth="2" />
          
          {/* Fuse */}
          <path d="M 50 23 Q 45 15 50 8" stroke={colorObj.dark} strokeWidth="3" fill="none" strokeLinecap="round" />
          
          {/* Spark at top */}
          <circle cx="50" cy="8" r="2.5" fill="#FFD835" />
          <line x1="48" y1="6" x2="45" y2="3" stroke="#FFD835" strokeWidth="1" />
          <line x1="52" y1="6" x2="55" y2="3" stroke="#FFD835" strokeWidth="1" />
          
          {/* Highlight */}
          <ellipse cx="38" cy="42" rx="12" ry="16" fill={colorObj.light} opacity="0.6" />
          
          {/* Dents/Details */}
          <circle cx="45" cy="75" r="2" fill={colorObj.dark} opacity="0.5" />
          <circle cx="55" cy="80" r="2" fill={colorObj.dark} opacity="0.5" />
          <circle cx="50" cy="85" r="1.5" fill={colorObj.dark} opacity="0.5" />
        </svg>
      );

    case 'star':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ fill: colorObj.main }}>
          {/* Five-pointed star */}
          <defs>
            <linearGradient id={`starGrad-${color}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={colorObj.light} />
              <stop offset="100%" stopColor={colorObj.dark} />
            </linearGradient>
          </defs>
          
          <path
            d="M 50 10 L 61 40 L 92 40 L 68 60 L 79 90 L 50 70 L 21 90 L 32 60 L 8 40 L 39 40 Z"
            fill={`url(#starGrad-${color})`}
            stroke={colorObj.dark}
            strokeWidth="2"
          />
          
          {/* Inner shine */}
          <path
            d="M 50 25 L 58 42 L 75 42 L 62 55 L 70 72 L 50 58 L 30 72 L 38 55 L 25 42 L 42 42 Z"
            fill={colorObj.light}
            opacity="0.5"
          />
        </svg>
      );

    case 'heart':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ fill: colorObj.main }}>
          {/* Heart shape */}
          <defs>
            <linearGradient id={`heartGrad-${color}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={colorObj.light} />
              <stop offset="100%" stopColor={colorObj.dark} />
            </linearGradient>
          </defs>
          
          <path
            d="M 50 90 C 50 90 15 70 15 50 C 15 38 23 30 32 30 C 40 30 47 37 50 45 C 53 37 60 30 68 30 C 77 30 85 38 85 50 C 85 70 50 90 50 90 Z"
            fill={`url(#heartGrad-${color})`}
            stroke={colorObj.dark}
            strokeWidth="2"
          />
          
          {/* Shine */}
          <ellipse cx="40" cy="45" rx="8" ry="10" fill={colorObj.light} opacity="0.6" />
        </svg>
      );

    case 'circle':
    default:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" style={{ fill: colorObj.main }}>
          {/* Simple circle with gradient */}
          <defs>
            <radialGradient id={`circleGrad-${color}`} cx="35%" cy="35%">
              <stop offset="0%" stopColor={colorObj.light} />
              <stop offset="100%" stopColor={colorObj.dark} />
            </radialGradient>
          </defs>
          
          <circle cx="50" cy="50" r="45" fill={`url(#circleGrad-${color})`} stroke={colorObj.dark} strokeWidth="2" />
          
          {/* Highlight */}
          <circle cx="35" cy="35" r="12" fill={colorObj.light} opacity="0.5" />
        </svg>
      );
  }
};
