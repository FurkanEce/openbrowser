'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { LogOut, Menu, User } from 'lucide-react';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';

interface TopbarProps {
	userEmail: string;
	onMenuToggle: () => void;
}

export function Topbar({ userEmail, onMenuToggle }: TopbarProps) {
	const t = useTranslations('common');
	const router = useRouter();

	async function handleLogout() {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push('/');
		router.refresh();
	}

	return (
		<header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-sm sm:px-6 dark:border-zinc-800 dark:bg-zinc-950/80">
			{/* Mobile menu toggle */}
			<button
				type="button"
				className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 lg:hidden dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
				onClick={onMenuToggle}
				aria-label="Toggle sidebar"
			>
				<Menu className="h-5 w-5" />
			</button>

			{/* Spacer */}
			<div className="flex-1" />

			{/* Right side actions */}
			<div className="flex items-center gap-3">
				<LocaleSwitcher />

				{/* User info */}
				<div className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 dark:border-zinc-700">
					<User className="h-4 w-4 text-zinc-500" />
					<span className="hidden max-w-[160px] truncate text-sm text-zinc-700 sm:inline dark:text-zinc-300">
						{userEmail}
					</span>
				</div>

				{/* Logout */}
				<button
					type="button"
					onClick={handleLogout}
					className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
					aria-label={t('logout')}
				>
					<LogOut className="h-4 w-4" />
					<span className="hidden sm:inline">{t('logout')}</span>
				</button>
			</div>
		</header>
	);
}
