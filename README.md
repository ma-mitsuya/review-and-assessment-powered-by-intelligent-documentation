# BEACON (Building & Engineering Approval Compliance Navigator)

BEACON は、不動産業界向けの AI ドキュメント適合性チェックシステムです。マルチモーダル LLM を活用して、申請書類や契約書が規制やチェックリストに適合しているかを自動的に確認します。

## ハイレベルアーキテクチャ

docs/BEACON-real-estate.xml 参照

## 残タスク

### checkリストの新規作成
- チェックリストの「新規作成」ボタンをクリックすると、ファイルアップロード画面が出る
- S3 presigned url使って、`DocumentBucketName`でCfn出力されているバケットの、`getOriginalDocumentKey`で構成されるパスにアップロード
- ドキュメントは複数アップロードできる
- それぞれのドキュメントに対して、`getOriginalDocumentKey`が個々紐づく
- アップロード完了したら、`DocumentPageProcessor`で定義されているSFnが自動で実行される
- 処理のステータスはschema.prismaのDocumentで管理される
- 画面にはそのステータスを表示する
  - チェックリストセット一覧にステータス（処理中、完了など）が表示される
- 必要なAPIがなければ実装 


### JSON で抽出タスク

- 

{
"checklist_items": [
{
"name": "建築物と敷地の関係の適切性確認",
"description": "建築物と敷地の関係が適切かどうか確認する",
"parent_id": null,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "用途上の可分・不可分",
"description": "敷地に複数の建築物を建築する場合（既存建築物を含む）、相互の建築物が機能上関連しているか",
"parent_id": 1,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "敷地面積の算定",
"description": "敷地面積の算定が適切に行われているか確認する",
"parent_id": 1,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "2 項道路との接続",
"description": "2 項道路と接している場合、後退部分の面積を敷地面積から除いているか",
"parent_id": 3,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "計画道路の取り扱い",
"description": "敷地内にある計画道路は、敷地面積に算入できる。法第 42 条第 1 項第 4 号による道路は除く",
"parent_id": 3,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "角敷地のすみ切り部分",
"description": "角敷地のすみ切り部分を敷地面積から除外するが、条例等で算入できる場合を定めている（東京都等）",
"parent_id": 3,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "面積の算定方法の適切性確認",
"description": "面積の算定方法が適切かどうか確認する",
"parent_id": null,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "建築面積の算定",
"description": "外壁又はこれに代わる柱の中心線で囲まれた部分の水平投影面積として算定しているか",
"parent_id": 7,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "地階部分の不算入",
"description": "地階で地盤面上 1 ｍ以下にある部分は建築面積に算入しない",
"parent_id": 8,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "軒・ひさし等の処理",
"description": "軒、ひさし等で 1 ｍ以上突き出しているものがある場合、その先端から 1 ｍ後退した線で囲まれた部分を算入する",
"parent_id": 8,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "高い開放性を有する部分",
"description": "高い開放性を有する建築物又はその部分の場合、その端から水平距離 1 ｍ以内の部分は算入しない",
"parent_id": 8,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "床面積の算定",
"description": "床面積の算定方法に基づき算定しているか",
"parent_id": 7,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "高さ等の算定方法の適切性確認",
"description": "高さ等の算定方法が適切かどうか確認する",
"parent_id": null,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "道路斜線制限の場合の高さ算定",
"description": "道路斜線制限における高さの算定が適切か",
"parent_id": 13,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "前面道路の路面中心線からの測定",
"description": "前面道路の路面の中心線から測っているか",
"parent_id": 14,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "後退緩和適用時の測定",
"description": "後退緩和適用時、後退距離の算定から除く物置等は前面道路の路面の中心線から測っているか",
"parent_id": 14,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "塔屋の不算入部分",
"description": "塔屋がある場合の不算入部分は適切か",
"parent_id": 14,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "隣地斜線制限等の場合の高さ算定",
"description": "隣地斜線制限及び高度地区の北側斜線以外の場合の高さ算定が適切か",
"parent_id": 13,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "地盤面からの測定",
"description": "地盤面から測っているか",
"parent_id": 18,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "塔屋の不算入部分",
"description": "塔屋がある場合の不算入部分は適切か",
"parent_id": 18,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "北側斜線制限等の場合の高さ算定",
"description": "北側斜線制限、高度地区の北側斜線制限及び避雷設備の設置の場合の高さ算定が適切か",
"parent_id": 13,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "地盤面からの測定",
"description": "地盤面から測っているか",
"parent_id": 21,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "塔屋の算入",
"description": "塔屋を含め算定しているか",
"parent_id": 21,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "低層住居専用地域等の場合の高さ算定",
"description": "第 1 種・第 2 種低層住居専用地域又は田園住居地域内の絶対高さ制限及び日影規制の場合の高さ算定が適切か",
"parent_id": 13,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "地盤面からの測定",
"description": "地盤面から測っているか",
"parent_id": 24,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "塔屋の不算入部分",
"description": "塔屋がある場合の不算入部分は適切か",
"parent_id": 24,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "軒の高さの算定",
"description": "軒の高さの算定が適切か",
"parent_id": 13,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "地盤面からの測定",
"description": "地盤面から測っているか",
"parent_id": 27,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "軒の高さの計測位置",
"description": "小屋組又はこれに代わる横架材を支持する壁、敷げた又は柱の上端までの高として算定しているか",
"parent_id": 27,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "階数の算定方法の適切性確認",
"description": "建築物の一部が吹抜けとなっている場合等、階数が最大のところで算定しているか",
"parent_id": null,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "昇降機塔等の不算入",
"description": "昇降機塔等の水平投影面積が建築面積の 1/8 以下であれば算入しない",
"parent_id": 30,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "地盤面の算定方法の適切性確認",
"description": "地盤面の算定方法が適切かどうか確認する",
"parent_id": null,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "地盤面の算定",
"description": "建築物が周囲の地面と接する位置の平均の高さにおける水平面としているか（建築物単位）",
"parent_id": 32,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "高低差がある場合の算定",
"description": "高低差が 3 ｍを超える場合は、その高低差 3 ｍ以内ごとの平均の高さにおける水平面としているか",
"parent_id": 33,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "平均地盤面の算定",
"description": "日影規制の場合、高低差 3 ｍに関係なく建築物が周囲の地面と接する位置の平均の高さとして算定しているか（敷地単位）",
"parent_id": 32,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "建築物が周囲の地面と接する位置",
"description": "建築物が周囲の地面と接する位置の特定が適切か",
"parent_id": 32,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "中心線の基準",
"description": "建築物本体の外壁又はこれに代わる柱の中心線を結んだ位置としているか",
"parent_id": 36,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "外壁面での算定",
"description": "外壁等の面において算定する方が妥当の場合、中心線ではなく外壁の面とすることができる",
"parent_id": 36,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "特殊な場合の確認",
"description": "特殊な場合（ドライエリア等）、取扱いを確認しているか",
"parent_id": 36,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "耐火建築物・準耐火建築物等の構造の適切性確認",
"description": "耐火建築物・準耐火建築物等の構造が適切かどうか確認する",
"parent_id": null,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "耐火建築物の要件",
"description": "耐火建築物としての要件を満たしているか",
"parent_id": 40,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "主要構造部の耐火性能",
"description": "主要構造部が耐火構造又は耐火建築物の主要構造部に関する技術基準に適合するものであるか",
"parent_id": 41,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "延焼のおそれのある部分の防火設備",
"description": "外壁の開口部で延焼のおそれのある部分に防火設備を設けているか",
"parent_id": 41,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "準耐火建築物の要件",
"description": "準耐火建築物としての要件を満たしているか",
"parent_id": 40,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "準耐火建築物（イ）の要件",
"description": "準耐火建築物（イ）としての要件を満たしているか",
"parent_id": 44,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "主要構造部の準耐火性能",
"description": "主要構造部が準耐火構造であるか",
"parent_id": 45,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "延焼のおそれのある部分の防火設備",
"description": "外壁の開口部で延焼のおそれのある部分に防火設備を設けているか",
"parent_id": 45,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "準耐火建築物（ロ-1）の要件",
"description": "準耐火建築物（ロ-1）としての要件を満たしているか",
"parent_id": 44,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "外壁と屋根の性能",
"description": "外壁が耐火構造であるか、屋根は不燃材料等であるか",
"parent_id": 48,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "屋根の延焼のおそれのある部分",
"description": "屋根の延焼のおそれのある部分が法 86 条の 4 の場合を除き準耐火構造等であるか",
"parent_id": 48,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "延焼のおそれのある部分の防火設備",
"description": "外壁の開口部で延焼のおそれのある部分に防火設備を設けているか",
"parent_id": 48,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "準耐火建築物（ロ-2）の要件",
"description": "準耐火建築物（ロ-2）としての要件を満たしているか",
"parent_id": 44,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "主要構造部の柱・はりの性能",
"description": "主要構造部の柱及びはりが不燃材料であるか、主要構造部の壁、階段が準不燃材料であるか",
"parent_id": 52,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "延焼のおそれのある部分の外壁",
"description": "外壁の延焼のおそれのある部分にあっては、防火構造であるか",
"parent_id": 52,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "屋根と床の性能",
"description": "屋根は、不燃材料又は大臣が認めて指定したものであるか、床は、準不燃材料で造られているか",
"parent_id": 52,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "3 階以上の階における床",
"description": "3 階以上の階における床は、準耐火構造等であるか",
"parent_id": 52,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "延焼のおそれのある部分の防火設備",
"description": "外壁の開口部で延焼のおそれのある部分に防火設備を設けているか",
"parent_id": 52,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "法第 21 条の規定に適合する建築物の要件",
"description": "法第 21 条の規定に適合する建築物の要件を満たしているか",
"parent_id": 40,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "建物規模に応じた主要構造部の性能",
"description": "建物の規模により主要構造部が適切な構造になっているか",
"parent_id": 58,
"item_type": "FLOW",
"is_conclusion": false,
"flow_data": {
"condition_type": "MULTI_CHOICE",
"next_options": {
"規模の制限無し（耐火構造）": 60,
"規模の制限無し（火災時倒壊防止構造）": 61,
"地階を除く 4 階以下": 62,
"地階を除く 3 階以下": 63,
"地階を除く 2 階以下": 64
}
}
},
{
"name": "耐火構造（規模制限なし）",
"description": "主要構造部が耐火構造（耐火検証法も可）になっているか",
"parent_id": 59,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "火災時倒壊防止構造（規模制限なし）",
"description": "主要構造部が火災時倒壊防止構造になっているか",
"parent_id": 59,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "4 階以下の構造",
"description": "地階を除く 4 階以下の建物で主要構造部が 75 分間準耐火構造＋ 90 分間準耐火構造（階段室の壁）になっているか",
"parent_id": 59,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "3 階以下の構造",
"description": "地階を除く 3 階以下の建物で主要構造部が 1 時間準耐火基準の準耐火構造になっているか",
"parent_id": 59,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "2 階以下の構造",
"description": "地階を除く 2 階以下の建物で主要構造部が令第 115 条の 2 第 1 項の所定の基準の構造になっているか",
"parent_id": 59,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "その他の基準適合確認",
"description": "上記以外の所定の基準を満たしているか",
"parent_id": 58,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "法第 27 条第 1 項の規定に適合する建築物の要件",
"description": "法第 27 条第 1 項の規定に適合する建築物の要件を満たしているか",
"parent_id": 40,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "主要構造部等の性能",
"description": "主要構造部等が適切な構造で、他所定の基準を満たしているか",
"parent_id": 66,
"item_type": "FLOW",
"is_conclusion": false,
"flow_data": {
"condition_type": "MULTI_CHOICE",
"next_options": {
"避難時倒壊防止構造＋特定用途": 68,
"準耐火構造（45 分、ロ-1、ロ-2）＋所定床面積": 69,
"準耐火構造（1 時間準耐火基準）＋特定用途": 70,
"耐火構造": 71
}
}
},
{
"name": "避難時倒壊防止構造",
"description": "避難時倒壊防止構造＋自力避難困難者が使用する用途以外の用途、他所定の基準を満たすもの",
"parent_id": 67,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "準耐火構造（45 分等）",
"description": "準耐火構造（45 分、ロ-1、ロ-2）＋用途に供する部分が所定の床面積以上であるもの等",
"parent_id": 67,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "準耐火構造（1 時間基準）",
"description": "準耐火構造（1 時間準耐火基準）＋木造 3 階共同住宅・学校等の用途、他所定の基準を満たすもの",
"parent_id": 67,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "耐火構造",
"description": "耐火構造（耐火検証法も可）",
"parent_id": 67,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
},
{
"name": "防火設備の設置",
"description": "延焼のおそれのある部分及び他の外壁開口部から火炎が到達するおそれのある部分の開口部に防火設備（片面 20 分間（屋内への遮炎性））を設けているか",
"parent_id": 66,
"item_type": "SIMPLE",
"is_conclusion": false,
"flow_data": null
}
],
"meta_data": {
"document_id": "test3",
"page_number": 1
}
}

#### チェックリスト作成の修正

- backend/src/features/result-combining/combine-results.ts 作りなおし。
- JSON 　で出力する
- 実際の Bedrock(Claude Sonnet 3.7)をコールする integ test も実装すること

#### フロントエンド

###### チェックリスト管理

- backend の現在のチェックリスト関連の定義を確認し、現在未実装のチェックリスト管理画面を完成させよ
  - チェックリストセット詳細の確認、編集、削除
  - チェックリストセットの新規作成
  - チェックリストの確認
  - etc
- 不足なエンドポイントや、定義に不備があれば実装せずに報告せよ

#### 実装すべきエンドポイント

###### チェックリストセット管理

1. **チェックリストセットの取得**

   - 全てのチェックリストセットを一覧表示するエンドポイント

2. **チェックリストセットの作成**

   - 新しいチェックリストセットを作成するエンドポイント
   - 名前や説明などの基本情報を含める

3. **チェックリストセットの更新・削除**
   - 既存のチェックリストセットを編集・削除するエンドポイント

###### チェックリスト項目管理

4. **チェックリスト項目の取得**

   - 指定されたセットに属するチェック項目を階層構造で取得
   - item_type に基づいて適切にフォーマットされたデータを返す

5. **チェックリスト項目の作成・編集**
   - 新しいチェック項目の追加や既存項目の編集
   - フロー型と単純チェック型の両方をサポート

###### ファイル管理

6. **ファイルのアップロード**

   - 契約書や Excel ファイルなどのアップロード処理
   - 対応するチェックリストセットとの関連付け

7. **ファイルの一覧取得**
   - チェックリストセットごとのファイル一覧表示
   - ファイルのメタデータを含む

###### LLM 処理と結果管理

8. **文書の LLM 分析**

   - アップロードされたファイルを LLM で分析し、チェックリスト項目と照合
   - 抽出されたテキストや適合性判断を返す

9. **LLM 分析結果の取得**

   - 特定のドキュメントに対する LLM 分析結果を取得
   - 適合/不適合項目の一覧やフロー判断の結果を含む

10. **分析結果の修正**
    - LLM が判断した結果をユーザーが修正するためのエンドポイント
    - 修正履歴の保存と追跡

###### フロー評価

11. **フローチャート評価の実行**

    - 特定のドキュメントに対し、フローチャート型のチェックリストを評価
    - 最初の項目から開始して、LLM 判断に基づき分岐をたどる

12. **フロー評価結果の視覚化データ取得**
    - フローチャート評価の結果を視覚的に表示するためのデータを取得
    - たどったパスや最終結論を含む

###### ユーザー管理

13. **操作履歴の取得**
    - ユーザーごとの操作履歴や修正履歴の取得

### combine-result の修正

- ドキュメント ID とページナンバーを出力させる
  - LLM ではなく TS で
  - meta_data (json) atrribute で表現

```json
"meta_data": {
   "document_id": "xxx",
   "page_number": 123
}
```

- csv から json へ変更
- モデルは Sonnet 3.7
