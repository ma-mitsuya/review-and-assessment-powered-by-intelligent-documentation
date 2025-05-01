## 3. フロントエンドでAmplify Authenticatorの実装

### 新規作成するファイル

#### `frontend/src/contexts/AuthContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Amplify, Auth } from 'aws-amplify';

// 環境変数から設定を取得
const region = import.meta.env.VITE_AWS_REGION || 'ap-northeast-1';
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const userPoolWebClientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

// Amplify設定
Amplify.configure({
  Auth: {
    region,
    userPoolId,
    userPoolWebClientId,
  }
});

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  signIn: (username: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  async function checkAuthState() {
    try {
      const user = await Auth.currentAuthenticatedUser();
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(username: string, password: string) {
    try {
      const user = await Auth.signIn(username, password);
      setUser(user);
      setIsAuthenticated(true);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async function signOut() {
    try {
      await Auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  async function getIdToken(): Promise<string | null> {
    try {
      const session = await Auth.currentSession();
      return session.getIdToken().getJwtToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, signIn, signOut, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

#### `frontend/src/pages/LoginPage.tsx`

```typescript
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  // ユーザーが既に認証されている場合はリダイレクト
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/';
    navigate(from, { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            BEACON
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Building & Engineering Approval Compliance Navigator
          </p>
          {error && (
            <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
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
          services={{
            async handleSignIn(formData) {
              try {
                setError(null);
                // デフォルトの処理を使用
                return { username: formData.username };
              } catch (err: any) {
                setError(err.message || 'サインインに失敗しました');
                throw err;
              }
            },
          }}
        >
          {({ signOut }) => (
            <div className="mt-4 text-center">
              <p className="text-green-600 font-medium">認証に成功しました！</p>
              <button
                onClick={() => navigate('/')}
                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ホームに進む
              </button>
              <button
                onClick={signOut}
                className="mt-2 ml-2 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                サインアウト
              </button>
            </div>
          )}
        </Authenticator>
      </div>
    </div>
  );
}
```

#### `frontend/src/components/ProtectedRoute.tsx`

```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
    // ログインページにリダイレクトし、ログイン後に元のページに戻れるようにする
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

### 修正するファイル

#### `frontend/src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SWRConfig } from 'swr';
import Layout from './components/Layout';
import { 
  CheckListPage, 
  CheckListSetDetailPage, 
  CheckListSetFormPage, 
  CheckListItemFormPage,
  CreateChecklistPage 
} from './features/checklist';
import { ReviewListPage, ReviewCreatePage, ReviewDetailPage } from './features/review';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

/**
 * アプリケーションのルートコンポーネント
 */
function App() {
  return (
    <AuthProvider>
      <SWRConfig
        value={{
          errorRetryCount: 3,
          revalidateOnFocus: false,
          revalidateIfStale: false,
          shouldRetryOnError: true,
        }}
      >
        <ToastProvider>
          <BrowserRouter future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}>
            <Routes>
              {/* 認証ページ */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* ルートパスへのアクセスをチェックリストページにリダイレクト */}
              <Route path="/" element={<Navigate to="/checklist" replace />} />
              
              {/* 保護されたルート */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                {/* チェックリスト関連のルート */}
                <Route path="checklist" element={<CheckListPage />} />
                <Route path="checklist/new" element={<CreateChecklistPage />} />
                <Route path="checklist/:id" element={<CheckListSetDetailPage />} />
                <Route path="checklist/:id/edit" element={<CheckListSetFormPage />} />
                <Route path="checklist/:setId/items/new" element={<CheckListItemFormPage />} />
                <Route path="checklist-items/:itemId/edit" element={<CheckListItemFormPage />} />
                
                {/* 審査関連のルート */}
                <Route path="review" element={<ReviewListPage />} />
                <Route path="review/create" element={<ReviewCreatePage />} />
                <Route path="review/:id" element={<ReviewDetailPage />} />
                
                {/* その他のルート */}
                <Route path="documents" element={<ReviewListPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </SWRConfig>
    </AuthProvider>
  );
}

export default App;
```

#### `frontend/src/hooks/useHttp.ts`

APIキー認証を削除し、JWT認証のみを使用するように修正します。

```typescript
import useSWR, { SWRConfiguration, Fetcher } from "swr";
import { useAuth } from '../contexts/AuthContext';

const API_BASE =
  import.meta.env.VITE_APP_API_ENDPOINT || "http://localhost:3000";

const API_ENDPOINT = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;

// Define a response interface similar to AxiosResponse
interface FetchResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
  ok: boolean;
}

// Helper function to attach auth token to fetch requests
const getAuthHeaders = async (getIdToken: () => Promise<string | null>) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token = await getIdToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

// Helper function to handle fetch responses
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    // 401エラーの場合は認証エラーとして処理
    if (response.status === 401) {
      throw new Error('認証エラー: ログインが必要です');
    }
    
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || response.statusText);
    throw Object.assign(error, {
      status: response.status,
      response,
      data: errorData,
    });
  }

  return response.json();
};

/**
 * Hooks for Http Request using fetch API
 */
const useHttp = () => {
  const { getIdToken } = useAuth();
  
  // Define the custom fetcher types
  const fetcher: Fetcher<any, string> = async (url: string) => {
    const headers = await getAuthHeaders(getIdToken);
    const response = await fetch(`${API_ENDPOINT}${url}`, { headers });
    return handleResponse(response);
  };

  // Fetcher with params for SWR
  const fetchWithParams: Fetcher<any, [string, Record<string, any>]> = async ([url, params]: [
    string,
    Record<string, any>
  ]) => {
    const headers = await getAuthHeaders(getIdToken);
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    const fullUrl = `${API_ENDPOINT}${url}${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(fullUrl, { headers });
    return handleResponse(response);
  };

  return {
    /**
     * GET Request with SWR - Simple string URL version
     */
    get: <Data = any, Error = any>(
      url: string | null,
      config?: SWRConfiguration<Data, Error>
    ) => {
      return useSWR<Data, Error>(url, fetcher, config);
    },

    /**
     * GET Request with SWR - With parameters
     */
    getWithParams: <Data = any, Error = any>(
      url: string,
      params: Record<string, any>,
      config?: SWRConfiguration<Data, Error>
    ) => {
      return useSWR<Data, Error>([url, params], fetchWithParams, config);
    },

    getOnce: async <RES = any, DATA = any>(
      url: string,
      params?: DATA,
      errorProcess?: (err: any) => void
    ): Promise<FetchResponse<RES>> => {
      try {
        const headers = await getAuthHeaders(getIdToken);
        const queryParams = new URLSearchParams();

        if (params) {
          Object.entries(params as Record<string, any>).forEach(
            ([key, value]) => {
              if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
              }
            }
          );
        }

        const queryString = queryParams.toString();
        const fullUrl = `${API_ENDPOINT}${url}${
          queryString ? `?${queryString}` : ""
        }`;

        const response = await fetch(fullUrl, { headers });
        const data = await handleResponse<RES>(response);

        return {
          data,
          status: response.status,
          headers: response.headers,
          ok: response.ok,
        };
      } catch (err) {
        if (errorProcess) {
          errorProcess(err);
        } else {
          console.error(err);
        }
        throw err;
      }
    },

    post: async <RES = any, DATA = any>(
      url: string,
      data: DATA,
      errorProcess?: (err: any) => void
    ): Promise<FetchResponse<RES>> => {
      try {
        const headers = await getAuthHeaders(getIdToken);
        const response = await fetch(`${API_ENDPOINT}${url}`, {
          method: "POST",
          headers,
          body: JSON.stringify(data),
        });

        const responseData = await handleResponse<RES>(response);
        return {
          data: responseData,
          status: response.status,
          headers: response.headers,
          ok: response.ok,
        };
      } catch (err) {
        if (errorProcess) {
          errorProcess(err);
        } else {
          console.error(err);
        }
        throw err;
      }
    },

    put: async <RES = any, DATA = any>(
      url: string,
      data: DATA,
      errorProcess?: (err: any) => void
    ): Promise<FetchResponse<RES>> => {
      try {
        const headers = await getAuthHeaders(getIdToken);
        const response = await fetch(`${API_ENDPOINT}${url}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(data),
        });

        const responseData = await handleResponse<RES>(response);
        return {
          data: responseData,
          status: response.status,
          headers: response.headers,
          ok: response.ok,
        };
      } catch (err) {
        if (errorProcess) {
          errorProcess(err);
        } else {
          console.error(err);
        }
        throw err;
      }
    },

    delete: async <RES = any, DATA = any>(
      url: string,
      params?: DATA,
      errorProcess?: (err: any) => void
    ): Promise<FetchResponse<RES>> => {
      try {
        const headers = await getAuthHeaders(getIdToken);
        const queryParams = new URLSearchParams();

        if (params) {
          Object.entries(params as Record<string, any>).forEach(
            ([key, value]) => {
              if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
              }
            }
          );
        }

        const queryString = queryParams.toString();
        const fullUrl = `${API_ENDPOINT}${url}${
          queryString ? `?${queryString}` : ""
        }`;

        const response = await fetch(fullUrl, {
          method: "DELETE",
          headers,
        });

        const responseData = await handleResponse<RES>(response);
        return {
          data: responseData,
          status: response.status,
          headers: response.headers,
          ok: response.ok,
        };
      } catch (err) {
        if (errorProcess) {
          errorProcess(err);
        } else {
          console.error(err);
        }
        throw err;
      }
    },

    patch: async <RES = any, DATA = any>(
      url: string,
      data: DATA,
      errorProcess?: (err: any) => void
    ): Promise<FetchResponse<RES>> => {
      try {
        const headers = await getAuthHeaders(getIdToken);
        const response = await fetch(`${API_ENDPOINT}${url}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(data),
        });

        const responseData = await handleResponse<RES>(response);
        return {
          data: responseData,
          status: response.status,
          headers: response.headers,
          ok: response.ok,
        };
      } catch (err) {
        if (errorProcess) {
          errorProcess(err);
        } else {
          console.error(err);
        }
        throw err;
      }
    },
  };
};
```

#### `frontend/package.json` (依存関係の追加)

```json
{
  "dependencies": {
    "@fontsource/m-plus-rounded-1c": "^5.2.5",
    "@tailwindcss/typography": "^0.5.16",
    "@aws-amplify/ui-react": "^6.1.3",
    "aws-amplify": "^6.0.16",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-dropzone": "^14.3.8",
    "react-icons": "^5.5.0",
    "react-router-dom": "^6.22.0",
    "reactflow": "^11.10.1",
    "swr": "^2.2.4",
    "tailwind-scrollbar": "^3.0.0",
    "uuid": "^9.0.1"
  }
}
```

## 環境変数の設定

### `frontend/.env.local`

```
VITE_AWS_REGION=ap-northeast-1
VITE_COGNITO_USER_POOL_ID=<UserPoolId>
VITE_COGNITO_CLIENT_ID=<ClientId>
VITE_API_BASE_URL=<APIエンドポイント>
```

## デプロイ手順

1. CDKの変更をデプロイ
   ```bash
   cd cdk
   npm run build
   cdk deploy --require-approval never
   ```

2. 出力されたCognitoのUserPoolIdとClientIdを環境変数に設定

3. バックエンドの依存関係をインストールして起動
   ```bash
   cd backend
   npm install jose
   npm run build
   npm start
   ```

4. フロントエンドの依存関係をインストールして起動
   ```bash
   cd frontend
   npm install @aws-amplify/ui-react aws-amplify
   npm run build
   npm run preview
   ```

## テスト計画

1. CDKデプロイ後、Cognitoユーザープールが正しく作成されていることを確認
2. Cognitoコンソールからテストユーザーを作成
3. フロントエンドのログイン画面でテストユーザーでログインできることを確認
4. 保護されたルートにアクセスできることを確認
5. バックエンドAPIに認証付きでアクセスできることを確認
6. ログアウト機能が正しく動作することを確認
