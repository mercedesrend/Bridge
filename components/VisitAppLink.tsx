import { VISIT_APP_URL } from "@/lib/visitApp";

export function VisitAppLink({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a href={VISIT_APP_URL} className={className}>
      {children}
    </a>
  );
}
