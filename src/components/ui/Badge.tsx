import React from 'react';
import { ProductCondition, ProductStatus } from '@/types';

export const ConditionBadge: React.FC<{ condition: ProductCondition }> = ({ condition }) => {
  return condition === 'new' ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
      Baru
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
      Bekas (Preloved)
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ProductStatus }> = ({ status }) => {
  return status === 'available' ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
      Tersedia
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
      Terjual
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
      {category}
    </span>
  );
};
