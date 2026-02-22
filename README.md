# URLclickable (画像内URL抽出ツール)

このリポジトリには、以下の3ファイルで動くシンプルなWebアプリが含まれています。

- `index.html`
- `script.js`
- `styles.css`

## まず「ファイルが本当にあるか」を確認する

```bash
pwd
ls -la
```

`index.html` / `script.js` / `styles.css` が表示されればOKです。

## 起動手順

```bash
cd /workspace/URLclickable
python3 -m http.server 4173
```

ブラウザで `http://localhost:4173` を開いてください。

## よくあるハマりどころ

### 1) `cd: no such file or directory` が出る

`cd` に失敗したまま次の `python3 -m http.server` を実行すると、
**現在地の別フォルダ**が配信され、ディレクトリ一覧だけが表示されます。

対処:

```bash
pwd
cd /workspace/URLclickable
pwd
ls -la
```

で場所を確認してから起動してください。

### 2) `favicon.ico 404`

これは多くの静的サイトで出る通常ログで、基本的に問題ありません。

## Git から取り込む場合（別環境で作業しているとき）

作業ディレクトリで最新コミットを取り込んでください。

```bash
git status
git log --oneline -n 3
git pull
```

もしリポジトリ自体がない環境なら、先に clone が必要です。
