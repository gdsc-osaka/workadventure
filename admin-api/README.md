# WorkAdventure セルフホスト用 Admin API

WorkAdventure は素のセルフホスト構成だと、Woka（アバター）・表示名・コンパニオンをブラウザの
`localStorage` にしか保存しません。そのため別デバイス／別ブラウザでログインするとアバターを選び直しになります。

このワークスペースは、pusher が `ADMIN_API_URL` 経由で呼び出す Admin API を実装し、
それら 3 つを **サーバー側（SQLite）にユーザー単位でグローバルに** 永続化することで、
デバイス間で同期されるようにします。WorkAdventure 本体（`play/` / `back/`）には一切手を入れていません。

## 前提条件

- **OIDC ログインが必須です。** 同期の分岐は pusher 側で `accessToken` の有無（＝ログイン済みか）で
  守られているため、匿名ユーザーは対象外です（匿名ユーザーの UUID 自体がブラウザローカルなので原理的に同期できません）。
- `ADMIN_API_URL` を設定すると pusher は `LocalAdmin` を完全にバイパスします。そのため
  `/api/map` や `/api/room/access` もこの API が返す必要があり、すべて実装済みです。

## 起動順序に関する注意（重要）

`play` は起動処理の中で `GET /api/capabilities` が 200 を返すまで**無限にリトライし、成功するまで
HTTP ポートを listen しません**。つまり:

- `admin-api` を先に起動してください。
- `admin-api` を再起動・再デプロイした場合、`play` が落ちていたなら `admin-api` の復旧後に `play` を起動します。
- `/api/capabilities` は認証不要で 200 を返す必要があります（pusher は Authorization ヘッダーを付けません）。

## 有効化

`.env` で以下を設定します。

```
ADMIN_API_URL=http://admin-api:3000
ADMIN_API_TOKEN=<pusher と共有する秘密トークン>
```

開発用 `docker-compose.yaml` には `admin-api` サービスを追加済みです。

```bash
docker compose up -d admin-api
curl -s http://localhost:3000/api/capabilities   # 200 が返ることを確認してから play を起動
```

本番向けイメージは**リポジトリルート**をビルドコンテキストにしてください（npm workspaces 全体が必要です）。

```bash
docker build -f admin-api/Dockerfile -t workadventure-admin-api .
```

## 環境変数

| 変数 | デフォルト | 意味 |
|---|---|---|
| `ADMIN_API_PORT` | `3000` | リッスンポート |
| `ADMIN_API_TOKEN` | **必須** | pusher の `ADMIN_API_TOKEN` と同じ値にする |
| `ADMIN_API_DB_PATH` | `./data/profiles.sqlite` | SQLite ファイルのパス（親ディレクトリは自動作成） |
| `WOKA_DATA_DIR` | `<repo>/play/src/pusher/data` | `woka.json` / `companions.json` の置き場所 |
| `PUBLIC_MAP_STORAGE_URL` | `""` | `/~/…` の `wamUrl` 生成に使用 |
| `START_ROOM_URL` | `/_/global/maps.workadventure.localhost/tests/E2E/empty.json` | `/` へのアクセス時のリダイレクト先 |
| `DISABLE_ANONYMOUS` | `false` | `/api/map` の `authenticationMandatory` になる |
| `ENABLE_MAP_EDITOR` | `false` | マップエディタの可否（`canEdit`） |
| `MAP_EDITOR_ALLOW_ALL_USERS` | `true` | 全ユーザーにマップ編集を許可するか |
| `MAP_EDITOR_ALLOWED_USERS` | `""` | 許可するユーザー識別子のカンマ区切りリスト |
| `OPENID_WOKA_NAME_POLICY` / `OPID_WOKA_NAME_POLICY` | `user_input` | `user_input` / `allow_override_opid` / `force_opid` / `""`。不正値は `null` として返す。play と同じく `OPENID_` を優先 |
| `ENABLE_CHAT` | `true` | |
| `ENABLE_CHAT_UPLOAD` | `true` | |
| `ENABLE_CHAT_ONLINE_LIST` | `true` | |
| `ENABLE_CHAT_DISCONNECTED_LIST` | `true` | |
| `ENABLE_SAY` | `true` | |
| `ENABLE_TUTORIAL` | `true` | |
| `WORLD_NAME` | `selfHostedWorld` | `/api/room/access` が返す `world` |
| `KLAXOON_ENABLED` | `false` | 以下はアプリメニューの内容。play と同じ変数名なので同じ `.env` で駆動できる |
| `YOUTUBE_ENABLED` | `true` | |
| `GOOGLE_DRIVE_ENABLED` | `true` | |
| `GOOGLE_DOCS_ENABLED` | `true` | |
| `GOOGLE_SHEETS_ENABLED` | `true` | |
| `GOOGLE_SLIDES_ENABLED` | `true` | |
| `ERASER_ENABLED` | `true` | |
| `EXCALIDRAW_ENABLED` | `true` | |
| `CARDS_ENABLED` | `true` | |
| `TLDRAW_ENABLED` | `true` | |

真偽値は `true` / `1` / `false` / `0` を受け付けます。**空文字はデフォルト値として扱います**
（`.env.template` は `DISABLE_ANONYMOUS=` のように空で配っており、docker compose は未設定変数を空文字で渡すため）。

`ADMIN_API_URL` を有効化すると、マップエディタやチャットの設定も **この API の env が権威**になります
（pusher 側の同名 env は使われません）。`play` 側と食い違わないように揃えてください。

## `LocalAdmin` との差分（既知の制限）

`ADMIN_API_URL` を設定すると `LocalAdmin` は完全にバイパスされるため、この API が返さない値は
`play` 側の env をいくら設定しても反映されません。現時点で意図的に返していないものは以下です。

- **タグ**: `tags` は常に `[]` を返します。`OPENID_TAGS_CLAIM` によるタグ（マップ編集権限やタグ制限エリア）は
  効かなくなります。必要になったら `/api/room/access` でユーザー識別子からタグを解決してください。
- **録画**: `canRecord` は常に `false`、`/api/map` も `recording` を返しません（＝ボタン非表示）。
  `LIVEKIT_RECORDING_S3_*` を設定していても有効になりません。
- **メタタグ / 既定 Woka**: `metatags`、`defaultWokaName`、`defaultWokaTexture`、`skipCameraPage`、
  `bypassPwa`、`provideDefaultWoka*` は返さないので、フロント側の既定値になります。
- `enableIssueReport` と `enableMatrixChat` は返しませんが、フロントが未指定を `true` として扱うため
  （`Room.ts` の `?? true`）挙動は変わりません。

アプリメニュー（`applications`）は `LocalAdmin` と同じ env から組み立てて返しています。

## 実装しているエンドポイント

| エンドポイント | 備考 |
|---|---|
| `GET /api/capabilities` | **認証不要**。`api/woka/list` / `api/companion/list` / `api/save-name` / `api/save-textures` を宣言 |
| `GET /api/map` | `LocalAdmin.fetchMapDetails()` 相当 |
| `GET /api/room/access` | 本体。保存済みプロファイルを Woka / 表示名 / コンパニオンに反映する |
| `POST /api/save-textures` | **204** を返す |
| `POST /api/save-name` | **204** を返す |
| `POST /api/save-companion-texture` | `texture: null` はコンパニオン解除。**204** を返す |
| `GET /api/woka/list` | `woka.json` をそのまま返す |
| `GET /api/companion/list` | `companions.json` をそのまま返す |

`/api/login-url/{token}`、`/api/ban`、`/api/room/tags`、`/api/members`、`/oauth/logout`、`/api/ice-servers`
は未実装で 404 を返します。対応する機能を使わない限り通常運用に影響はありません。

## 同期のルール

`GET /api/room/access` の優先順位:

- **保存済みプロファイルが常に勝ちます。** フロントは Woka 変更時に保存 API を await してから再接続するため、
  この順序で新しい選択が失われることはありません。
- 保存が無い状態でクライアントから有効な texture が届いた場合は、それを取り込みます
  （既存ユーザーが `localStorage` の Woka を選び直さずに済むための移行処理）。
- `isCharacterTexturesValid: false` は「Woka 選択画面へ飛ばせ」の意味です。保存もクライアント値も無い
  新規ユーザーには `false` を返します。
- コンパニオンは「未決定」と「明示的に解除（`null`）」を区別します。解除したコンパニオンは再ログインでも復活しません。
- **匿名ユーザーは一切保存しません。** クライアントから届いた値をそのまま返すので、従来どおり `localStorage` ベースで動きます。

## データベース

```sql
CREATE TABLE IF NOT EXISTS profiles (
  user_identifier TEXT PRIMARY KEY,  -- pusher が JWT から取り出す identifier（OIDC の sub または email）
  textures        TEXT,              -- JSON 配列 '["male1"]'
  name            TEXT,
  companion       TEXT,              -- NULL 可
  companion_set   INTEGER NOT NULL DEFAULT 0,  -- 1 = ユーザーが明示的に決めた（解除を含む）
  updated_at      TEXT NOT NULL
);
```

Node 24 標準の `node:sqlite` を使うのでネイティブビルドは不要です。
ワールド単位ではなくユーザー単位グローバルなので `playUri` は保存しません（受け取ってログに出すだけです）。

## 開発

```bash
cd admin-api
npm run dev        # tsx watch
npm run typecheck  # tsc --noEmit
```
