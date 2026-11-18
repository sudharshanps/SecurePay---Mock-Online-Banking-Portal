import React from 'react';

export const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'blue',
  badge,
}) => {
  const variantStyles = {
    blue: {
      border: 'border-blue-100',
      iconBg: 'bg-blue-50 text-blue-600',
      accent: 'text-blue-900',
    },
    teal: {
      border: 'border-teal-100',
      iconBg: 'bg-teal-50 text-teal-600',
      accent: 'text-teal-900',
    },
    emerald: {
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-50 text-emerald-600',
      accent: 'text-emerald-900',
    },
    rose: {
      border: 'border-rose-100',
      iconBg: 'bg-rose-50 text-rose-600',
      accent: 'text-rose-900',
    },
  };

  const style = variantStyles[variant] || variantStyles.blue;

  return (
    <div className={`bg-white rounded-xl p-5 border ${style.border} shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </span>
          {badge && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {badge}
            </span>
          )}
        </div>
        {subtext && (
          <p className="mt-1.5 text-xs text-slate-500 font-medium">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
