import { navigateTo } from "../../lib/router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

function Breadcrumbs({ items = [], className = "" }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className="flex-nowrap gap-1.5 text-xs font-semibold text-ink-700 sm:gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <BreadcrumbItem key={`${item.label}-${index}`} className="gap-1.5">
              {item.to && !isLast ? (
                <BreadcrumbLink
                  render={<button type="button" onClick={() => navigateTo(item.to)} />}
                  className="text-xs font-semibold text-ink-700 hover:text-strong"
                >
                  {item.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="text-xs font-semibold text-ink-700">{item.label}</BreadcrumbPage>
              )}
              {!isLast ? <BreadcrumbSeparator className="text-ink-500">/</BreadcrumbSeparator> : null}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default Breadcrumbs;
