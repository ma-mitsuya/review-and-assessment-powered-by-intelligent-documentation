# BEACON チェックリストサンプルデータ

このディレクトリには、BEACON（Building & Engineering Approval Compliance Navigator）システムで使用されるチェックリストのサンプルデータが含まれています。

## チェックリストデータ構造

チェックリストは以下の構造を持ちます：

### CSV 形式

```
id,name,condition,parentId,dependsOn,allRequired,required
```

各フィールドの説明：

- **id**: 項目の UUID（一意の識別子）
- **name**: 項目の名前
- **condition**: チェック条件の説明
- **parentId**: 親項目の ID（階層関係を表現）
- **dependsOn**: この項目が依存する他の項目の ID（カンマ区切りで複数指定可能）
- **allRequired**: 依存項目がすべて満たされる必要があるかどうか（true/false）
  - true: すべての依存項目が OK である必要がある（AND 条件）
  - false: いずれかの依存項目が OK であれば良い（OR 条件）
- **required**: この項目が必須かどうか（true/false）

### 階層関係の表現

- 親子関係は `parentId` フィールドで表現されます
- 親項目の ID を子項目の `parentId` に設定することで階層構造を形成します
- 最上位の項目は `parentId` が空です

### 依存関係の表現

- 項目間の依存関係は `dependsOn` フィールドで表現されます
- 複数の依存関係がある場合はカンマ区切りで指定します
- `allRequired` フィールドで依存関係の条件（AND/OR）を指定します

### フローチャート的な分岐の表現

- 依存関係と `allRequired` フィールドを組み合わせることで、フローチャート的な分岐を表現できます
- 例: A 項目が OK なら B 項目をチェック → B 項目の `dependsOn` に A 項目の ID を設定
- 例: A〜E 項目すべて OK ならチェック OK → 親項目の `allRequired` を true に設定

## 使用例

```csv
id,name,condition,parentId,dependsOn,allRequired,required
f47ac10b-58cc-4372-a567-0e02b2c3d479,申請書基本情報確認,申請書に必要な基本情報が記載されている,,,true,true
b9a2e5a8-7c0f-4b82-9e15-e4c6e5af3c2a,建築主情報,建築主の氏名・住所が正確に記載されている,f47ac10b-58cc-4372-a567-0e02b2c3d479,,false,true
...
```

この例では：

- `f47ac10b-58cc-4372-a567-0e02b2c3d479` は最上位の項目（親項目）
- `b9a2e5a8-7c0f-4b82-9e15-e4c6e5af3c2a` はその子項目
- 親項目の `allRequired` が true なので、すべての子項目が満たされる必要がある

## 注意事項

- UUID は一意である必要があります
- 循環参照（A→B→C→A）のような依存関係は避けてください
- `dependsOn` で指定する ID は、必ず存在する項目の ID である必要があります
