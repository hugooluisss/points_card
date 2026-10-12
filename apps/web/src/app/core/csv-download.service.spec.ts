import { TestBed } from '@angular/core/testing';
import { CsvDownloadService } from './csv-download.service';

describe('CsvDownloadService', () => {
  it('creates and clicks a download link', async () => {
    const click = vi.fn();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(document, 'createElement').mockReturnValue({
      set href(_value: string) {},
      set download(_value: string) {},
      click,
    } as unknown as HTMLAnchorElement);
    TestBed.configureTestingModule({});
    TestBed.inject(CsvDownloadService).save(new Blob(['a,b']), 'test.csv');
    expect(click).toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });
});
