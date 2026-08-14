import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend: string;
  trendValue: string;
  trendUp: boolean;
}

export function StatCard({ title, value, icon: Icon, trend, trendValue, trendUp }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="rounded-full bg-gray-50 p-2 border border-gray-100">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-x-2">
        <span className="text-3xl font-bold tracking-tight text-gray-900">{value}</span>
      </div>
      <div className="mt-4 flex items-center text-sm">
        <span className={trendUp ? "text-emerald-600 font-medium flex items-center gap-1" : "text-red-600 font-medium flex items-center gap-1"}>
          {trendUp ? (
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
            </svg>
          )}
          {trendValue}
        </span>
        <span className="ml-2 text-gray-500">{trend}</span>
      </div>
    </div>
  );
}
