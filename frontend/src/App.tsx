import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SWRConfig } from 'swr';
import Layout from './components/Layout';
import CheckListPage from './pages/CheckListPage';
import ReviewPage from './pages/ReviewPage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';

/**
 * アプリケーションのルートコンポーネント
 */
function App() {
  return (
    <SWRConfig
      value={{
        errorRetryCount: 3,
        revalidateOnFocus: false,
        revalidateIfStale: false,
        shouldRetryOnError: true,
      }}
    >
      <BrowserRouter>
        <Routes>
          {/* ルートパスへのアクセスをチェックリストページにリダイレクト */}
          <Route path="/" element={<Navigate to="/checklist" replace />} />
          
          {/* レイアウトを適用するルート */}
          <Route path="/" element={<Layout />}>
            <Route path="checklist" element={<CheckListPage />} />
            <Route path="review" element={<ReviewPage />} />
            <Route path="documents" element={<ReviewPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SWRConfig>
  );
}

export default App;
