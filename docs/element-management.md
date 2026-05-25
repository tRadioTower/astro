# エレメントリスト更新マニュアル

## 仕組み

このプロジェクトでは、エレメントを「カテゴリファイル」と「template単位」で管理します。

```text
src/elements/01-foundation.html  -> 基本要素
src/elements/02-layout.html      -> レイアウト
src/elements/03-navigation.html  -> ナビゲーション
src/elements/04-actions.html     -> アクション
src/elements/05-content.html     -> コンテンツ
src/elements/06-data-table.html  -> 表・データ
src/elements/07-media.html       -> メディア・ロゴ
src/elements/08-notice.html      -> 注意・ステップ
src/elements/99-sandbox.html     -> 検証・一時置き場
```

Astroは `src/elements/*.html` を読み込み、各ファイル内の `<template>` を1つのエレメントとして一覧に表示します。各エレメントには次の3つが自動で付きます。

- エレメント本体のプレビュー
- エレメントのソースコード
- クリップボードへコピーするボタン

## 通常の更新手順

1. 開発サーバーを起動します。

```bash
npm run dev
```

2. ブラウザで確認します。

```text
http://127.0.0.1:4321/
```

3. 追加したいカテゴリのHTMLファイルを開きます。

4. ファイル末尾に `<template>` を追加します。

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
</template>
```

5. 保存すると、開発サーバーが自動的に再ビルドし、ブラウザへ反映します。

## templateの書き方

```html
<template>
  <!-- ここに貼り付けたHTMLがプレビューになります -->
  <script type="text/plain" data-element-copy>
<!-- ここに貼り付けたHTMLがソースコード表示とコピー対象になります -->
  </script>
</template>
```

通常は `<template>` に属性を書く必要はありません。タイトルやIDも手入力しません。

プレビュー用のHTMLと、実際にCMSへ貼り付けたいHTMLは分けて考えます。コピー対象のHTMLは、`<script type="text/plain" data-element-copy>` にそのまま書きます。この中では `"` や `<` を実体参照文字に変換する必要はありません。

```html
<template>
  <h2 class="e-h2--element"># リード文</h2>
  <div class="m-lead">
    <p class="e-txt--lead">リード文テキスト</p>
  </div>
  <script type="text/plain" data-element-copy>
<p class="e-txt--lead">リード文テキスト</p>
  </script>
</template>
```

画面に表示されるタイトルは、見出し、`code`内のクラス名、コピー用HTMLのクラス名やテキストから自動取得されます。

エレメントのIDはタイトルから自動生成されます。同じIDがある場合は自動で連番が付きます。

## カテゴリの選び方

- 基本要素: 見出し、本文、リスト、リンク、アイコン、タグ
- レイアウト: グリッド、枠、余白確認、配置確認
- ナビゲーション: タブ、ページネーション、アンカーリンク、下層リンク、サイドナビ
- アクション: ボタン、検索ボックス、CV、問い合わせ導線
- コンテンツ: ニュース、関連リンク、サービス一覧、バナー
- 表・データ: テーブル、帳票ダウンロード、手数料表
- メディア・ロゴ: ロゴ一覧、画像系パーツ
- 注意・ステップ: 注意文、ステップ、フロー
- 検証・一時置き場: まだ分類が決まっていないもの、作業中のもの

迷った場合は `99-sandbox.html` に置き、後で正式カテゴリに移動してください。

## 新しいカテゴリを追加する場合

1. `src/elements/09-new-category.html` のように番号付きでファイルを追加します。

2. 中身は次の形式にします。

```html
<!--
  category: 新しいカテゴリ名
  usage: Add one template block per element. Preview HTML goes in template, copy HTML goes in data-element-copy.
-->

<template>
  <div class="c-unit">
    <div class="c-unit__inner">
      <section class="c-section--h2">
        <h2 class="e-h2--element" id="sample"># Sample</h2>
        <div class="c-section__inner">
          <div>Sample</div>
        </div>
      </section>
    </div>
  </div>
  <script type="text/plain" data-element-copy>
<div>Sample</div>
  </script>
</template>
```

3. 表示名を日本語で固定したい場合は、`src/data/createElements.js` の `CATEGORY_TITLES` にIDと表示名を追加します。

```js
const CATEGORY_TITLES = {
  foundation: "基本要素",
  // ...
  "new-category": "新しいカテゴリ名"
};
```

ファイル名の数字が表示順になります。

## 探し方

一覧上部の検索欄は、タイトル、見出しID、カテゴリ名、HTML内のテキストを対象にします。タグを入力・管理する必要はありません。

左側のサイドナビから、カテゴリまたは個別エレメントへ直接移動できます。検索中は、該当しないエレメントとサイドナビ項目も非表示になります。

## 自動分解のルール

`npm run generate` は、元HTMLの大きなエレメントをできるだけコピーしやすい小さな単位へ分解します。

- Link: 本文内リンク、同タブリンク、別タブリンク、PDFリンク、ZIPリンク、ページ内リンク、アラートリンク
- Button: 塗りボタン、枠線ボタン、白ボタン、白枠ボタン、別タブボタンなど
- Navigation: 下層リンク、画像付きリンク、2カラムリンクを各項目ごとに分解
- Content: サービス、ニュース、関連リンクを項目または小見出しごとに分解
- Data Table: 帳票ダウンロード行、テーブルの表示パターン、金融機関テーブル列を分解
- Media: ロゴ付き、ロゴなしの提携先項目を分解
- Notice / Step: 注意枠やステップ表示のバリエーションごとに分解
- Utilities: `common.css` から `.u-` で始まるクラスを抽出し、余白・幅・文字色・レイアウト・その他に分類

分解ルールを変えたい場合は `scripts/generate-elements.mjs` の `splitElement()` に条件を追加します。

ユーティリティクラスは `scripts/generate-elements.mjs` の `createUtilityCategories()` で生成します。各カードのコピーボタンは、HTML全体ではなく `class="u-..."` をコピーします。

## ビルドと共有

静的HTMLを書き出します。

```bash
npm run build
```

出力先:

```text
dist/index.html
```

ビルド済みファイルをローカルサーバーで確認します。

```bash
npm run serve:dist
```

表示URL:

```text
http://127.0.0.1:4322/
```

## 元HTMLから再生成する場合

`downloaded_site/elementlist.html` からカテゴリファイルを作り直す場合は、次を実行します。

```bash
npm run generate
```

このコマンドは `src/elements/01-*.html` から `08-*.html` を上書きします。手作業で追加したエレメントを消したくない場合は、先に別ファイルへ移すか、`99-sandbox.html` に退避してください。
