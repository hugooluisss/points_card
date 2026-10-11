import { Role } from '@points-card/shared';
import { SidebarGroup } from '../components/app-sidebar/app-sidebar';

const groups: SidebarGroup[] = [
  {
    label: 'General',
    items: [{ label: 'Inicio', icon: '⌂', href: '/' }],
  },
  {
    label: 'Operación',
    items: [
      { label: 'Clientes', icon: '♧', href: '/clientes' },
      { label: 'Movimientos', icon: '⇄', href: '/movimientos' },
      { label: 'Canjes', icon: '✧', href: '/canjes' },
      { label: 'Escáner', icon: '▦', href: '/escaner' },
    ],
  },
  {
    label: 'Lealtad',
    items: [{ label: 'Programas', icon: '☆', href: '/programas' }],
  },
  {
    label: 'Administración',
    items: [
      { label: 'Sincronización', icon: '⟳', href: '/sincronizacion' },
      { label: 'Configuración', icon: '⚙', href: '/configuracion' },
    ],
  },
];

export function menuForRole(role: Role): SidebarGroup[] {
  const allowed: Record<Role, string[]> = {
    [Role.Owner]: [
      'Inicio',
      'Clientes',
      'Movimientos',
      'Canjes',
      'Escáner',
      'Programas',
      'Sincronización',
      'Configuración',
    ],
    [Role.Manager]: [
      'Inicio',
      'Clientes',
      'Movimientos',
      'Canjes',
      'Escáner',
      'Programas',
      'Sincronización',
      'Configuración',
    ],
    [Role.Cashier]: ['Inicio', 'Clientes', 'Movimientos', 'Canjes', 'Escáner'],
  };

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowed[role].includes(item.label)),
    }))
    .filter((group) => group.items.length > 0);
}

export function rolesForMenuItem(label: string): Role[] {
  return Object.values(Role).filter((role) =>
    menuForRole(role).some((group) => group.items.some((item) => item.label === label)),
  );
}
