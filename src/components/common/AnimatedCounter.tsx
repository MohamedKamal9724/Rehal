import React, { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatter?: (val: number) => string;
  highlightOnChange?: boolean;
}

/**
 * AnimatedCounter
 * Smoothly interpolates numeric values using requestAnimationFrame with a quartic ease-out curve.
 * Includes tabular figures to prevent layout shift and transient highlight flashes on value changes.
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 450,
  prefix = '',
  suffix = '',
  className = '',
  formatter = (v) => Math.round(v).toLocaleString(),
  highlightOnChange = true,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [isChanging, setIsChanging] = useState<'up' | 'down' | null>(null);
  const prevValueRef = useRef<number>(value);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const fromVal = prevValueRef.current;
    const toVal = value;

    if (fromVal === toVal || prefersReducedMotion) {
      setDisplayValue(toVal);
      prevValueRef.current = toVal;
      return;
    }

    if (highlightOnChange) {
      setIsChanging(toVal > fromVal ? 'up' : 'down');
      const timer = setTimeout(() => setIsChanging(null), Math.max(duration, 400));
      return () => {
        clearTimeout(timer);
      };
    }
  }, [value, duration, highlightOnChange]);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const fromVal = prevValueRef.current;
    const toVal = value;

    if (fromVal === toVal || prefersReducedMotion) {
      setDisplayValue(toVal);
      prevValueRef.current = toVal;
      return;
    }

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const rawProgress = Math.min(elapsed / duration, 1);
      
      // Quartic ease-out: 1 - (1 - t)^4
      const easedProgress = 1 - Math.pow(1 - rawProgress, 4);
      const current = fromVal + (toVal - fromVal) * easedProgress;

      setDisplayValue(current);

      if (rawProgress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(toVal);
        prevValueRef.current = toVal;
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value, duration]);

  return (
    <span
      className={`inline-block tabular-nums transition-colors duration-300 ${
        isChanging === 'up'
          ? 'text-[#008009] scale-[1.02]'
          : isChanging === 'down'
          ? 'text-[#006ce4] scale-[0.99]'
          : ''
      } ${className}`}
    >
      {prefix}
      {formatter(displayValue)}
      {suffix}
    </span>
  );
};
