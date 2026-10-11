import { Role } from '@points-card/shared';
import { menuForRole } from './menu';

describe('menuForRole', () => {
  it('filters menu items by role', () => {
    const labels = (role: Role) =>
      menuForRole(role).flatMap((group) => group.items.map((item) => item.label));
    expect(labels(Role.Owner)).toHaveLength(8);
    expect(labels(Role.Manager)).toContain('Configuración');
    expect(labels(Role.Manager)).toContain('Sincronización');
    expect(labels(Role.Cashier)).not.toContain('Sincronización');
    expect(labels(Role.Cashier)).toEqual([
      'Inicio',
      'Clientes',
      'Movimientos',
      'Canjes',
      'Escáner',
    ]);
  });
});
