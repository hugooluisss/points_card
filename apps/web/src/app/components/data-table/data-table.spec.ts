import { TestBed } from '@angular/core/testing';
import { DataTable, DataTableColumn } from './data-table';

interface Customer { name: string; visits: number; }

describe('DataTable', () => {
  it('renders generic column headers and row values', async () => {
    await TestBed.configureTestingModule({ imports: [DataTable] }).compileComponents();
    const fixture = TestBed.createComponent(DataTable<Customer>);
    fixture.componentRef.setInput('columns', [{ key: 'name', label: 'Nombre' }, { key: 'visits', label: 'Visitas' }] satisfies DataTableColumn<Customer>[]);
    fixture.componentRef.setInput('rows', [{ name: 'Ana Pérez', visits: 8 }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ana Pérez');
    expect(fixture.nativeElement.textContent).toContain('Visitas');
  });
});
