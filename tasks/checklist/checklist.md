## /checklist にアクセスできない

## リファクタリング

- frontend で、root の Pages と、features/checklist の pages と両方あり、散財しています。チェックリスト関連はすべて features/checklist に統一せよ
-

## アイコン

サイドバーのアイコン（BEACON の左）を asset/icon.png に変更せよ

## React warning

フロントエド立ち上げると以下のメッセージが表示される。原因分析し、修正計画立てよ。詳細なコード例は計画に含めなくて良い。

hook.js:608 ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition. Error Component Stack
at BrowserRouter (react-router-dom.js?v=fbb14fef:5248:5)
at SWRConfig (swr.js?v=fbb14fef:457:11)
at App (<anonymous>)
overrideMethod @ hook.js:608
warnOnce @ react-router-dom.js?v=fbb14fef:4394
logDeprecation @ react-router-dom.js?v=fbb14fef:4397
logV6DeprecationWarnings @ react-router-dom.js?v=fbb14fef:4400
(anonymous) @ react-router-dom.js?v=fbb14fef:5272
commitHookEffectListMount @ chunk-PJEEZAML.js?v=fbb14fef:16915
commitPassiveMountOnFiber @ chunk-PJEEZAML.js?v=fbb14fef:18156
commitPassiveMountEffects_complete @ chunk-PJEEZAML.js?v=fbb14fef:18129
commitPassiveMountEffects_begin @ chunk-PJEEZAML.js?v=fbb14fef:18119
commitPassiveMountEffects @ chunk-PJEEZAML.js?v=fbb14fef:18109
flushPassiveEffectsImpl @ chunk-PJEEZAML.js?v=fbb14fef:19490
flushPassiveEffects @ chunk-PJEEZAML.js?v=fbb14fef:19447
(anonymous) @ chunk-PJEEZAML.js?v=fbb14fef:19328
workLoop @ chunk-PJEEZAML.js?v=fbb14fef:197
flushWork @ chunk-PJEEZAML.js?v=fbb14fef:176
performWorkUntilDeadline @ chunk-PJEEZAML.js?v=fbb14fef:384
hook.js:608 ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath. Error Component Stack
at BrowserRouter (react-router-dom.js?v=fbb14fef:5248:5)
at SWRConfig (swr.js?v=fbb14fef:457:11)
at App (<anonymous>)

# 修正版：重複ファイル調査結果と統廃合計画

## 1. ファイルアップローダーコンポーネント

### 重複ファイル:

• /frontend/src/components/FileUploader.tsx (共通コンポーネント)
• /frontend/src/features/checklist/components/creation/FileUploader.tsx (ラッパー)
• /frontend/src/features/checklist-creation/components/FileUploader.tsx (ラッパー)

### 分析:

• src/components/FileUploader.tsx が基本実装で、他の 2 つはこれをラップしているだけ
• 両方のラッパーは同じパラメータを渡しており、機能的に違いがない

### 対応策:

1. 保持するファイル: /frontend/src/components/FileUploader.tsx
2. 削除するファイル:
   • /frontend/src/features/checklist/components/creation/FileUploader.tsx
   • /frontend/src/features/checklist-creation/components/FileUploader.tsx
3. 修正: 削除したファイルを参照している箇所を共通コンポーネントを直接参照するように変更

## 2. 処理ステータス表示コンポーネント

### 重複ファイル:

• /frontend/src/features/checklist/components/creation/ProcessingStatus.tsx
• /frontend/src/features/checklist-creation/components/ProcessingStatus.tsx

### 分析:

• 両方のファイルはほぼ同一のコード
• チェックリスト機能に特化したコンポーネント

### 対応策:

1. 保持するファイル: /frontend/src/features/checklist/components/ProcessingStatus.tsx (移動)
2. 削除するファイル:
   • /frontend/src/features/checklist/components/creation/ProcessingStatus.tsx
   • /frontend/src/features/checklist-creation/components/ProcessingStatus.tsx
3. 修正:
   • 機能特化コンポーネントとして features/checklist/components 直下に移動
   • 参照を更新

## 3. チェックリスト作成フック

### 重複ファイル:

• /frontend/src/features/checklist/hooks/useChecklistCreation.ts
• /frontend/src/features/checklist-creation/hooks/useChecklistCreation.ts

### 分析:

• 両方のファイルはほぼ同一のコード
• チェックリスト機能に特化したフック

### 対応策:

1. 保持するファイル: /frontend/src/features/checklist/hooks/useChecklistCreation.ts
2. 削除するファイル:
   • /frontend/src/features/checklist-creation/hooks/useChecklistCreation.ts
3. 修正:
   • 参照を更新
   • インポートパスの修正

## 4. チェックリスト作成ページ

### 重複ファイル:

• /frontend/src/features/checklist/pages/creation/CreateChecklistPage.tsx
• /frontend/src/features/checklist-creation/pages/CreateChecklistPage.tsx

### 分析:

• 両方のファイルはほぼ同一のコード
• チェックリスト機能に特化したページコンポーネント

### 対応策:

1. 保持するファイル: /frontend/src/features/checklist/pages/CreateChecklistPage.tsx (移動)
2. 削除するファイル:
   • /frontend/src/features/checklist/pages/creation/CreateChecklistPage.tsx
   • /frontend/src/features/checklist-creation/pages/CreateChecklistPage.tsx
3. 修正:
   • features/checklist/pages 直下に移動
   • App.tsx のルーティングを更新
   • インポートパスの修正

## 5. チェックリストセット操作フック

### 重複ファイル:

• /frontend/src/features/checklist/hooks/useCheckListSets.ts
• /frontend/src/features/checklist/hooks/useCheckListSetActions.ts

### 分析:

• useCheckListSets.ts には useChecklistSetMutations が含まれており、useCheckListSetActions.ts と機能が重複
• 両方とも同じ機能（チェックリストセットの作成・更新・削除）を提供

### 対応策:

1. 保持するファイル: /frontend/src/features/checklist/hooks/useCheckListSets.ts (統合版)
2. 削除するファイル: /frontend/src/features/checklist/hooks/useCheckListSetActions.ts
3. 修正: useCheckListSetActions を参照している箇所を useChecklistSetMutations に変更

## 6. チェックリストセットリスト

### 重複ファイル:

• /frontend/src/components/checklist/CheckListSetList.tsx
• /frontend/src/features/checklist/components/CheckListSetList.tsx

### 分析:

• 両方のファイルは異なる実装
• components/checklist/CheckListSetList.tsx はシンプルなリスト表示
• features/checklist/components/CheckListSetList.tsx はより機能的なテーブル表示

### 対応策:

1. 保持するファイル: /frontend/src/features/checklist/components/CheckListSetList.tsx (機能的な実装)
2. 削除するファイル: /frontend/src/components/checklist/CheckListSetList.tsx
3. 修正: 削除したファイルを参照している箇所を更新

## 7. チェックリスト機能モジュール

### 重複ディレクトリ:

• /frontend/src/features/checklist
• /frontend/src/features/checklist-creation

### 分析:

• checklist-creation は checklist の一部機能のみを含む
• 両方のモジュールに重複するコンポーネントやフックが存在

### 対応策:

1. 保持するディレクトリ: /frontend/src/features/checklist (統合版)
2. 削除するディレクトリ: /frontend/src/features/checklist-creation
3. 修正: 必要なファイルを checklist に統合し、参照を更新

## 8. コンポーネント構成の整理

### 問題点:

• /frontend/src/components/checklist と /frontend/src/components/ui の二つのディレクトリが混在
• UI コンポーネントの配置が不統一

### 対応策:

1. 保持するディレクトリ: /frontend/src/components (直下に UI コンポーネントを配置)
2. 移動するファイル:
   • /frontend/src/components/ui/\* → /frontend/src/components/ (直下に移動)
3. 削除するディレクトリ:
   • /frontend/src/components/checklist (機能特化コンポーネントは features に移動済み)
   • /frontend/src/components/ui (直下に移動後に削除)

## 統廃合実施計画

### 1. 削除するファイル

1. /frontend/src/features/checklist/components/creation/FileUploader.tsx
2. /frontend/src/features/checklist-creation/components/FileUploader.tsx
3. /frontend/src/features/checklist/components/creation/ProcessingStatus.tsx
4. /frontend/src/features/checklist-creation/components/ProcessingStatus.tsx
5. /frontend/src/features/checklist-creation/hooks/useChecklistCreation.ts
6. /frontend/src/features/checklist/pages/creation/CreateChecklistPage.tsx
7. /frontend/src/features/checklist-creation/pages/CreateChecklistPage.tsx
8. /frontend/src/features/checklist/hooks/useCheckListSetActions.ts
9. /frontend/src/components/checklist/CheckListSetList.tsx
10. /frontend/src/components/checklist/CheckListSetCard.tsx (関連ファイル)

### 2. 新規作成/移動するファイル

1. /frontend/src/features/checklist/components/ProcessingStatus.tsx (移動)
2. /frontend/src/features/checklist/pages/CreateChecklistPage.tsx (移動)

### 3. 修正が必要なファイル

1. /frontend/src/App.tsx - ルーティングの更新
2. /frontend/src/features/checklist/index.ts - エクスポートの更新
3. 削除したファイルを参照しているすべてのファイル
4. UI コンポーネントのインポートパスを更新

### 4. ディレクトリ整理

1. /frontend/src/components/ui/\* のファイルを /frontend/src/components/ 直下に移動
2. 空になったディレクトリを削除:
   • /frontend/src/components/ui
   • /frontend/src/components/checklist
   • /frontend/src/features/checklist-creation
   • /frontend/src/features/checklist/components/creation
   • /frontend/src/features/checklist/pages/creation
