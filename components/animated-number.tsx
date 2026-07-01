"use client";

import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({
  value,
  precision = 0,
  className,
}: {
  value: number;
  precision?: number;
  className?: string;
}) {
  const [displayed, setDisplayed] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef<number>(0);

  useEffect(() => {
    fromRef.current = displayed;
    startRef.current = performance.now();
    const duration = 700;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = fromRef.current + (value - fromRef.current) * eased;
      setDisplayed(next);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className={className}>
      {displayed.toFixed(precision)}
    </span>
  );
}
