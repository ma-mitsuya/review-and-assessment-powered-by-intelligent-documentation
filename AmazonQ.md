## ディレクトリ構成

All TS プロジェクトです。

- cdk
  - package.json
- backend
  - package.json
- frontend (React SPA, tailwind css)
  - package.json

NOTE: root ディレクトリに package.json は存在しません。　 npm init で作成しないように。

## Instructions

- 実装の前に必ず計画書を markdown で作成します。Go と言われるまで実装は厳禁。いかなる場合も、良いと言われるまで勝手に実装を行ってはいけません。Multi turn で修正を指示した場合も同様です。
- 計画フェーズ
  - 計画書を作る際は必ず既存の実装をみてから作成すること。推測は厳禁。
  - 計画書には必ず、「新規作成するファイル」「修正するファイル」「削除するファイル」のパスを具体的に記載し、diff をわかりやすく提示すること。なお本質的な diff のみに絞り、不必要にファイル全てを書かないように。
- 実装フェーズ
  - 計画したファイル以外の修正は厳禁です。
  - 実装後、ビルドが通るかテストしてください。backend / frontend は`npm run build`, cdk は`cdk synth`です。
  - ビルドが通過したら、backend / frontend では`npm run format`を実行し、フォーマットしてください。
