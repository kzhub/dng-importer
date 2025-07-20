# Photo Process

カメラのSDカードから指定日に撮影したDNGファイルをデスクトップにコピーするユーティリティ

## 概要

- SDカード内の指定日（デフォルト: 今日）に撮影されたDNGファイルを自動検索
- デスクトップにYYYYMMDD形式のフォルダを作成してコピー
- 既存ファイルは名前とサイズで重複チェック（同じファイルはスキップ）
- TypeScript製でテスト付き

## インストール方法

### 1. グローバルインストール（推奨）

```bash
# プロジェクトをビルド
yarn build

# グローバルにインストール）
npm install -g .
```

### 2. ローカル開発

```bash
# 依存関係をインストール
yarn install

# 開発環境で実行
yarn dev /Volumes/EOS_DIGITAL

# ビルドして実行
yarn build
yarn start /Volumes/EOS_DIGITAL
```

## 使い方

### グローバルインストール後

どのディレクトリからでも実行可能：

```bash
# 基本的な使い方（今日のファイル）
copy-dng /Volumes/EOS_DIGITAL

# 特定の日付のファイル
copy-dng /Volumes/EOS_DIGITAL -d 2024-03-15

# ヘルプ表示
copy-dng -h
```

### ローカル実行

```bash
# npxを使用（今日のファイル）
npx copy-dng /Volumes/EOS_DIGITAL

# npxを使用（特定の日付）
npx copy-dng /Volumes/EOS_DIGITAL -d 2024-03-15

# yarnを使用（今日のファイル）
yarn start /Volumes/EOS_DIGITAL

# yarnを使用（特定の日付）
yarn start -- -d 2024-03-15 /Volumes/EOS_DIGITAL
```

## オプション

- `<path>`: SDカードのパス（必須）
- `-p, --path <path>`: SDカードのパスを指定
- `-d, --date <date>`: 対象日付を指定（YYYY-MM-DD形式、デフォルト: 今日）
- `-h, --help`: ヘルプメッセージを表示

## 実行例

```bash
# Canon EOS Digitalカメラの場合（今日のファイル）
copy-dng /Volumes/EOS_DIGITAL

# 特定の日付のファイル
copy-dng /Volumes/EOS_DIGITAL -d 2024-03-15

# 一般的なSDカードの場合
copy-dng /Volumes/SD_CARD

# パスオプションを使用
copy-dng -p /Volumes/EOS_DIGITAL -d 2024-03-15
```

## 機能

- ✅ 指定日に撮影されたDNGファイルのみを対象（デフォルト: 今日）
- ✅ 再帰的にディレクトリを検索
- ✅ 重複ファイルのスキップ（名前+サイズで判定）
- ✅ 進行状況の表示
- ✅ エラーハンドリング
- ✅ 日付形式の検証

## 開発

```bash
# テスト実行
yarn test

# テスト（ウォッチモード）
yarn test:watch

# カバレッジ付きテスト
yarn test:coverage

# TypeScriptビルド
yarn build
```
