import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { 
  FileText, 
  PlusCircle, 
  LogOut, 
  User,
  Menu,
  X
} from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span className="font-bold text-xl">Qter</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex flex-1 items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <Link
                to="/dashboard"
                className={`transition-colors hover:text-foreground/80 ${
                  isActive('/dashboard') ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                我的表單
              </Link>
              <Link
                to="/forms/new"
                className={`transition-colors hover:text-foreground/80 ${
                  isActive('/forms/new') ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                建立表單
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm text-foreground/60">{user.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    登出
                  </Button>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden ml-auto"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <nav className="container py-4 space-y-4">
              <Link
                to="/dashboard"
                className={`block py-2 transition-colors hover:text-foreground/80 ${
                  isActive('/dashboard') ? 'text-foreground' : 'text-foreground/60'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                我的表單
              </Link>
              <Link
                to="/forms/new"
                className={`block py-2 transition-colors hover:text-foreground/80 ${
                  isActive('/forms/new') ? 'text-foreground' : 'text-foreground/60'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                建立表單
              </Link>
              {user && (
                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center space-x-2 py-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm text-foreground/60">{user.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full justify-start"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    登出
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  );
};