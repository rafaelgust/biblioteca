import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <AppLogoIcon className="size-5" />
                            </div>
                            <span className="text-lg font-bold">
                                Biblioteca
                            </span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                    <div className="text-center">
                        <Link href={home()}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground"
                            >
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Voltar à página inicial
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
