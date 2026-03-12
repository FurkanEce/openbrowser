'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const localeLabels: Record<string, string> = {
	en: 'EN',
	tr: 'TR',
};

export function LocaleSwitcher() {
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();

	const nextLocale = locale === 'en' ? 'tr' : 'en';

	function handleSwitch() {
		router.replace(pathname, { locale: nextLocale });
	}

	return (
		<Button variant="ghost" size="sm" onClick={handleSwitch} aria-label="Switch language">
			<Globe className="h-4 w-4" />
			<span>{localeLabels[locale]}</span>
		</Button>
	);
}
