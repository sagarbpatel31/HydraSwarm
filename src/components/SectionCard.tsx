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
    <section className={cn(
      "rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-5 shadow-soft",
      className
    )}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p> : null}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
