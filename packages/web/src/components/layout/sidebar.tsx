'use client';

import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
	BarChart3,
	LayoutDashboard,
	Monitor,
	Play,
	Plug,
	Settings,
	X,
} from 'lucide-react';

interface SidebarProps {
	open: boolean;
	onClose: () => void;
}

const navItems = [
	{ key: 'overview', href: '/dashboard', icon: LayoutDashboard, exact: true },
	{ key: 'runs', href: '/dashboard/runs', icon: Play, exact: false },
	{ key: 'sessions', href: '/dashboard/sessions', icon: Monitor, exact: false },
	{ key: 'integrations', href: '/dashboard/integrations', icon: Plug, exact: false },
	{ key: 'usage', href: '/dashboard/usage', icon: BarChart3, exact: false },
	{ key: 'settings', href: '/dashboard/settings', icon: Settings, exact: false },
] as const;

export function Sidebar({ open, onClose }: SidebarProps) {
	const t = useTranslations('dashboard.nav');
	const tCommon = useTranslations('common');
	const pathname = usePathname();

	function isActive(href: string, exact: boolean) {
		if (exact) {
			return pathname === href;
		}
		return pathname.startsWith(href);
	}

	return (
		<>
			{/* Mobile backdrop */}
			{open && (
				<div
					className="fixed inset-0 z-40 bg-black/50 lg:hidden"
					onClick={onClose}
					onKeyDown={(e) => {
						if (e.key === 'Escape') onClose();
					}}
					role="button"
					tabIndex={-1}
					aria-label="Close sidebar"
				/>
			)}

			{/* Sidebar */}
			<aside
				className={cn(
					'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 dark:border-zinc-800 dark:bg-zinc-950 lg:static lg:translate-x-0',
					open ? 'translate-x-0' : '-translate-x-full',
				)}
			>
				{/* Logo */}
				<div className="flex h-16 items-center justify-between border-b border-zinc-200 px-6 dark:border-zinc-800">
					<Link
						href="/dashboard"
						className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white"
					>
						{tCommon('appName')}
					</Link>
					<button
						type="button"
						className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 lg:hidden dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
						onClick={onClose}
						aria-label="Close sidebar"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Navigation */}
				<nav className="flex-1 space-y-1 px-3 py-4" aria-label="Dashboard navigation">
					{navItems.map((item) => {
						const active = isActive(item.href, item.exact);
						const Icon = item.icon;

						return (
							<Link
								key={item.key}
								href={item.href}
								onClick={onClose}
								className={cn(
									'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
									active
										? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white'
										: 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-white',
								)}
								aria-current={active ? 'page' : undefined}
							>
								<Icon className="h-5 w-5 shrink-0" />
								{t(item.key)}
							</Link>
						);
					})}
				</nav>

				{/* Footer */}
				<div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
					<p className="text-xs text-zinc-500 dark:text-zinc-400">
						{tCommon('appName')} v1.0
					</p>
				</div>
			</aside>
		</>
	);
}
