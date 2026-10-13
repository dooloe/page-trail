export const readingStatuses = ['wantToRead', 'currentlyReading', 'finished'] as const;
export type ReadingStatus = (typeof readingStatuses)[number];

export interface DiscoveryBook {
  source: 'openLibrary';
  sourceWorkId: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  totalPages: number | null;
}

export interface Book extends DiscoveryBook {
  id: string;
  currentPage: number;
  status: ReadingStatus;
  rating: number | null;
  note: string;
  createdAt: number;
  updatedAt: number;
}

export function createBook(metadata: DiscoveryBook): Book {
  const now = Date.now();
  return {
    ...metadata,
    authors: [...metadata.authors],
    id: crypto.randomUUID(),
    status: 'wantToRead',
    currentPage: 0,
    rating: null,
    note: '',
    createdAt: now,
    updatedAt: now,
  };
}
