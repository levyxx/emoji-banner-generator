# 🎨 EmojTxT

テキストを絵文字バナーアートに変換するCLIツールです。

## ✨ 特徴

- 🔥 テキストを絵文字でビットマップ表示
- 📋 ワンクリックでクリップボードにコピー
- 💬 Slack Block Kit JSON形式での出力
- 🎨 GitHubコントリビューショングラフ風テーマ
- 🌈 複数絵文字でのグラデーション表示
- ↕️ 縦書きオプションで文字を積み上げ

## 📦 インストール

### npxで直接実行（推奨）

```bash
npx emjtxt "Hello" -e 🔥
```

### グローバルインストール

```bash
npm install -g emjtxt
emjtxt "Hello" -e 🔥
```

## 🚀 使い方

### 基本的な使い方

```bash
# 直接絵文字を指定
npx emjtxt "Hello" -e 🔥

# 絵文字エイリアスを使用（コロンあり/なし両対応）
npx emjtxt "World" -e fire
npx emjtxt "World" -e :fire:
```

### 背景絵文字を指定

```bash
# 背景を黒い四角で埋める
npx emjtxt "Hello" -e 🔥 -b ⬛

# 背景も絵文字エイリアスで指定可能
npx emjtxt "Hello" -e fire -b black_square
```

### クリップボードにコピー

```bash
# 生成結果をクリップボードにコピー
npx emjtxt "Copy Me" -e 🎉 --copy
```

### 複数の絵文字を使用

```bash
# カンマ区切りで複数指定
npx emjtxt "Rainbow" -e "🔴,🟠,🟡,🟢,🔵,🟣"

# エイリアスでも可能
npx emjtxt "Colors" -e "fire,star,gem,heart"
```

### 改行や縦書きでの表示

```bash
# 通常モードでは \n を書くと改行できます
npx emjtxt "Hello\nWorld" -e 🔥

# バックスラッシュ自体を描画したい場合は \\ と入力してください
npx emjtxt "C:\\Users\\you" -e ⭐

# 縦書きで1文字ずつ積み上げる
npx emjtxt "Vertical" -e 🔥 --vertical
```

### 絵文字モード

複数の絵文字を指定した場合の表示モードを選択できます：

```bash
# ランダム（デフォルト）
npx emjtxt "Random" -e "🔥,⭐,💎" -m random

# 行ごとに絵文字を変更
npx emjtxt "Rows" -e "🔴,🟠,🟡,🟢" -m row

# 列ごとに絵文字を変更
npx emjtxt "Cols" -e "🔴,🟠,🟡,🟢" -m column

# 行方向にグラデーション
npx emjtxt "Gradient" -e "🔴,🟠,🟡,🟢,🔵" -m row-gradient

# 列方向にグラデーション
npx emjtxt "Gradient" -e "🔴,🟠,🟡,🟢,🔵" -m column-gradient
```

### GitHubテーマ

```bash
# GitHubのコントリビューショングラフ風に表示
npx emjtxt "GitHub" --theme github
```

### ファイルからテキストを読み込み

```bash
# ファイルの内容をバナーに変換
npx emjtxt --file ./message.txt -e 📝
```

### Slack形式で出力

```bash
# Slack Block Kit JSON形式で出力
npx emjtxt "Slack" -e 🎉 --format slack
```

## ⚙️ オプション一覧

| オプション     | 短縮形 | 説明                                                 | デフォルト |
| -------------- | ------ | ---------------------------------------------------- | ---------- |
| `--emoji`      | `-e`   | 使用する絵文字（カンマ区切りで複数可）               | 🔥         |
| `--background` | `-b`   | 背景の絵文字                                         | 空白       |
| `--file`       | `-f`   | テキストを読み込むファイルパス                       | -          |
| `--copy`       | `-c`   | クリップボードにコピー                               | false      |
| `--format`     | -      | 出力形式（text, slack）                              | text       |
| `--theme`      | -      | テーマ（default, github）                            | default    |
| `--mode`       | `-m`   | 絵文字選択モード                                     | random     |
| `--vertical`   | -      | 縦書きで表示（1文字ずつ改行）                        | false      |
| `--border`     | -      | 外枠を付ける（絵文字省略時は背景と同じ絵文字を使用） | -          |
| `--font`       | -      | 使用するピクセルフォント名                           | block      |
| `--help`       | `-h`   | ヘルプを表示                                         | -          |
| `--version`    | `-V`   | バージョンを表示                                     | -          |

## 🎨 絵文字選択モード

| モード            | 説明                             |
| ----------------- | -------------------------------- |
| `random`          | 各ドットにランダムな絵文字を配置 |
| `row`             | 行ごとに異なる絵文字を使用       |
| `column`          | 列ごとに異なる絵文字を使用       |
| `row-gradient`    | 行方向にグラデーション           |
| `column-gradient` | 列方向にグラデーション           |

## 🔧 開発

### 開発環境のセットアップ

```bash
git clone https://github.com/yourusername/emjtxt.git
cd emjtxt
npm install
```

### 開発モードで実行

```bash
npm run dev -- "Hello" -e 🔥
```

### ビルド

```bash
npm run build
```

## 📄 ライセンス

MIT
