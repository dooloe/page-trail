import { useEffect, useRef } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router';
import { LibraryDatabase } from '../data/database';
import { LibraryRepository } from '../data/libraryRepository';
import { useBook, useBooks } from '../data/useLibrary';
import { Dashboard } from '../pages/Dashboard';
import { Library } from '../pages/Library';
import { Discover } from '../pages/Discover';
import { BookDetails } from '../pages/BookDetails';
import styles from './ApplicationRoutes.module.css';

const repository = new LibraryRepository(new LibraryDatabase());

function DetailRoute() {
  const { bookId = '' } = useParams();
  const navigate = useNavigate();
  const state = useBook(repository, bookId);
  return <BookDetails state={state} save={(id, changes) => repository.update(id, changes)}
    remove={id => repository.delete(id)} onRemoved={() => navigate('/library')} />;
}

function Shell() {
  const location = useLocation();
  const lastPath = useRef(location.pathname);
  const library = useBooks(repository);
  useEffect(() => {
    if (lastPath.current === location.pathname) return;
    lastPath.current = location.pathname;
    document.getElementById('page-content')?.focus();
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return <>
    <a className={styles.skip} href="#page-content">Skip to content</a>
    <header className={styles.header}><p className={styles.brand}>PageTrail</p>
      <p>Your bookshelf, your progress, your thoughts.</p>
      <nav aria-label="Main navigation"><NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/library">My Library</NavLink><NavLink to="/discover">Discover Books</NavLink></nav>
    </header>
    <main id="page-content" tabIndex={-1}><Routes>
      <Route path="/" element={<Dashboard state={library} />} />
      <Route path="/library" element={<Library state={library} remove={id => repository.delete(id)} />} />
      <Route path="/discover" element={<Discover library={library} add={book => repository.add(book)} />} />
      <Route path="/books/:bookId" element={<DetailRoute />} />
      <Route path="*" element={<section><h1>Page not found</h1><p>Let's get you back to your bookshelf.</p><a href="/library">Return to My Library</a></section>} />
    </Routes></main>
  </>;
}

export function ApplicationRoutes() { return <BrowserRouter><Shell /></BrowserRouter>; }
