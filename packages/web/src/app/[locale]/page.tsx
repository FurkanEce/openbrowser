import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import {
	Bot,
	Layers,
	Shield,
	Activity,
	Database,
	DollarSign,
	ArrowRight,
} from 'lucide-react';

const featureIcons = {
	autonomous: Bot,
	multiModel: Layers,
	secure: Shield,
	realtime: Activity,
	extraction: Database,
	costTracking: DollarSign,
} as const;

const featureKeys = [
	'autonomous',
	'multiModel',
	'secure',
	'realtime',
	'extraction',
	'costTracking',
] as const;

export default function LandingPage() {
	const t = useTranslations('landing');
	const common = useTranslations('common');

	return (
		<div className="min-h-screen flex flex-col">
			{/* Navigation */}
			<header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
					<Link href="/" className="text-xl font-bold">
						{common('appName')}
					</Link>

					<div className="hidden items-center gap-6 md:flex">
						<Link
							href="/pricing"
							className="text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							Pricing
						</Link>
					</div>

					<div className="flex items-center gap-2">
						<LocaleSwitcher />
						<Link href="/login">
							<Button variant="ghost" size="sm">
								{common('login')}
							</Button>
						</Link>
						<Link href="/register">
							<Button size="sm">{common('register')}</Button>
						</Link>
					</div>
				</nav>
			</header>

			<main className="flex-1">
				{/* Hero Section */}
				<section className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
					<h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
						{t('hero.title')}
					</h1>
					<p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
						{t('hero.subtitle')}
					</p>
					<div className="mt-10 flex items-center justify-center gap-4">
						<Link href="/register">
							<Button size="lg">
								{t('hero.cta')}
								<ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
						<Button variant="outline" size="lg">
							{t('hero.secondaryCta')}
						</Button>
					</div>
				</section>

				{/* Features Section */}
				<section className="border-t border-border bg-muted/50 py-24">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
							{t('features.title')}
						</h2>
						<div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{featureKeys.map((key) => {
								const Icon = featureIcons[key];
								return (
									<Card key={key} className="bg-card">
										<CardHeader>
											<div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
												<Icon className="h-5 w-5 text-primary" />
											</div>
											<CardTitle className="text-lg">
												{t(`features.${key}.title`)}
											</CardTitle>
											<CardDescription>
												{t(`features.${key}.description`)}
											</CardDescription>
										</CardHeader>
									</Card>
								);
							})}
						</div>
					</div>
				</section>

				{/* CTA Section */}
				<section className="py-24">
					<div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
							{t('cta.title')}
						</h2>
						<p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
							{t('cta.subtitle')}
						</p>
						<div className="mt-8">
							<Link href="/register">
								<Button size="lg">
									{t('cta.button')}
									<ArrowRight className="h-4 w-4" />
								</Button>
							</Link>
						</div>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="border-t border-border py-12">
				<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
					<p className="text-sm text-muted-foreground">
						&copy; {new Date().getFullYear()} {common('appName')}. All rights reserved.
					</p>
					<div className="flex gap-6">
						<Link
							href="/pricing"
							className="text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							Pricing
						</Link>
						<Link
							href="/login"
							className="text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							{common('login')}
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
