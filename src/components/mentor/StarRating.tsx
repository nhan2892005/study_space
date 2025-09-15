"use client";

import React, { useState, useMemo, useCallback } from 'react';

type StarRatingProps = {
  rating: number; // 0..5, can be fractional
  size?: number; // svg size in px
  editable?: boolean; // if true, supports click/hover
  onChange?: (newRating: number) => void; // when user clicks
  className?: string;
  showScore?: boolean; // show numeric score next to stars
  max?: number; // number of stars (default 5)
};

export default function StarRating({
  rating,
  size = 20,
  editable = false,
  onChange,
  className = '',
  showScore = true,
  max = 5,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [focusedValue, setFocusedValue] = useState<number | null>(null);

  const displayValue = hoverValue ?? focusedValue ?? rating;

  const percent = useMemo(() => Math.max(0, Math.min(max, displayValue)) / max, [displayValue, max]);

  const stars = Array.from({ length: max }).map((_, i) => i + 1);

  const handleClick = useCallback((v: number) => {
    if (!editable) return;
    onChange?.(v);
  }, [editable, onChange]);

  const handleKey = useCallback((e: React.KeyboardEvent, value: number) => {
    if (!editable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange?.(value);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onChange?.(Math.max(0, Math.round((rating - 1) * 10) / 10));
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onChange?.(Math.min(max, Math.round((rating + 1) * 10) / 10));
    }
  }, [editable, onChange, rating, max]);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className="relative inline-block select-none"
        onMouseLeave={() => editable && setHoverValue(null)}
      >
        <div className="flex" aria-hidden>
          {stars.map((i) => (
            <svg key={`empty-${i}`} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-300">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor" />
            </svg>
          ))}
        </div>

        <div className="absolute top-0 left-0 overflow-hidden pointer-events-none" style={{ width: `${percent * 100}%` }}>
          <div className="flex">
            {stars.map((i) => (
              <svg key={`fill-${i}`} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-yellow-400">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor" />
              </svg>
            ))}
          </div>
        </div>

        <div className="absolute top-0 left-0 flex">
          {stars.map((i) => (
            <button
              key={`btn-${i}`}
              type="button"
              onMouseEnter={() => editable && setHoverValue(i)}
              onFocus={() => editable && setFocusedValue(i)}
              onBlur={() => editable && setFocusedValue(null)}
              onClick={() => handleClick(i)}
              onKeyDown={(e) => handleKey(e, i)}
              aria-label={`${i} star${i > 1 ? 's' : ''}`}
              className={`p-0 m-0 border-0 bg-transparent ${editable ? 'cursor-pointer' : 'cursor-default'}`}
              style={{ width: size, height: size, background: 'transparent', border: 'none' }}
            />
          ))}
        </div>
      </div>

      {showScore && (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {displayValue.toFixed(1)} / {max}
        </div>
      )}
    </div>
  );
}
