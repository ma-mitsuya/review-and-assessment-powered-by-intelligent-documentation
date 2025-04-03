# チェックリスト管理システムの設計と LLM による自動評価機能 - 実装概要

## 1. システム概要

契約書や書類のチェックリスト管理と、LLM を利用した自動評価を行うシステムです。単純なチェック項目と複雑なフローチャート型の判断フローの両方をサポートします。

## 2. データベース設計

### 主要テーブル構造

```sql
CREATE TABLE check_list_sets (
    check_list_set_id VARCHAR(26) PRIMARY KEY,  -- `ulid`
    name VARCHAR(255),
    description TEXT
);

CREATE TABLE check_list (
    check_id VARCHAR(26) PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    parent_id VARCHAR(26),
    item_type VARCHAR(20), -- 'SIMPLE' or 'FLOW'
    is_conclusion BOOLEAN DEFAULT FALSE,
    flow_data JSON,  -- フロー関連の情報を格納
    meta_data JSON,  -- 参照情報等のメタデータ
    FOREIGN KEY (parent_id) REFERENCES check_list(check_id)
);

CREATE TABLE documents (
    document_id VARCHAR(26) PRIMARY KEY, -- `ulid`
    filename VARCHAR(255),
    s3_path VARCHAR(512),
    file_type VARCHAR(50),
    upload_date TIMESTAMP,
    check_list_set_id VARCHAR(26),
    user_id VARCHAR(50),  -- `cognito user id`
    FOREIGN KEY (check_list_set_id) REFERENCES check_list_sets(check_list_set_id)
);

CREATE TABLE extracted_items (
    item_id VARCHAR(26) PRIMARY KEY,
    check_id VARCHAR(26),
    original_value TEXT,
    modified_value TEXT,
    field_name VARCHAR(255),
    is_modified BOOLEAN,
    modified_date TIMESTAMP,
    user_id VARCHAR(50),
    FOREIGN KEY (check_id) REFERENCES check_list(check_id)
);

CREATE TABLE check_results (
    result_id VARCHAR(26) PRIMARY KEY,
    check_id VARCHAR(26),
    document_id VARCHAR(26),
    result_value VARCHAR(20),
    confidence_score FLOAT,
    extracted_text TEXT,
    llm_explanation TEXT,
    user_override BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP,
    FOREIGN KEY (check_id) REFERENCES check_list(check_id),
    FOREIGN KEY (document_id) REFERENCES files(file_id)
);
```

### JSON 構造の例

#### flow_data (フローチャート項目用):

```json
{
  "next_if_yes": 2,
  "next_if_no": 10,
  "condition_type": "YES_NO"
}
```

または複数分岐の場合:

```json
{
  "next_options": {
    "customer": 5,
    "supplier": 7,
    "neither": 3
  },
  "condition_type": "MULTI_CHOICE"
}
```

#### meta_data:

```json
"meta_data": {
   "document_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
   "page_number": 123
}
```

## 3.チェックリスト管理システム - 具体的なデータ構造例

### 1. check_list テーブルのデータ例

#### 階層構造を持つ単純チェック項目の例

```
// 親項目（カテゴリ）
{
  check_id: 01B5NHDV91YF9QKH4JBSQFSBGN,
  name: "基本契約情報の確認",
  description: "契約書の基本的な情報が正しく記載されているかの確認",
  parent_id: null,  // トップレベル項目
  item_type: "SIMPLE",
  flow_data: null,
  meta_data: {
    "document_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
   "page_number": 123
  }
}

// 子項目（具体的なチェック項目）
{
  check_id: 01B5NHEANQJVDVKJHAQPBRA19H,
  name: "契約当事者の記載",
  description: "契約書に両当事者の正式名称が正確に記載されているか",
  parent_id: 01B5NHDV91YF9QKH4JBSQFSBGN,  // 親項目を参照
  item_type: "SIMPLE",
  flow_data: null,
  meta_data: {
    "document_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
   "page_number": 123
  }
}

{
  check_id: 01DAG9M3AQN08QVNFMW6P6MKSG,
  name: "契約日の記載",
  description: "契約締結日が明記され、両当事者の合意日と一致しているか",
  parent_id: 01B5NHDV91YF9QKH4JBSQFSBGN,  // 同じ親項目を参照
  item_type: "SIMPLE",
  flow_data: null,
  meta_data: {
    "document_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
   "page_number": 123
  }
}

// さらに深い階層の項目
{
  check_id: 01F8MECHZX3TBDSZ9MQ70WDHJF,
  name: "署名者の権限確認",
  description: "契約書に署名した人物が当該契約を締結する権限を有しているか",
  parent_id: 01B5NHEANQJVDVKJHAQPBRA19H,  // 「契約当事者の記載」の子項目
  item_type: "SIMPLE",
  flow_data: null,
  meta_data: {
    "document_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
   "page_number": 123
  }
}
```

#### フローチャート型項目の例

```json
// フローチャートの開始項目
{
  check_id: 01G6E96Z2ZN7AQGJ4SAJZ9PPVF,
  name: "リース契約判定",
  description: "この契約書がリース契約に該当するかの判断フロー",
  parent_id: null,  // トップレベル
  item_type: "FLOW",
  flow_data: {
    "next_if_yes": 201,
    "next_if_no": 210,
    "condition_type": "YES_NO"
  },
  meta_data: {
    "document_id": "01HFR0N599QPC0DA14F0V42FE3",
   "page_number": 123
  }
}

// フローの中間項目
{
  check_id: 01HFQPPXAZ1TP7NY4W2BC1CVSJ,
  name: "経済的利益の判断",
  description: "顧客が使用期間全体を通じて特定された資産の使用から経済的利益のほとんどすべてを享受する権利を有しているか",
  parent_id: 01G6E96Z2ZN7AQGJ4SAJZ9PPVF,  // フローの開始項目を親として参照
  item_type: "FLOW",
  flow_data: {
    "next_if_yes": 202,
    "next_if_no": 210,
    "condition_type": "YES_NO"
  },
  meta_data: {
    "document_id": "01HFR0N599QPC0DA14F0V42FE3",
   "page_number": 123
  }
}

// 複数分岐を持つフロー項目
{
  check_id: 01HFR0N51AC68T1QSZYDN8YMBG,
  name: "使用方法の指図権",
  description: "使用期間全体を通じて特定された資産の使用方法を指図する権利を有しているのは誰か",
  parent_id: 01G6E96Z2ZN7AQGJ4SAJZ9PPVF,  // 親はフローの開始項目
  item_type: "FLOW",
  flow_data: {
    "condition_type": "MULTI_CHOICE",
    "next_options": {
      "customer": 203,
      "supplier": 210,
      "neither": 205
    }
  },
  meta_data: {
    "document_id": "01HFR0N599QPC0DA14F0V42FE3",
   "page_number": 123
  }
}

// 結論項目
{
  check_id: 01HFR0N51JEPXFVKH37A9KF1XR,
  name: "リース契約結論",
  description: "当該契約はリースを含む",
  parent_id: 01G6E96Z2ZN7AQGJ4SAJZ9PPVF,  // 親はフローの開始項目
  item_type: "FLOW",
  is_conclusion: true,
  flow_data: null,
  meta_data: {
    "document_id": "01HFR0N599QPC0DA14F0V42FE3",
   "page_number": 123
  }
}
```

### 2. UI 上での階層構造表示例

#### 単純チェック項目の階層表示

```
● 基本契約情報の確認
  ├─ 契約当事者の記載
  │   └─ 署名者の権限確認
  ├─ 契約日の記載
  └─ 契約期間の明示

● 契約条件の確認
  ├─ 対価の定め
  ├─ 支払条件
  └─ 解除条件
```

#### フローチャート型項目の階層と関連

```
● リース契約判定 [フローチャート]
  ├─ 特定された資産があるか → Yes → 経済的利益の判断 → Yes → 使用方法の指図権
  │                          │                      │
  │                          │                      └→ No → 非リース契約
  │                          │
  └─ No → 非リース契約      └→ 顧客 → リース契約を含む
                              └→ サプライヤー → 非リース契約
                              └→ どちらにもない → 追加確認項目
```

これらの具体例によって、parent_id を活用した階層構造と item_type に基づいた異なるチェック項目タイプの運用方法が明確になります。システム実装時には、このような構造化データに基づいて適切な UI 表示や LLM 評価フローを構築することができます。

## 4. 主要機能の実装ポイント

### チェックリスト管理

- 単一項目チェックリストとフローチャート型チェックリストの両方をサポート
- 階層構造は`parent_id`で表現
- フローの分岐情報は`flow_data` JSON フィールドに格納

### ファイル管理

- Excel や契約書 PDF などの実ファイルのメタデータを`files`テーブルで管理
- ファイルとチェックリストセットの関連付けを保持

### LLM による自動評価処理

以下は Python ですが、要件は TS です。

```python
# 疑似コード
def process_document(document_id, check_list_set_id):
    # 1. ファイル取得とテキスト抽出
    document = get_document(document_id)
    extracted_text = extract_text_from_document(document)

    # 2. チェックリスト項目を取得
    check_items = get_check_items(check_list_set_id)

    # 3. LLMで各項目を評価
    for item in check_items:
        prompt = f"""
        以下の文書は、次の条件を満たしていますか？: {item.description}

        文書内容:
        {extracted_text}

        条件に適合しているかどうかを判断し、理由も説明してください。
        """

        llm_response = call_llm_api(prompt)

        # 4. 結果を解析して保存
        result = parse_llm_response(llm_response)
        save_check_result(item.check_id, document_id, result)
```

### フローチャート評価処理

以下は Python ですが、要件は TS です。

```python
def evaluate_flow(document_id, start_check_id):
    current_check_id = start_check_id
    path = []

    while True:
        # 現在の項目を取得
        current_item = get_check_item(current_check_id)
        path.append(current_item)

        # 結論に達したら終了
        if current_item.is_conclusion:
            return path

        # 結果を取得
        result = get_check_result(current_item.check_id, document_id)

        # 次の項目を決定
        flow_data = json.loads(current_item.flow_data)
        if result.result_value == "YES":
            current_check_id = flow_data["next_if_yes"]
        elif result.result_value == "NO":
            current_check_id = flow_data["next_if_no"]
        else:
            # 複数選択の場合
            option = result.result_value
            current_check_id = flow_data["next_options"][option]
```
