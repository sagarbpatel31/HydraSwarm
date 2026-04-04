import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function SectionCard({ title, subtitle, children, className, actions }: SectionCardProps) {
  return (
    <section className={cn("rounded-3xl border border-slate-200 bg-white p-6 shadow-soft", className)}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
