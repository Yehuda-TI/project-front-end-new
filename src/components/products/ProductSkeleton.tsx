import React from 'react';

export const ProductSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-square w-full bg-slate-200"></div>
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-3 w-20 bg-slate-200 rounded"></div>
          <div className="h-3 w-12 bg-slate-200 rounded"></div>
        </div>
        <div className="h-4 w-full bg-slate-200 rounded"></div>
        <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
        <div className="pt-2 border-t border-slate-100 flex justify-between">
          <div className="h-5 w-24 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};
