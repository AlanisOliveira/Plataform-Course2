import Header from "@/components/header";
import CoursePage from "@/pages/course";
import SettingsPage from "@/pages/settings";
import LoginPage from "@/pages/login";
import AdminPage from "@/pages/admin";
import { ThemeProvider } from "@/components/theme-provider";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import AuthInitializer from "@/components/auth/auth-initializer";
import ProtectedRoute from "@/components/auth/protected-route";

// Recipes
import RecipesDashboard from "@/pages/recipes-dashboard";
import RecipesLibrary from "@/pages/recipes-library";
import RecipesManage from "@/pages/recipes-manage";

// Books
import BooksDashboard from "@/pages/books-dashboard";
import BookReaderPage from "@/pages/book-reader";
import Footer from "@/components/footer";

type Props = {};

export default function Router({ }: Props) {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <Toaster
          position="bottom-right"
          richColors
          expand={false}
          visibleToasts={1}
        />
        <AuthInitializer>
          <Routes>
            {/* Login - rota pública */}
            <Route path="/login" element={<LoginPage />} />

            {/* Book reader without header (protegido) */}
            <Route
              path="/livros/:bookId"
              element={
                <ProtectedRoute>
                  <BookReaderPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <>
                    <Header />
                    <main className="p-6">
                      <Routes>
                        {/* Recipes */}
                        <Route path="/" element={<RecipesDashboard />} />
                        <Route path="/receitas" element={<RecipesLibrary />} />
                        <Route path="/receitas/gestao" element={<RecipesManage />} />
                        <Route path="/receitas/:courseId" element={<CoursePage />} />

                        {/* Books */}
                        <Route path="/livros" element={<BooksDashboard />} />

                        {/* Admin */}
                        <Route path="/admin" element={<AdminPage />} />

                        {/* Settings */}
                        <Route path="/configuracoes" element={<SettingsPage />} />
                      </Routes>
                    </main>
                    <Footer />
                  </>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthInitializer>
      </ThemeProvider>
    </BrowserRouter>
  );
}
