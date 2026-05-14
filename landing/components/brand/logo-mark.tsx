type LogoMarkProps = {
  className?: string;
  size?: number;
  title?: string;
  style?: React.CSSProperties;
};

export function LogoMark({
  className,
  size = 24,
  title = "Green Flagged",
  style,
}: LogoMarkProps) {
  // Aspect ratio 482:332 ≈ 1.452
  const height = size;
  const width = Math.round(size * (482 / 332));

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 482 332"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
      style={style}
    >
      <title>{title}</title>
      <g stroke="currentColor" strokeLinecap="square">
        <line x1="5" y1="326.031" x2="5" y2="4.99649" strokeWidth="10" strokeDasharray="32 18" />
        <line x1="10" y1="8" x2="106" y2="8" strokeWidth="12" />
        <line x1="106" y1="11" x2="220" y2="11" strokeWidth="6" />
        <line x1="10" y1="34" x2="289" y2="34" strokeWidth="8" />
        <line x1="10" y1="32" x2="133" y2="32" strokeWidth="12" />
        <line x1="10" y1="58" x2="408" y2="58" strokeWidth="8" />
        <line x1="10" y1="56" x2="149" y2="56" strokeWidth="12" />
        <line x1="277" y1="61" x2="408" y2="61" strokeWidth="10" />
        <line x1="10" y1="82" x2="421" y2="82" strokeWidth="8" />
        <line x1="10" y1="80" x2="154" y2="80" strokeWidth="12" />
        <line x1="261" y1="85" x2="421" y2="85" strokeWidth="6" />
        <line x1="10" y1="104" x2="421" y2="104" strokeWidth="8" />
        <line x1="10" y1="103" x2="154" y2="103" strokeWidth="10" />
        <line x1="276" y1="100" x2="421" y2="100" strokeWidth="6" />
        <line x1="10" y1="131" x2="430" y2="131" strokeWidth="6" />
        <line x1="10" y1="129" x2="199" y2="129" strokeWidth="10" />
        <line x1="293" y1="129" x2="430" y2="129" strokeWidth="10" />
        <line x1="10" y1="154.5" x2="430" y2="154.5" strokeWidth="7" />
        <line x1="300" y1="153" x2="430" y2="153" strokeWidth="10" />
        <line x1="10" y1="152" x2="191" y2="152" strokeWidth="12" />
        <line x1="10" y1="171.5" x2="442" y2="171.5" strokeWidth="5" />
        <line x1="291" y1="171" x2="442" y2="171" strokeWidth="6" />
        <line x1="10" y1="170" x2="144" y2="170" strokeWidth="8" />
        <line x1="10" y1="186" x2="449" y2="186" strokeWidth="8" />
        <line x1="10" y1="185" x2="163" y2="185" strokeWidth="10" />
        <line x1="301" y1="182" x2="449" y2="182" strokeWidth="6" />
        <line x1="22" y1="203.5" x2="457" y2="203.5" strokeWidth="7" />
        <line x1="322" y1="202" x2="456" y2="202" strokeWidth="10" />
        <line x1="22" y1="201" x2="210" y2="201" strokeWidth="12" />
        <line x1="140" y1="220.5" x2="467" y2="220.5" strokeWidth="5" />
        <line x1="314" y1="220" x2="467" y2="220" strokeWidth="6" />
        <line x1="147" y1="219" x2="249" y2="219" strokeWidth="8" />
        <line x1="140" y1="219" x2="242" y2="219" strokeWidth="8" />
        <line x1="293" y1="235" x2="478" y2="235" strokeWidth="8" />
        <line x1="412" y1="231" x2="478" y2="231" strokeWidth="6" />
        <line x1="317" y1="253.5" x2="481" y2="253.5" strokeWidth="5" />
        <line x1="317" y1="251.5" x2="387" y2="251.5" strokeWidth="9" />
        <line x1="420" y1="252" x2="482" y2="252" strokeWidth="8" />
      </g>
    </svg>
  );
}
