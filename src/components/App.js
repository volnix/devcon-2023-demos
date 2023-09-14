import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import '@aws-amplify/ui-react/styles.css';
import { lazy, Suspense } from "react";
import { ThemeProvider, defaultDarkModeOverride } from '@aws-amplify/ui-react';

const Chat = lazy(() => import('./Chat'));
const LoginPage = lazy(() => import('./Login'));

export default function App() {

  const theme = {
    name: 'devcon-demo',
    overrides: [defaultDarkModeOverride],
  };

  return (
    <ThemeProvider theme={theme} colorMode='dark'>
      <Routes>
        <Route path="/" element={<Suspense fallback={<>Loading...</>}><Chat /></Suspense>} />
        <Route path="/login" element={<Suspense fallback={<>Loading...</>}><LoginPage /></Suspense>} />
        <Route path="/loggedin" element={<Suspense fallback={<>Loading...</>}><Chat/></Suspense>} />
        <Route path="/signout" element={<Suspense fallback={<>Loading...</>}>{<Navigate replace to="/" />}</Suspense>} />
      </Routes>
    </ThemeProvider>
  );
}