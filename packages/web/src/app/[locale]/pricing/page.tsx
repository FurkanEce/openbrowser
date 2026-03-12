import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LocaleSwitcher } from '@/components/layout/locale-switcher';
import { Check } from 'lucide-react';

const tiers = ['free', 'pro', 'enterprise'] as const;

export default function PricingPage() {
	const t = useTranslations('pricing');
	const common = useTranslations('common');

	return (
		<div className="min-h-screen flex flex-col">
			{/* Navigation */}
			<header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
					<Link href="/" className="text-xl font-bold">
						{common('appName')}
					</Link>
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

			<main className="flex-1 py-24">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
							{t('title')}
						</h1>
						<p className="mt-4 text-lg text-muted-foreground">{t('subtitle')}</p>
					</div>

					<div className="mt-16 grid gap-8 lg:grid-cols-3">
						{tiers.map((tier) => {
							const isPro = tier === 'pro';
							const features = t.raw(`${tier}.features`) as string[];

							return (
								<Card
									key={tier}
									className={
										isPro
											? 'relative border-primary shadow-lg scale-[1.02]'
											: ''
									}
								>
									{isPro && (
										<div className="absolute -top-3 left-1/2 -translate-x-1/2">
											<Badge>Most Popular</Badge>
										</div>
									)}
									<CardHeader>
										<CardTitle>{t(`${tier}.name`)}</CardTitle>
										<CardDescription>
											{t(`${tier}.description`)}
										</CardDescription>
										<div className="mt-4">
											<span className="text-4xl font-bold">
												{t(`${tier}.price`)}
											</span>
											{tier === 'pro' && (
												<span className="text-muted-foreground">
													{t('pro.period')}
												</span>
											)}
										</div>
									</CardHeader>
									<CardContent>
										<ul className="space-y-3" role="list">
											{features.map((feature: string) => (
												<li
													key={feature}
													className="flex items-center gap-2 text-sm"
												>
													<Check className="h-4 w-4 text-primary" />
													{feature}
												</li>
											))}
										</ul>
									</CardContent>
									<CardFooter>
										<Link href="/register" className="w-full">
											<Button
												className="w-full"
												variant={isPro ? 'default' : 'outline'}
											>
												{t(`${tier}.cta`)}
											</Button>
										</Link>
									</CardFooter>
								</Card>
							);
						})}
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t border-border py-12">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
					<p className="text-sm text-muted-foreground">
						&copy; {new Date().getFullYear()} {common('appName')}. All rights reserved.
					</p>
					<Link
						href="/"
						className="text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						{common('back')}
					</Link>
				</div>
			</footer>
		</div>
	);
}
