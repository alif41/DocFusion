import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[#191924]/70 ${className}`}
    />
  );
};

export const ToolCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl border border-[#1d1d2b] bg-[#0c0c12] p-5 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-20 h-5 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-3/4 h-5" />
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-5/6 h-3" />
      </div>
      <div className="pt-3 border-t border-[#181824] flex items-center justify-between">
        <Skeleton className="w-16 h-4" />
        <Skeleton className="w-6 h-6 rounded-md" />
      </div>
    </div>
  );
};

export const DocumentRowSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#1b1b26] bg-[#0e0e15]">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="w-36 h-4" />
          <Skeleton className="w-20 h-3" />
        </div>
      </div>
      <Skeleton className="w-24 h-6 rounded-lg" />
    </div>
  );
};
