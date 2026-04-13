import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { HomePage } from '@/pages/HomePage';
import { PropertiesPage } from '@/pages/PropertiesPage';
import { PropertyDetailPage } from '@/pages/PropertyDetailPage';
import { AboutPage } from '@/pages/AboutPage';
import { AgentsPage } from '@/pages/AgentsPage';
import { ContactPage } from '@/pages/ContactPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"                element={<HomePage />} />
          <Route path="/propiedades"     element={<PropertiesPage />} />
          <Route path="/propiedades/:id" element={<PropertyDetailPage />} />
          <Route path="/nosotros"        element={<AboutPage />} />
          <Route path="/agentes"         element={<AgentsPage />} />
          <Route path="/contacto"        element={<ContactPage />} />
          <Route path="*"               element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
