import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SWRConfig } from 'swr';
import Layout from './components/Layout';
import CheckListPage from './pages/CheckListPage';
import CheckListSetDetailPage from './pages/CheckListSetDetailPage';
import CheckListSetFormPage from './pages/CheckListSetFormPage';
import CheckListItemFormPage from './pages/CheckListItemFormPage';
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
            {/* チェックリスト関連のルート */}
            <Route path="checklist" element={<CheckListPage />} />
            <Route path="checklist/new" element={<CheckListSetFormPage />} />
            <Route path="checklist/:id" element={<CheckListSetDetailPage />} />
            <Route path="checklist/:id/edit" element={<CheckListSetFormPage />} />
            <Route path="checklist/:setId/items/new" element={<CheckListItemFormPage />} />
            <Route path="checklist-items/:itemId/edit" element={<CheckListItemFormPage />} />
            
            {/* その他のルート */}
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
