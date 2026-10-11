import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { WalletCard } from './wallet.types';

export class CardsRepository {
  private readonly filePath = join(process.cwd(), 'data', 'cards.json');

  async findAll(): Promise<WalletCard[]> {
    try {
      return JSON.parse(await readFile(this.filePath, 'utf8')) as WalletCard[];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }

  async save(card: WalletCard): Promise<void> {
    const cards = await this.findAll();
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify([...cards.filter(({ cardId }) => cardId !== card.cardId), card], null, 2));
  }
}
