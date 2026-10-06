import React from 'react';

interface ItpgqLogoProps {
  className?: string;
}

export const ItpgqLogo: React.FC<ItpgqLogoProps> = ({ className = 'h-12 w-12 shrink-0' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 240"
      className={className}
      role="img"
      aria-label="Logótipo Instituto Médio de Gestão Quineus (I.M.G.Q)"
    >
      <defs>
        <path id="itpgqTopArc" d="M 32,124 A 88,88 0 1,1 208,124" />
      </defs>
      {/* Outer Gold & Navy Rings */}
      <circle cx="120" cy="120" r="116" fill="#f7f7f2" stroke="#d4a017" strokeWidth="5" />
      <circle cx="120" cy="120" r="110" fill="#fbfbf7" stroke="#0d2538" strokeWidth="4" />
      <circle cx="120" cy="120" r="76" fill="#fbfbf7" stroke="#0d2538" strokeWidth="3.5" />

      {/* Arched Title */}
      <text
        fill="#0d2538"
        fontFamily="Arial, sans-serif"
        fontSize="15.5"
        fontWeight="900"
        letterSpacing="1"
      >
        <textPath href="#itpgqTopArc" startOffset="50%" textAnchor="middle">
          INSTITUTO MÉDIO DE GESTÃO QUINEUS
        </textPath>
      </text>

      {/* Gears (Left) */}
      <g transform="translate(80,76)" fill="#226699" stroke="#0d2538" strokeWidth="2">
        <circle cx="0" cy="0" r="11" />
        <circle cx="0" cy="0" r="4.5" fill="#fbfbf7" />
        <g stroke="#0d2538" strokeWidth="3">
          <line x1="0" y1="-14" x2="0" y2="-11" />
          <line x1="0" y1="11" x2="0" y2="14" />
          <line x1="-14" y1="0" x2="-11" y2="0" />
          <line x1="11" y1="0" x2="14" y2="0" />
          <line x1="-10" y1="-10" x2="-8" y2="-8" />
          <line x1="8" y1="8" x2="10" y2="10" />
          <line x1="10" y1="-10" x2="8" y2="-8" />
          <line x1="-8" y1="8" x2="-10" y2="10" />
        </g>
      </g>
      <g transform="translate(66,97)" fill="#226699" stroke="#0d2538" strokeWidth="2">
        <circle cx="0" cy="0" r="8.5" />
        <circle cx="0" cy="0" r="3.5" fill="#fbfbf7" />
      </g>

      {/* Bar Chart & Rising Arrow (Center) */}
      <g stroke="#0d2538" strokeWidth="2" strokeLinejoin="round">
        <rect x="100" y="88" width="6" height="8" fill="#2e856e" />
        <rect x="109" y="81" width="6" height="15" fill="#2e856e" />
        <rect x="118" y="74" width="6" height="22" fill="#2e856e" />
        <rect x="127" y="65" width="6" height="31" fill="#2e856e" />
        <path
          d="M 100,82 L 112,70 L 117,74 L 131,56"
          fill="none"
          stroke="#0d2538"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <polygon points="133,54 125,56 131,62" fill="#0d2538" />
      </g>

      {/* Microchip (Right) */}
      <g transform="translate(145,66)">
        <rect
          x="0"
          y="0"
          width="26"
          height="26"
          rx="3"
          fill="#226699"
          stroke="#0d2538"
          strokeWidth="2.2"
        />
        <line x1="5" y1="-5" x2="5" y2="0" stroke="#0d2538" strokeWidth="2.2" />
        <line x1="11" y1="-5" x2="11" y2="0" stroke="#0d2538" strokeWidth="2.2" />
        <line x1="16" y1="-5" x2="16" y2="0" stroke="#0d2538" strokeWidth="2.2" />
        <line x1="21" y1="-5" x2="21" y2="0" stroke="#0d2538" strokeWidth="2.2" />
        <line x1="5" y1="26" x2="5" y2="31" stroke="#0d2538" strokeWidth="2.2" />
        <line x1="11" y1="26" x2="11" y2="31" stroke="#0d2538" strokeWidth="2.2" />
        <line x1="16" y1="26" x2="16" y2="31" stroke="#0d2538" strokeWidth="2.2" />
        <line x1="21" y1="26" x2="21" y2="31" stroke="#0d2538" strokeWidth="2.2" />
        <line x1="-5" y1="6" x2="0" y2="6" stroke="#0d2538" strokeWidth="2.2" />
        <line x1="-5" y1="13" x2="0" y2="13" stroke="#0d2538" strokeWidth="2.2" />
        <line x1="-5" y1="20" x2="0" y2="20" stroke="#0d2538" strokeWidth="2.2" />
        <line x1="26" y1="6" x2="31" y2="6" stroke="#0d2538" strokeWidth="2.2" />
        <line x1="26" y1="13" x2="31" y2="13" stroke="#0d2538" strokeWidth="2.2" />
        <line x1="26" y1="20" x2="31" y2="20" stroke="#0d2538" strokeWidth="2.2" />
        <text
          x="13"
          y="12"
          textAnchor="middle"
          fill="#0d2538"
          fontFamily="monospace"
          fontSize="8"
          fontWeight="bold"
        >
          1101
        </text>
        <text
          x="13"
          y="21"
          textAnchor="middle"
          fill="#0d2538"
          fontFamily="monospace"
          fontSize="8"
          fontWeight="bold"
        >
          010
        </text>
      </g>

      {/* Rising Sun */}
      <g>
        <path d="M 94,142 A 26,26 0 0,1 146,142 Z" fill="#f7be2c" />
        <g stroke="#e6b022" strokeWidth="2.5" strokeLinecap="round">
          <line x1="120" y1="103" x2="120" y2="111" />
          <line x1="105" y1="106" x2="108" y2="114" />
          <line x1="135" y1="106" x2="132" y2="114" />
          <line x1="92" y1="114" x2="98" y2="120" />
          <line x1="148" y1="114" x2="142" y2="120" />
          <line x1="83" y1="126" x2="90" y2="129" />
          <line x1="157" y1="126" x2="150" y2="129" />
        </g>
      </g>

      {/* Open Book (Rigor | Qualidade) */}
      <g stroke="#0d2538" strokeWidth="2.5" strokeLinejoin="round">
        <path
          d="M 64,178 L 76,142 C 92,140 108,144 120,152 C 132,144 148,140 164,142 L 176,178 C 156,176 136,179 120,186 C 104,179 84,176 64,178 Z"
          fill="#1e6b99"
        />
        <path
          d="M 70,172 L 80,138 C 95,136 108,140 120,148 L 120,180 C 106,173 88,170 70,172 Z"
          fill="#ffffff"
        />
        <path
          d="M 170,172 L 160,138 C 145,136 132,140 120,148 L 120,180 C 134,173 152,170 170,172 Z"
          fill="#ffffff"
        />
      </g>
      <text
        x="96"
        y="160"
        textAnchor="middle"
        fill="#0d2538"
        fontFamily="Arial, sans-serif"
        fontSize="10.5"
        fontWeight="bold"
        transform="rotate(5, 96, 160)"
      >
        Rigor
      </text>
      <text
        x="144"
        y="160"
        textAnchor="middle"
        fill="#0d2538"
        fontFamily="Arial, sans-serif"
        fontSize="8.8"
        fontWeight="bold"
        transform="rotate(-5, 144, 160)"
      >
        Qualidade
      </text>

      {/* Bottom Gold Banner (I.M.G.Q) */}
      <path
        d="M 44,193 Q 120,235 196,193 L 184,175 Q 120,212 56,175 Z"
        fill="#f7be2c"
        stroke="#0d2538"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <text
        x="120"
        y="217"
        textAnchor="middle"
        fill="#0d2538"
        fontFamily="Arial, sans-serif"
        fontSize="21"
        fontWeight="900"
        letterSpacing="2"
      >
        I.M.G.Q
      </text>
    </svg>
  );
};
