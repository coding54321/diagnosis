import React from 'react';

export interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-hyundai-gray-200 rounded-lg ${className}`}
    />
  );
}
