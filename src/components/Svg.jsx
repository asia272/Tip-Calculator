export default function SVG({ svgRef, className = "" }) {
  return (
    <svg
      className={`w-24 h-24 mx-auto mb-6 absolute ${className}`}
      viewBox='0 0 100 100'
    >
      <path
        id='circle'
        ref={svgRef}
        fill='none'
        stroke='hsl(172, 67%, 45%)'
        strokeWidth='8'
        d='
          M50 10
          A40 40 0 1 1 49.999 10
        '
      />

      <path
        id='checkmark'
        fill='none'
        stroke='hsl(172, 67%, 45%)'
        strokeWidth='8'
        d='M20 55 L40 75 L80 30'
        style={{ visibility: "hidden" }}
      />
    </svg>
  );
}
