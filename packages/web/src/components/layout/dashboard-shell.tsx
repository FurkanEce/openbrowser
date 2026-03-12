'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

interface DashboardShellProps {
	userEmail: string;
	children: React.ReactNode;
}

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-900">
			<Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
			<div className="flex flex-1 flex-col overflow-hidden">
				<Topbar
					userEmail={userEmail}
					onMenuToggle={() => setSidebarOpen((prev) => !prev)}
				/>
				<main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
					{children}
				</main>
			</div>
		</div>
	);
}
