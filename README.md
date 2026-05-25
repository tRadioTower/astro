# Astro Element List

HTMLエレメントをAstroで確認・共有するための制作環境です。

## 必要なもの

Node.jsとnpmを事前にインストールしてください。

## セットアップ

```bash
npm install
```

## ローカルで編集・確認

```bash
npm run dev
```

表示URL:

```text
http://127.0.0.1:4321/
```

`npm start` と `npm run serve` も同じ開発サーバーを起動します。起動したまま `src/elements/*.html`、CSS、Astroコンポーネントを編集すると、自動的に再ビルドされブラウザへ反映されます。

## エレメントの管理方法

エレメントはカテゴリごとのHTMLファイルにまとめています。

```text
src/elements/
  01-foundation.html
  02-layout.html
  03-navigation.html
  04-actions.html
  05-content.html
  06-data-table.html
  07-media.html
  08-notice.html
  09-utilities-spacing.html
  10-utilities-width.html
  11-utilities-type.html
  12-utilities-layout.html
  13-utilities-other.html
  99-sandbox.html
```

各ファイルの中に `<template>` を追加すると、一覧画面に1エレメントとして表示されます。

```html
<template>
  <div class="c-unit">
    <div class="c-unit__inner">
      <section class="c-section--h2">
        <h2 class="e-h2--element" id="primary-button"># Primary Button</h2>
        <div class="c-section__inner">
          <a href="#DUMMY" class="e-btn"><span class="e-btn__txt">ボタン</span></a>
        </div>
      </section>
    </div>
  </div>
  <script type="text/plain" data-element-copy>
<a href="#DUMMY" class="e-btn"><span class="e-btn__txt">ボタン</span></a>
  </script>
</template>
```

- `<template>` の中身: プレビュー表示
- `<script type="text/plain" data-element-copy>` の中身: ソースコード表示、コピーボタンのコピー対象
- タイトル: 見出し、`code`内のクラス名、コピー用HTMLなどから自動取得
- ID: タイトルから自動生成。同じIDがある場合は自動で連番化

詳しい更新手順は [docs/element-management.md](docs/element-management.md) を参照してください。

## ビルド

共有用の静的HTMLを書き出す場合:

```bash
npm run build
```

ビルド後は `dist/index.html` が出力されます。

ビルド済みの `dist` をローカルサーバーで確認:

```bash
npm run serve:dist
```

表示URL:

```text
http://127.0.0.1:4322/
```

`4322` が埋まっている場合は、自動で次の空きポートにずれます。

Astro標準のプレビューを使う場合:

```bash
npm run preview
```

## 元HTMLから再生成

`downloaded_site/elementlist.html` からカテゴリファイルを再生成する場合:

```bash
npm run generate
```

`src/elements/01-*.html` から `08-*.html` は上書きされます。手作業で追加した検証用エレメントは `src/elements/99-sandbox.html` か、新しいカテゴリファイルに分けておくと安全です。

再生成時は、まとまっているエレメントをコピーしやすい小さなパーツへ自動分解します。たとえばリンクは同タブリンク、別タブリンク、PDFリンク、ZIPリンク、ページ内リンクなどに分かれます。

また、`downloaded_site/common/css/common.css` から `.u-` で始まるユーティリティクラスを抽出し、余白・幅・文字色・レイアウト・その他のカテゴリへ追加します。ユーティリティのコピーボタンは `class="u-..."` をコピーします。

## CSSと画像

既存HTML内のパスは書き換えていません。`/common/css/common.css` は `public/common/css/common.css` に配置しています。

`downloaded_site/` はGit管理対象外です。
