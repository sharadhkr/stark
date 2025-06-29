// ✅ src/App.jsx
import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { routes } from './routes';
import { Layout } from './Layout.jsx';
import LoadingSpinner from './Components/LoadingSpinner'; // You can customize this spinner

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {routes.map(({ path, element, layout }) => (
          <Route
            key={path}
            path={path}
            element={layout ? <Layout>{element}</Layout> : element}
          />
        ))}
      </Routes>
    </Suspense>
  );
}

export default App;
