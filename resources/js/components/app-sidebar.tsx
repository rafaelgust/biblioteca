import { Link, usePage } from '@inertiajs/react';
import { BookCopy, LayoutGrid, Library } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

/**
 * Sidebar da aplicação.
 * Visitantes veem apenas "Livros".
 * Usuários autenticados veem "Dashboard", "Livros" e "Empréstimos".
 */
export function AppSidebar() {
    const { auth } = usePage().props;

    const navItems: NavItem[] = [
        ...(auth.user
            ? [
                  {
                      title: 'Dashboard',
                      href: dashboard(),
                      icon: LayoutGrid,
                  },
              ]
            : []),
        {
            title: 'Livros',
            href: '/books',
            icon: Library,
        },
        ...(auth.user
            ? [
                  {
                      title: 'Empréstimos',
                      href: '/loans',
                      icon: BookCopy,
                  },
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
