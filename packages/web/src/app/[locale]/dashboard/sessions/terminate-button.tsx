'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Loader2, Square } from 'lucide-react';

interface TerminateSessionButtonProps {
	sessionId: string;
	label: string;
}

export function TerminateSessionButton({ sessionId, label }: TerminateSessionButtonProps) {
	const router = useRouter();
	const [terminating, setTerminating] = useState(false);

	const handleTerminate = async () => {
		setTerminating(true);
		try {
			await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
			router.refresh();
		} catch {
			setTerminating(false);
		}
	};

	return (
		<button
			type="button"
			onClick={handleTerminate}
			disabled={terminating}
			className="inline-flex items-center gap-1 rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50"
		>
			{terminating ? (
				<Loader2 className="h-3 w-3 animate-spin" />
			) : (
				<Square className="h-3 w-3" />
			)}
			{label}
		</button>
	);
}
