interface LogoCarouselProps {
  title?: string;
  logos: string[];
  speed?: number; // seconds for one full loop
  logoHeight?: string;
  className?: string;
}

export function LogoCarousel({
  title = "Trusted by educators worldwide",
  logos,
  speed = 25,
  logoHeight = "26px",
  className = "",
}: LogoCarouselProps) {
  // Duplicate logos for seamless loop
  const doubled = [...logos, ...logos];

  return (
    <div className={`w-full overflow-hidden py-12 lg:py-16 ${className}`}>
      {/* Title */}
      <p
        className="text-center text-[13px] font-semibold uppercase tracking-widest mb-10"
        style={{ color: "#64748b" }}
      >
        {title}
      </p>

      {/* Scroll container */}
      <div className="logo-carousel-mask">
        <div
          className="logo-carousel-track"
          style={{ animationDuration: `${speed}s` }}
        >
          {doubled.map((src, i) => (
            <div key={i} className="logo-carousel-item">
              <img
                src={src}
                alt=""
                style={{ height: logoHeight }}
                className="logo-carousel-img"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LogoCarousel;
