'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
	const t = useTranslations('auth');
	const common = useTranslations('common');
	const router = useRouter();

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);

	function validate(): boolean {
		if (password.length < 8) {
			setError(t('weakPassword'));
			return false;
		}
		if (password !== confirmPassword) {
			setError(t('passwordMismatch'));
			return false;
		}
		return true;
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError('');

		if (!validate()) return;

		setLoading(true);

		try {
			const supabase = createClient();
			const { error: authError } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						full_name: name,
					},
				},
			});

			if (authError) {
				setError(authError.message);
				return;
			}

			// Check if email confirmation is required
			const { data: { session } } = await supabase.auth.getSession();
			if (session) {
				router.push('/dashboard');
			} else {
				setSuccess(true);
			}
		} catch {
			setError(common('error'));
		} finally {
			setLoading(false);
		}
	}

	async function handleGoogleLogin() {
		const supabase = createClient();
		await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${window.location.origin}/en/dashboard`,
			},
		});
	}

	return (
		<div className="flex min-h-screen items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<Link href="/" className="mb-4 text-xl font-bold">
						{common('appName')}
					</Link>
					<CardTitle>{t('registerTitle')}</CardTitle>
					<CardDescription>{t('registerSubtitle')}</CardDescription>
				</CardHeader>
				<CardContent>
					{success ? (
						<div className="rounded-md bg-green-500/10 p-4 text-center text-sm text-green-600">
							Check your email for a confirmation link to complete registration.
						</div>
					) : (
						<>
							<form onSubmit={handleSubmit} className="space-y-4">
								{error && (
									<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
										{error}
									</div>
								)}
								<div className="space-y-2">
									<label htmlFor="name" className="text-sm font-medium">
										{t('name')}
									</label>
									<Input
										id="name"
										type="text"
										value={name}
										onChange={(e) => setName(e.target.value)}
										required
										autoComplete="name"
									/>
								</div>
								<div className="space-y-2">
									<label htmlFor="email" className="text-sm font-medium">
										{t('email')}
									</label>
									<Input
										id="email"
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder="you@example.com"
										required
										autoComplete="email"
									/>
								</div>
								<div className="space-y-2">
									<label htmlFor="password" className="text-sm font-medium">
										{t('password')}
									</label>
									<Input
										id="password"
										type="password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										autoComplete="new-password"
									/>
								</div>
								<div className="space-y-2">
									<label htmlFor="confirmPassword" className="text-sm font-medium">
										{t('confirmPassword')}
									</label>
									<Input
										id="confirmPassword"
										type="password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										required
										autoComplete="new-password"
									/>
								</div>
								<Button type="submit" className="w-full" disabled={loading}>
									{loading && <Loader2 className="h-4 w-4 animate-spin" />}
									{t('registerButton')}
								</Button>
							</form>

							<div className="relative my-6">
								<div className="absolute inset-0 flex items-center">
									<span className="w-full border-t border-border" />
								</div>
								<div className="relative flex justify-center text-xs uppercase">
									<span className="bg-card px-2 text-muted-foreground">
										{t('orContinueWith')}
									</span>
								</div>
							</div>

							<Button
								variant="outline"
								className="w-full"
								onClick={handleGoogleLogin}
								type="button"
							>
								<svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
									<path
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
										fill="#4285F4"
									/>
									<path
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
										fill="#34A853"
									/>
									<path
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
										fill="#FBBC05"
									/>
									<path
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
										fill="#EA4335"
									/>
								</svg>
								{t('google')}
							</Button>
						</>
					)}
				</CardContent>
				<CardFooter className="justify-center">
					<p className="text-sm text-muted-foreground">
						{t('hasAccount')}{' '}
						<Link href="/login" className="font-medium text-primary hover:underline">
							{common('login')}
						</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	);
}
