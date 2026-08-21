import React, { Suspense, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { routes } from './routes';
import { Navbar, Layout } from './Layout.jsx';
import LoadingSpinner from './Components/LoadingSpinner';

function App() {
  const layoutRoutes = useMemo(() =>
    routes.map(({ path, element, layout, navbar }) => (
      <Route
        key={path}
        path={path}
        element={
          <>
            {navbar ? <Navbar /> : null}
            {layout ? <Layout>{element}</Layout> : element}
          </>
        }
      />
    )),
    []);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>{layoutRoutes}</Routes>
    </Suspense>
  );
}

export default App;
