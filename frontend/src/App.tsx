import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context and Components
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Loader } from './components/common/Loader';

// Pages
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import { ChatInterface } from './components/chat/ChatInterface';

// Error boundary component
const ErrorBoundary = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-red-600">Something went wrong</h2>
      <p className="mt-2 text-gray-600">Please try refreshing the page or contact support if the problem persists.</p>
    </div>
  </div>
);

// Layout component for protected routes
const MainLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatInterface />
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

// Public route component
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Create the router with proper typing
const router = createBrowserRouter(
  [
    {
      path: "/login",
      element: (
        <PublicRoute>
          <LoginForm />
        </PublicRoute>
      ),
      errorElement: <ErrorBoundary />,
    },
    {
      path: "/register",
      element: (
        <PublicRoute>
          <RegisterForm />
        </PublicRoute>
      ),
      errorElement: <ErrorBoundary />,
    },
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <Navigate to="/" replace />,
        },
      ],
      errorElement: <ErrorBoundary />,
    },
    {
      path: "*",
      element: <Navigate to="/" replace />,
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);

const App = () => {
  return (
    <AuthProvider>
      <ChatProvider>
        <RouterProvider 
          router={router} 
          fallbackElement={
            <div className="flex h-screen items-center justify-center">
              <Loader size="lg" />
            </div>
          } 
        />
        <Toaster position="top-right" />
      </ChatProvider>
    </AuthProvider>
  );
};

export default App;
