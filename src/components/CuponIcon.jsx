// ============================================================
//  src/components/CuponIcon.jsx
//  Ícono de cupón de descuento claro y reconocible
// ============================================================

export default function CuponIcon({ size = 14, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Forma del cupón con muesca en los lados */}
      <path
        d="M2 9C2 7.89543 2.89543 7 4 7H20C21.1046 7 22 7.89543 22 9V10.5C21.1716 10.5 20.5 11.1716 20.5 12C20.5 12.8284 21.1716 13.5 22 13.5V15C22 16.1046 21.1046 17 20 17H4C2.89543 17 2 16.1046 2 15V13.5C2.82843 13.5 3.5 12.8284 3.5 12C3.5 11.1716 2.82843 10.5 2 10.5V9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Línea punteada vertical del cupón */}
      <line x1="9" y1="7.5" x2="9" y2="16.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
      {/* % símbolo */}
      <text
        x="15.5"
        y="13.5"
        textAnchor="middle"
        fontSize="6"
        fontWeight="700"
        fill="currentColor"
        fontFamily="sans-serif"
      >
        %
      </text>
    </svg>
  );
}
