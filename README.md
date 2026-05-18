# Astro Element List

`downloaded_site/elementlist.html` を元に、Astroでカテゴリ別のエレメントリストを生成します。

## 構成

- `src/components/categories/OneColumnElements.astro`: 1カラム用エレメント
- `src/components/categories/TwoColumnElements.astro`: 2カラム用エレメント
- `src/components/ElementCard.astro`: エレメント本体、ソースコード、コピー機能
- `src/elements/one-column/*.html`: 1カラム用エレメントのHTML断片
- `src/elements/two-column/*.html`: 2カラム用エレメントのHTML断片
- `src/data/*.js`: HTML断片を読み込むデータ定義
- `scripts/generate-elements.mjs`: 元HTMLからデータを再生成するスクリプト

## エレメントの追加

1カラム用に追加する場合は `src/elements/one-column/` に `.html` ファイルを追加します。

```html
<div class="c-unit">
  <div class="c-unit__inner">
    <section class="c-section--h2">
      <h2 class="e-h2--element" id="sample-element"># サンプルエレメント</h2>
      <div class="c-section__inner">
        ここにHTMLをそのまま貼り付けます。
      </div>
    </section>
  </div>
</div>
```

2カラム用に追加する場合は `src/elements/two-column/` に `.html` ファイルを追加します。

ファイル名の昇順で表示されます。順番を固定したい場合は `029-sample-element.html` のように番号を付けてください。画面上のタイトルは `.e-h2--element` のテキストから自動で取得されます。

## 使い方

このリポジトリには、npmが入っていないMacでも動かせるようにローカルNode.jsを `.tools/node` に配置しています。

```bash
./npmw install
./npmw run build
```

ビルド後は `dist/index.html` が出力されます。

ローカルサーバーで `dist` を表示:

```bash
./serve-dist.sh
```

表示URL:

```text
http://127.0.0.1:4322/
```

開発サーバー:

```bash
./npmw run dev
```

元HTMLを更新した場合:

```bash
./npmw run generate
```

このコマンドは `downloaded_site/elementlist.html` から `src/elements/.../*.html` を再生成します。手で追加したHTMLと同名のファイルがある場合は上書きされるため、追加分は新しい番号のファイル名にしてください。

## メモ

既存HTML内のパスは書き換えていません。`/common/css/common.css` などのルート相対パスを有効にする場合は、該当アセットを `public/common/...` のように配置してください。
