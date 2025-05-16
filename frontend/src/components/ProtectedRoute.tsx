import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // 認証UIを直接表示
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              RAPID
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Review & Assessment Powered by Intelligent Documentation
            </p>
          </div>
          <Authenticator
            initialState="signIn"
            components={{
              SignIn: {
                Header() {
                  return (
                    <h3 className="text-xl font-semibold text-center">
                      サインイン
                    </h3>
                  );
                },
              },
              SignUp: {
                Header() {
                  return (
                    <h3 className="text-xl font-semibold text-center">
                      アカウント作成
                    </h3>
                  );
                },
              },
            }}
          >
            {({ signOut, user }) => {
              // 認証成功時に自動的にリダイレクト
              window.location.href = "/";
              return <div></div>;
            }}
          </Authenticator>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
