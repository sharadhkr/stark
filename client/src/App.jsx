// App.jsx
import React, { Suspense, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { routes } from './routes';
import { Layout } from './Layout.jsx';
import { Navbar } from './Navbar.jsx';
import LoadingSpinner from './Components/LoadingSpinner';

// Wrap all routed elements under a single layout shell
function App() {
  const layoutRoutes = useMemo(() =>
    routes.map(({ path, element, layout, navbar }) => (
      <Route
        key={path}
        path={path}
        element={
          <>
            {navbar ? <Navbar></Navbar>: null}
            {layout ? <Layout>{element}</Layout> : element}
          </>
        }
      />
    )),
  [routes]);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>{layoutRoutes}</Routes>
    </Suspense>
  );
}

export default App;
