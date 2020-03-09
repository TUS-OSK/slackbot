# Setup

## Deploy to App Engine

以下の以下の役割が必要

- App Engine デプロイ担当者
- App Engine サービス管理者
- Cloud Build サービス アカウント
- ストレージのオブジェクト作成者
- ストレージ オブジェクト閲覧者

[App Engine Admin API](https://console.developers.google.com/apis/library/appengine.googleapis.com) を有効にする必要あり

## Slack Bot

[Bolt](https://slack.dev/bolt/ja-jp/concepts)を用いる
[入門ガイド](https://slack.dev/bolt/ja-jp/tutorial/getting-started)に従って、
Event Subscription > Request URL に `https://[GCP_PROJECT_ID].appspot.com/slack/events` を指定する必要あり

Interactivity を ON に
