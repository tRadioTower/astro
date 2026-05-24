# Storybook Element List

HTMLエレメントをStorybookで確認・共有するための制作環境です。

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

または:

```bash
npm run storybook
npm start
```

表示URL:

```text
http://127.0.0.1:6006/
```

この状態で `src/elements/**/*.html` や `src/styles/element-list.css` を編集すると、Storybookの画面に自動で反映されます。新しい `.html` ファイルを追加した場合も、通常は自動で再読み込みされます。反映されない場合はブラウザをリロードしてください。

Storybook上では `Element List` の中に以下の表示があります。

- `すべて`
- `1カラム用`
- `2カラム用`

## エレメントの追加

1カラム用に追加する場合:

```text
src/elements/one-column/
```

2カラム用に追加する場合:

```text
src/elements/two-column/
```

例:

```text
src/elements/two-column/030-new-button.html
```

HTMLはそのまま貼り付けできます。

```html
<div class="c-unit">
  <div class="c-unit__inner">
    <section class="c-section--h2">
      <h2 class="e-h2--element" id="new-button"># 新しいボタン</h2>
      <div class="c-section__inner">
        <a href="#DUMMY" class="e-btn"><span class="e-btn__txt">ボタン</span></a>
      </div>
    </section>
  </div>
</div>
```

ファイル名の昇順で表示されます。順番を固定したい場合は `030-new-button.html` のように番号を付けてください。画面上のタイトルは `.e-h2--element` のテキストから自動で取得されます。

## 共有用にビルド

共有用ファイルを作るときだけ実行します。ローカル編集中は `npm run dev` を使ってください。

```bash
npm run build
```

Storybookの静的ファイルが `storybook-static/` に出力されます。

ビルド済みStorybookをローカルで確認:

```bash
npm run serve
```

表示URL:

```text
http://127.0.0.1:6007/
```

`6007` が埋まっている場合は、自動で次の空きポートにずれます。

## 元HTMLから再生成

`downloaded_site/elementlist.html` から `src/elements/.../*.html` を再生成する場合:

```bash
npm run generate
```

手で追加したHTMLと同名のファイルがある場合は上書きされます。追加分は新しい番号のファイル名にしてください。

## CSSと画像

既存HTML内のパスは書き換えていません。`/common/css/common.css` などのルート相対パスを有効にする場合は、該当アセットを `public/common/...` に置くか、ローカルの `downloaded_site/` に置いてください。

`downloaded_site/` はGit管理対象外です。
