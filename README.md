# Novel AI Auto

## about
Novel AI の画像生成のプロンプトの調整を快適にし、画像生成を自動で連続して実行するためのWebUIです。

https://github.com/secchan-eros/novel-ai-auto/assets/89858849/e1eb6eeb-b17e-4e1e-b673-4015e02daf4f

## 使い方

### Novel AI トークンの取得
![image](https://github.com/secchan-eros/novel-ai-auto/assets/89858849/f2b5afa4-904d-4a9e-a5f8-8c78381704fc)

トークンを取得し、.envファイルをルートに作成して以下のように設定します。

```ini
NUXT_PUBLIC_NOVELAI_TOKEN={{トークン}}
```

### パッケージインストール

```
npm i
```

### 起動

```
npm run dev
```

もしくは

```
npm run build && npm run start
```
