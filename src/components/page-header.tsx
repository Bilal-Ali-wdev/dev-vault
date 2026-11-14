import { Icon, type IconName } from "./icons";

/** 56px white top bar used by top-level app pages. */
export function TopBar({ icon, title, children }: { icon?: IconName; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="flex min-h-14 flex-wrap items-center gap-3 border-b border-line bg-white px-6 py-2.5 max-sm:px-4">
      <div className="flex min-w-[160px] flex-1 items-center gap-2 text-sm">
        {icon && <Icon name={icon} className="text-muted" />}
        {title}
      </div>
      {children}
    </header>
  );
}

export function EmptyState({ icon, title, children, action }: { icon: IconName; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-[#CBD2DA] bg-white px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand">
        <Icon name={icon} size={20} />
      </span>
      <h2 className="m-0 text-[15px] font-semibold">{title}</h2>
      {children && <p className="m-0 max-w-md text-[13px] leading-normal text-muted">{children}</p>}
      {action}
    </div>
  );
}
