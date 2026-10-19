/**
 * Route table. Every page is lazy-loaded so the first paint only ships the shell
 * plus the Generate page; Library, Learn, Review and Settings download on demand
 * (and are precached by the service worker for offline use).
 */
import { lazy } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui';

const Generate = lazy(() => import('@/pages/Generate'));
const Library = lazy(() => import('@/pages/Library'));
const Learn = lazy(() => import('@/pages/Learn'));
const Review = lazy(() => import('@/pages/Review'));
const Settings = lazy(() => import('@/pages/Settings'));

function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-md space-y-3 p-8 text-center">
      <h1 className="text-lg font-semibold">Page not found</h1>
      <p className="text-sm text-muted">That address doesn't exist in PromptForge.</p>
      <Link to="/">
        <Button variant="primary">Go to Generate</Button>
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Generate />} />
        <Route path="library" element={<Library />} />
        <Route path="learn" element={<Learn />} />
        <Route path="review" element={<Review />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
