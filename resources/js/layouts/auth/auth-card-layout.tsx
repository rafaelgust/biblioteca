import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-md flex-col gap-6">
                <Link
                    href={home()}
                    className="flex flex-col items-center gap-2 self-center font-medium"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <AppLogoIcon className="size-5" />
                    </div>
                    <span className="text-lg font-bold">Biblioteca</span>
                </Link>

                <div className="flex flex-col gap-6">
                    <Card className="rounded-xl">
                        <CardHeader className="px-10 pt-8 pb-0 text-center">
                            <CardTitle className="text-xl">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 py-8">
                            {children}
                        </CardContent>
                    </Card>
                </div>

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
    );
}
