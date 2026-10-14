import React, { useState, useEffect, useRef } from "react";

const clsx = (...args: (string | undefined | false)[]) =>
  args.filter(Boolean).join(" ");

type LazyImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  className?: string;
  theme?: string;
  onErrorFallback?: React.ReactNode;
};

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  onErrorFallback,
  ...props
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = src;
            obs.unobserve(img);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px 100px 0px",
        threshold: 0.1,
      }
    );

    if (imgRef.current) observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) observer.unobserve(imgRef.current);
    };
  }, [src]);

  const handleLoad = () => {
    setLoaded(true);
    setError(false);
  };

  const handleError = () => {
    setLoaded(true);
    setError(true);
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: error ? "transparent" : "#e5e7eb",
    position: "relative",
    overflow: "hidden",
  };

  const imageClasses = clsx(
    "object-cover transition-opacity duration-500",
    loaded ? "opacity-100" : "opacity-0",
    className
  );

  return (
    <div
      style={containerStyle}
      className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center"
    >
      {error && onErrorFallback ? (
        onErrorFallback
      ) : (
        <img
          ref={imgRef}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={imageClasses}
          {...props}
        />
      )}
      {!loaded && !error && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ backgroundColor: "#e5e7eb" }}
        />
      )}
    </div>
  );
};

export default LazyImage;
