import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import { HomePage } from '@/pages/HomePage';
import { CatalogPage } from '@/pages/CatalogPage';
import { ChatPage } from '@/pages/ChatPage';
import { WishlistPage } from '@/pages/WishlistPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { CreateProductPage } from '@/pages/CreateProductPage';
import { MyProductsPage } from '@/pages/MyProductsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'catalog',
        element: <CatalogPage />,
      },
      {
        path: 'marketplace',
        element: <Navigate to="/catalog" replace />,
      },
      {
        path: 'chat',
        element: <ChatPage />,
      },
      {
        path: 'products/:id',
        element: <ProductDetailPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      // Protected Routes (Memerlukan Login)
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'wishlist',
            element: <WishlistPage />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
          {
            path: 'create-product',
            element: <CreateProductPage />,
          },
          {
            path: 'my-products',
            element: <MyProductsPage />,
          },
        ],
      },
      // 404 Catch All
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
