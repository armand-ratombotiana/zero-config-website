import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

const routeNames: Record<string, string> = {
  '/': 'Dashboard',
  '/services': 'Services',
  '/cloud': 'Cloud Emulators',
  '/monitoring': 'Monitoring',
  '/logs': 'Logs',
  '/config': 'Configuration',
  '/settings': 'Settings',
};

interface BreadcrumbsProps {
  projectName?: string;
  customItems?: BreadcrumbItem[];
}

export function Breadcrumbs({ projectName, customItems }: BreadcrumbsProps) {
  const location = useLocation();
  const currentRouteName = routeNames[location.pathname] || 'Page';

  const items: BreadcrumbItem[] = customItems || [
    { label: 'Home', path: '/', icon: <Home className="h-3.5 w-3.5" /> },
    ...(projectName ? [{ label: projectName }] : []),
    ...(location.pathname !== '/' ? [{ label: currentRouteName }] : []),
  ];

  if (items.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-1.5 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <li key={index} className="flex items-center">
              {!isFirst && (
                <ChevronRight className="h-3.5 w-3.5 text-muted mx-1.5" aria-hidden="true" />
              )}

              {item.path && !isLast ? (
                <Link
                  to={item.path}
                  className="flex items-center gap-1 text-muted hover:text-white transition-colors"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={`flex items-center gap-1 ${
                    isLast ? 'text-white font-medium' : 'text-muted'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
