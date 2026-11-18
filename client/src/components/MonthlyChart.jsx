import React, { useState } from 'react';

export const MonthlyChart = ({ data = [] }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex items-center justify-center h-64 text-slate-400 text-sm">
        No monthly transaction data available yet.
      </div>
    );
  }

  // Find max value to scale chart bars nicely
  const maxVal = Math.max(
    ...data.flatMap((d) => [d.credits || 0, d.debits || 0]),
    1000
  );

  const chartHeight = 160;

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">Income & Expense Overview</h3>
          <p className="text-xs text-slate-500">6-Month Credits vs Debits (in ₹)</p>
        </div>
        <div className="flex items-center space-x-4 text-xs font-medium">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-xs bg-teal-500 inline-block"></span>
            <span className="text-slate-600">Credits (Income)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-xs bg-blue-600 inline-block"></span>
            <span className="text-slate-600">Debits (Transfers)</span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="pt-6 pb-2">
        <div className="h-44 flex items-end justify-between gap-3 px-2 sm:px-6 relative">
          {/* Horizontal background guideline */}
          <div className="absolute inset-x-0 top-0 border-b border-dashed border-slate-200"></div>
          <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-200"></div>

          {data.map((item, index) => {
            const creditHeight = Math.max(4, Math.round(((item.credits || 0) / maxVal) * chartHeight));
            const debitHeight = Math.max(4, Math.round(((item.debits || 0) / maxVal) * chartHeight));

            return (
              <div
                key={`${item.year}-${item.month}`}
                className="flex-1 flex flex-col items-center group relative h-full justify-end cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip on Hover */}
                {hoveredIndex === index && (
                  <div className="absolute -top-14 z-20 bg-navy-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap pointer-events-none">
                    <div className="font-semibold">{item.month} {item.year}</div>
                    <div className="text-teal-400">Credits: ₹{Number(item.credits || 0).toLocaleString('en-IN')}</div>
                    <div className="text-blue-300">Debits: ₹{Number(item.debits || 0).toLocaleString('en-IN')}</div>
                  </div>
                )}

                {/* Bars Group */}
                <div className="flex items-end space-x-1 sm:space-x-1.5 w-full justify-center">
                  {/* Credit Bar */}
                  <div
                    style={{ height: `${creditHeight}px` }}
                    className="w-3.5 sm:w-5 bg-teal-500 rounded-t-xs hover:bg-teal-600 transition-all duration-150"
                    title={`Credits: ₹${item.credits}`}
                  />
                  {/* Debit Bar */}
                  <div
                    style={{ height: `${debitHeight}px` }}
                    className="w-3.5 sm:w-5 bg-blue-600 rounded-t-xs hover:bg-blue-700 transition-all duration-150"
                    title={`Debits: ₹${item.debits}`}
                  />
                </div>

                {/* Month label */}
                <span className="text-[11px] font-semibold text-slate-500 mt-2">
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MonthlyChart;
