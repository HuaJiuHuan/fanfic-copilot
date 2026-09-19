'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AppHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  username: string;
  children?: React.ReactNode;
}

export default function AppHeader({ breadcrumbs, username, children }: AppHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function handleLogout() {
    setLogoutLoading(true);
    window.location.assign('/api/auth/signout?callbackUrl=/login');
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avatarChar = (username || 'U').replace(/^[^\w]*/, '').charAt(0).toUpperCase();

  return (
    <>
      <header className="w-full px-6 py-4 border-b border-academia-border bg-academia-bg/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/"
            className="text-xl font-serif font-bold tracking-widest text-academia-gold hover:opacity-80 transition-opacity shrink-0"
          >
            QUILLOW
          </Link>
          {breadcrumbs.length > 0 && (
            <>
              <span className="w-px h-4 bg-academia-border shrink-0" />
              <nav className="flex items-center gap-2 min-w-0" aria-label="面包屑导航">
                {breadcrumbs.map((crumb, i) => {
                  const isLast = i === breadcrumbs.length - 1;
                  return (
                    <span key={crumb.label} className="flex items-center gap-2 min-w-0">
                      {isLast ? (
                        <span className="text-xs text-academia-gold font-bold truncate">
                          {crumb.label}
                        </span>
                      ) : (
                        <Link
                          href={crumb.href || '/'}
                          className="text-xs text-academia-muted hover:text-academia-parchment transition-colors shrink-0"
                        >
                          {crumb.label}
                        </Link>
                      )}
                      {!isLast && (
                        <span className="text-xs text-academia-muted shrink-0" aria-hidden="true">
                          |
                        </span>
                      )}
                    </span>
                  );
                })}
              </nav>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {children}

          <Link
            href="/project/new"
            className="text-xs text-academia-gold border border-academia-gold/30 rounded-lg px-3 py-1.5 hover:bg-academia-gold/10 transition-colors shrink-0"
          >
            + 开新坑
          </Link>

          <button
            className="w-8 h-8 rounded-full bg-academia-surface border border-academia-border flex items-center justify-center text-xs text-academia-muted hover:text-academia-gold hover:border-academia-gold/40 transition-colors shrink-0"
            aria-label="通知"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>

          <div ref={dropdownRef} className="relative shrink-0">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-8 h-8 rounded-full bg-academia-gold/20 border border-academia-gold/30 flex items-center justify-center text-sm font-bold text-academia-gold hover:bg-academia-gold/30 transition-colors"
              aria-label="用户菜单"
            >
              {avatarChar}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-academia-surface border border-academia-border rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-2 border-b border-academia-border">
                  <p className="text-xs text-academia-parchment font-medium truncate">
                    {username}
                  </p>
                </div>
                <nav className="py-1">
                  <Link
                    href="/"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-academia-muted hover:text-academia-parchment hover:bg-academia-bg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    我的项目
                  </Link>
                  <Link
                    href="/discover"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-academia-muted hover:text-academia-parchment hover:bg-academia-bg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    作品广场
                  </Link>
                </nav>
                <div className="border-t border-academia-border py-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setLogoutDialogOpen(true);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-xs text-academia-muted hover:text-red-400 hover:bg-academia-bg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {logoutDialogOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={logoutLoading ? undefined : () => setLogoutDialogOpen(false)}
            />
            <div className="relative bg-academia-surface border border-academia-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
              <h3 className="text-sm font-bold text-academia-parchment mb-2">确认退出</h3>
              <p className="text-xs text-academia-muted mb-4">确定要退出登录吗？</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setLogoutDialogOpen(false)}
                  disabled={logoutLoading}
                  className="text-xs text-academia-muted hover:text-academia-parchment px-3 py-1.5 border border-academia-border rounded-lg hover:bg-academia-bg transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50"
                >
                  {logoutLoading ? '退出中...' : '确认退出'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}