import { useState } from 'react';
import styles from './BookCard.module.css';

export function BookCover({ title, coverUrl }: { title: string; coverUrl: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const source = coverUrl && coverUrl !== failedUrl ? coverUrl : '/cover-fallback.svg';
  return <img className={styles.cover} src={source} alt={`Cover of ${title}`} loading="lazy"
    onError={source === '/cover-fallback.svg' ? undefined : () => setFailedUrl(coverUrl)} />;
}
