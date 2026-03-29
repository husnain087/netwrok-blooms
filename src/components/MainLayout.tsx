import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ChatWidget from '@/components/ChatWidget';
import Footer from '@/components/Footer';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-4 flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
};

export default MainLayout;
