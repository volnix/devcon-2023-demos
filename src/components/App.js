import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import '@aws-amplify/ui-react/styles.css';
import { lazy, Suspense } from "react";

const Chat = lazy(() => import('./Chat'));
const LoginPage = lazy(() => import('./Login'));
const LogoutPage = lazy(() => import('./Logout'));

export default function App() {

  return (
    <Routes>
      <Route path="/" element={<Suspense fallback={<>Loading...</>}><Chat /></Suspense>} />
      <Route path="/login" element={<Suspense fallback={<>Loading...</>}><LoginPage /></Suspense>} />
      <Route path="/loggedin" element={<Suspense fallback={<>Loading...</>}><Chat/></Suspense>} />
      <Route path="/signout" element={<Suspense fallback={<>Loading...</>}>{<Navigate replace to="/" />}</Suspense>} />
    </Routes>
  );
}