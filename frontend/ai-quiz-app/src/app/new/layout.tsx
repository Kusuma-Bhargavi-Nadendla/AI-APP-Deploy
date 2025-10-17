'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [userName, setUserName] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: 'Home', path: '/home', icon: '🏠' },
    { name: 'History', path: '/history', icon: '📊' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const getPageTitle = () => {
    const route = navigation.find(item => item.path === pathname);
    return route ? route.name : 'Dashboard';
  };

  useEffect(() => {
    const jwtToken = localStorage.getItem("token");
    if (jwtToken) {
      try {
        const decoded: { id: string; name: string } = jwtDecode(jwtToken);
        setUserName(decoded.name);
      } catch (error) {
        router.push("/login");
      }
    } else {
      router.push("/login");
      return;
    }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 p-4">
      {/* FIXED SIDEBAR */}
      <div 
        className={`bg-gray-800/40 rounded-2xl shadow-2xl transition-all duration-300 flex-shrink-0 sticky top-4 ${
          sidebarExpanded ? 'w-48' : 'w-16'
        }`}
        style={{ height: 'calc(100vh - 2rem)' }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <div className="h-16 flex items-center justify-center border-b border-blue-500">
          <div className={`font-bold text-white ${sidebarExpanded ? 'text-xl' : 'text-lg'}`}>
            {sidebarExpanded ? 'QUIZORA' : 'Q'}
          </div>
        </div>

        <nav className="mt-4 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center py-3 px-3 my-1 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500 text-white shadow-lg transform translate-x-1'
                    : 'text-white hover:bg-white/20 hover:text-white'
                } ${sidebarExpanded ? 'justify-start' : 'justify-center'}`}
              >
                <span className="text-lg">{item.icon}</span>
                {sidebarExpanded && (
                  <span className="ml-3 font-medium">{item.name}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 flex flex-col ml-4 min-h-[calc(100vh-2rem)]">
        <header className="h-16 bg-white rounded-2xl shadow-lg flex items-center justify-between px-8 mb-4 border-2 border-blue-500 ">
          <h1 className="text-xl font-semibold text-gray-800">
            {getPageTitle()}
          </h1>

          <div className="flex items-center space-x-6">
            <span className="text-sm text-blue-600 hidden sm:block bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
               Welcome, {userName}
            </span>
            
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-lg border border-red-600"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 bg-white rounded-2xl shadow-xl border-2 border-blue-500 p-8 overflow-hidden">
          <div className="h-full overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}