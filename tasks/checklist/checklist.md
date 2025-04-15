## フロントエンド整理

冗長で内容が重複しているファイルがいくつもあります（下記は例）。網羅的に調査し、重複している場合は統廃合せよ。具体的には修正するファイル名・パス、削除するファイル名・パスを洗い出せ。なお既存の機能を破壊することを厳格に禁止します。

- frontend/src/components/checklist, frontend/src/features/checklist/components
- frontend/src/components/FileUploader.tsx, frontend/src/features/checklist/components/CheckListFlowChart.tsx
- frontend/src/features/checklist/hooks/useCheckListSets.ts,frontend/src/features/checklist/hooks/useCheckListSetActions.ts

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
