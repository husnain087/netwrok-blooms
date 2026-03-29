import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '@/assets/logo.png';

const Footer = () => {
  const links = [
    { to: '/about', label: 'About' },
    { to: '/accessibility', label: 'Accessibility' },
    { to: '/help-center', label: 'Help Center' },
    { to: '/privacy', label: 'Privacy & Terms' },
    { to: '/ad-choices', label: 'Ad Choices' },
    { to: '/advertising', label: 'Advertising' },
    { to: '/business-services', label: 'Business Services' },
  ];

  return (
    <footer className="border-t bg-card mt-8">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <img src={logoImg} alt="Network-Bloom" className="h-6 w-6 rounded-full" />
          <span className="font-bold text-sm text-foreground">Network-Bloom</span>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {links.map((link, i) => (
            <React.Fragment key={link.to}>
              <Link to={link.to} className="hover:text-primary hover:underline transition-colors">
                {link.label}
              </Link>
              {i < links.length - 1 && <span className="text-border">•</span>}
            </React.Fragment>
          ))}
        </nav>
        <p className="text-xs text-muted-foreground mt-4">© {new Date().getFullYear()} Network-Bloom. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
