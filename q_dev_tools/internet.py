#!/usr/bin/env python3
import argparse
import json
import os
import sys

from firecrawl.firecrawl import FirecrawlApp


def main():
    parser = argparse.ArgumentParser(description="インターネット検索を行うツール")
    parser.add_argument("query", help="検索クエリ")
    parser.add_argument(
        "--limit", type=int, default=10, help="検索結果の最大数 (デフォルト: 10)"
    )
    parser.add_argument("--lang", default="en", help="検索言語/国 (デフォルト: en)")
    parser.add_argument(
        "--only-main-content",
        action="store_true",
        help="メインコンテンツのみをスクレイプ",
    )
    parser.add_argument("--output", help="結果を保存するJSONファイルパス")

    args = parser.parse_args()

    api_key = os.environ.get("FIRECRAWL_API_KEY")
    if not api_key:
        print(
            "エラー: 環境変数 'FIRECRAWL_API_KEY' が設定されていません。", file=sys.stderr
        )
        sys.exit(1)

    try:
        app = FirecrawlApp(api_key=api_key)

        # 検索オプションの設定
        search_options = {
            "limit": args.limit,
            "lang": args.lang,
            "scrapeOptions": {
                "formats": ["markdown"],
                "onlyMainContent": args.only_main_content,
            },
        }

        # 検索の実行
        print(f"検索クエリ: {args.query}")
        print(f"検索オプション: {search_options}")
        response = app.search(args.query, search_options)
        
        # FirecrawlAppの戻り値はdictで、実際の結果はdata配列に含まれる
        if not isinstance(response, dict) or 'data' not in response:
            print("エラー: 予期しない応答形式です", file=sys.stderr)
            sys.exit(1)
            
        results = response.get('data', [])

        # 結果の表示
        print(f"\n検索結果: {len(results)} 件見つかりました\n")
        for i, result in enumerate(results, 1):
            print(f"結果 {i}:")
            print(f"タイトル: {result.get('title', 'タイトルなし')}")
            print(f"URL: {result.get('url', 'URLなし')}")
            print(f"説明: {result.get('description', 'スニペットなし')}")
            print("-" * 80)

        # 結果の保存（指定された場合）
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
            print(f"結果を {args.output} に保存しました")

    except Exception as e:
        print(f"エラーが発生しました: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
