import { Library } from 'lucide-react';
import type { ComponentProps } from 'react';

export default function AppLogoIcon(props: ComponentProps<typeof Library>) {
    return <Library {...props} />;
}
