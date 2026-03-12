'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Loader2, Check } from 'lucide-react';

export default function SettingsPage() {
	const t = useTranslations('settings');
	const tCommon = useTranslations('common');
	const router = useRouter();
	const pathname = usePathname();

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [avatarUrl, setAvatarUrl] = useState('');
	const [language, setLanguage] = useState<'en' | 'tr'>('en');
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadProfile = async () => {
			const supabase = createClient();
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				setEmail(user.email ?? '');
				setName(user.user_metadata?.full_name ?? user.user_metadata?.name ?? '');
				setAvatarUrl(user.user_metadata?.avatar_url ?? '');
			}
			setLoading(false);
		};
		loadProfile();
	}, []);

	// Detect current locale from path
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const pathLocale = window.location.pathname.split('/')[1];
			if (pathLocale === 'tr' || pathLocale === 'en') {
				setLanguage(pathLocale);
			}
		}
	}, []);

	const handleLanguageChange = (newLocale: 'en' | 'tr') => {
		setLanguage(newLocale);
		router.replace(pathname, { locale: newLocale });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setSaved(false);

		try {
			const supabase = createClient();
			await supabase.auth.updateUser({
				data: {
					full_name: name,
					avatar_url: avatarUrl,
				},
			});
			setSaved(true);
			setTimeout(() => setSaved(false), 3000);
		} catch {
			// Error handled silently
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>

			<form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
				{/* Profile Section */}
				<div className="space-y-4">
					<h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
						<User className="h-5 w-5" />
						{t('profile')}
					</h2>

					{saved && (
						<div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
							<Check className="h-4 w-4" />
							{t('profileUpdated')}
						</div>
					)}

					{/* Avatar */}
					{avatarUrl && (
						<div className="flex items-center gap-4">
							<img
								src={avatarUrl}
								alt="Avatar"
								className="h-16 w-16 rounded-full object-cover"
							/>
						</div>
					)}

					{/* Name */}
					<div className="space-y-2">
						<label htmlFor="name" className="block text-sm font-medium text-gray-700">
							{tCommon('save') === 'Save' ? 'Name' : 'Ad'}
						</label>
						<input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>

					{/* Email (readonly) */}
					<div className="space-y-2">
						<label htmlFor="email" className="block text-sm font-medium text-gray-700">
							Email
						</label>
						<input
							id="email"
							type="email"
							value={email}
							readOnly
							className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
						/>
					</div>
				</div>

				{/* Language Section */}
				<div className="space-y-3 border-t border-gray-200 pt-4">
					<h2 className="text-lg font-semibold text-gray-900">{t('language')}</h2>
					<select
						value={language}
						onChange={(e) => handleLanguageChange(e.target.value as 'en' | 'tr')}
						className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					>
						<option value="en">English</option>
						<option value="tr">Turkish</option>
					</select>
				</div>

				{/* Submit */}
				<button
					type="submit"
					disabled={saving}
					className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
				>
					{saving && <Loader2 className="h-4 w-4 animate-spin" />}
					{t('updateProfile')}
				</button>
			</form>
		</div>
	);
}
