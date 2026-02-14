#!/usr/bin/env bash

set -u

if [[ -f ./.env.local ]]; then
  set -a
  # shellcheck source=/dev/null
  source ./.env.local
  set +a
fi

BASE_URL="${BASE_URL:-http://localhost:3000}"
NEWS_TEST_TIMEOUT="${NEWS_TEST_TIMEOUT:-90}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"

if [[ -z "$ADMIN_PASSWORD" ]]; then
  echo "ERROR: ADMIN_PASSWORD 未配置，无法做完整 API 冒烟检查。"
  exit 1
fi

if command -v base64 >/dev/null 2>&1; then
  ADMIN_TOKEN="$(printf '%s' "$ADMIN_PASSWORD" | base64 | tr -d '\n')"
elif command -v node >/dev/null 2>&1; then
  ADMIN_TOKEN="$(node -e 'console.log(Buffer.from(process.argv[1]||"").toString("base64"))' "$ADMIN_PASSWORD")"
else
  echo "ERROR: 缺少 base64 或 node，无法生成管理员 token。"
  exit 1
fi

TOTAL=0
PASS=0
FAIL=0
RESULTS_FILE="/tmp/api-smoke-results-$$.txt"
: > "$RESULTS_FILE"

is_expected() {
  local status="$1"
  local expected_csv="$2"
  local IFS=','
  read -r -a codes <<< "$expected_csv"
  local code
  for code in "${codes[@]}"; do
    if [[ "$status" == "$code" ]]; then
      return 0
    fi
  done
  return 1
}

call() {
  local name="$1"
  local expected="$2"
  local timeout="$3"
  shift 3

  local response
  response="$(curl --max-time "$timeout" -sS -L "$@" -w $'\n__STATUS__:%{http_code}' 2>&1 || true)"
  local status="${response##*__STATUS__:}"
  local body="${response%__STATUS__:*}"
  body="${body%$'\n'}"

  TOTAL=$((TOTAL + 1))

  local flat="${body//$'\n'/ }"
  flat="${flat//$'\r'/ }"
  local snippet="${flat:0:160}"

  if is_expected "$status" "$expected"; then
    PASS=$((PASS + 1))
    echo "PASS|$name|$status|expect:$expected|$snippet" | tee -a "$RESULTS_FILE"
  else
    FAIL=$((FAIL + 1))
    echo "FAIL|$name|$status|expect:$expected|$snippet" | tee -a "$RESULTS_FILE"
  fi
}

echo "Running API smoke test against: $BASE_URL"

# auth/health
call "health_get" "200,503" 20 -X GET "$BASE_URL/api/health/"
call "health_post_unauth" "401" 20 -X POST "$BASE_URL/api/health/" -H "Content-Type: application/json" --data '{}'
call "auth_verify_ok" "200" 20 -X POST "$BASE_URL/api/auth/verify/" -H "Content-Type: application/json" --data "{\"password\":\"$ADMIN_PASSWORD\"}"

# categories
call "categories_get" "200" 20 -X GET "$BASE_URL/api/categories/"
call "categories_post_validation" "400" 20 -X POST "$BASE_URL/api/categories/" -H "Content-Type: application/json" --data "{\"adminPassword\":\"$ADMIN_PASSWORD\"}"
call "categories_put_validation" "400" 20 -X PUT "$BASE_URL/api/categories/" -H "Content-Type: application/json" --data "{\"adminPassword\":\"$ADMIN_PASSWORD\"}"
call "categories_delete_validation" "400" 20 -X DELETE "$BASE_URL/api/categories/" -H "Content-Type: application/json" --data "{\"adminPassword\":\"$ADMIN_PASSWORD\"}"

# contact/guestbook/interactions
call "contact_post" "200" 20 -X POST "$BASE_URL/api/contact/" -H "Content-Type: application/json" --data '{"name":"Smoke","email":"smoke@example.com","subject":"API smoke","message":"smoke test message"}'
call "guestbook_get" "200" 20 -X GET "$BASE_URL/api/guestbook/?page=1&limit=5"
call "guestbook_post_validation" "400" 20 -X POST "$BASE_URL/api/guestbook/" -H "Content-Type: application/json" --data '{"nickname":"Smoke"}'
call "guestbook_put_validation" "400" 20 -X PUT "$BASE_URL/api/guestbook/" -H "Content-Type: application/json" --data "{\"adminPassword\":\"$ADMIN_PASSWORD\"}"
call "guestbook_delete_validation" "400" 20 -X DELETE "$BASE_URL/api/guestbook/" -H "Content-Type: application/json" --data "{\"adminPassword\":\"$ADMIN_PASSWORD\"}"
call "interactions_post_validation" "400" 20 -X POST "$BASE_URL/api/interactions/" -H "Content-Type: application/json" --data '{"type":"like"}'
call "interactions_get_validation" "400" 20 -X GET "$BASE_URL/api/interactions/"

# diaries
FAKE_ID="00000000-0000-0000-0000-000000000000"
call "diaries_get" "200" 20 -X GET "$BASE_URL/api/diaries/?limit=2"
call "diaries_post_validation" "400" 20 -X POST "$BASE_URL/api/diaries/" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" --data '{"title":"x"}'
call "diaries_id_get_notfound" "404" 20 -X GET "$BASE_URL/api/diaries/$FAKE_ID/"
call "diaries_id_put_notfound" "404" 20 -X PUT "$BASE_URL/api/diaries/$FAKE_ID/" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" --data '{"content":"update"}'
call "diaries_id_delete" "200,404" 20 -X DELETE "$BASE_URL/api/diaries/$FAKE_ID/" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" --data '{}'

# upload-like
call "music_upload_post_validation" "400" 20 -X POST "$BASE_URL/api/music/upload/"
call "upload_post_validation" "400" 20 -X POST "$BASE_URL/api/upload/"
call "upload_delete_validation" "400" 20 -X DELETE "$BASE_URL/api/upload/" -H "Content-Type: application/json" --data '{}'

# news
call "news_schedule_get" "200" 20 -X GET "$BASE_URL/api/news/schedule/"
call "news_schedule_post_validation" "400" 20 -X POST "$BASE_URL/api/news/schedule/" -H "Content-Type: application/json" --data '{"scheduleId":"smoke"}'
call "news_schedule_put_validation" "400" 20 -X PUT "$BASE_URL/api/news/schedule/?action=unknown" -H "Content-Type: application/json" --data '{}'
call "news_schedule_delete" "200" 20 -X DELETE "$BASE_URL/api/news/schedule/?id=smoke"
call "news_sources_get" "200" 20 -X GET "$BASE_URL/api/news/sources/"
call "news_sources_post_validation" "400" 20 -X POST "$BASE_URL/api/news/sources/" -H "Content-Type: application/json" --data '{}'
call "news_test_simple_post_validation" "400" 20 -X POST "$BASE_URL/api/news/test-simple/" -H "Content-Type: application/json" --data '{}'
call "news_test_get" "200,500" "$NEWS_TEST_TIMEOUT" -X GET "$BASE_URL/api/news/test/?test=true"
call "news_test_post_validation" "400" 20 -X POST "$BASE_URL/api/news/test/" -H "Content-Type: application/json" --data '{}'

# notify/resources
call "notify_get_unauth" "401" 20 -X GET "$BASE_URL/api/notify/"
call "notify_post_unauth" "401" 20 -X POST "$BASE_URL/api/notify/" -H "Content-Type: application/json" --data '{}'
call "resources_get" "200" 20 -X GET "$BASE_URL/api/resources/?page=1&limit=5"
call "resources_post_validation" "400" 20 -X POST "$BASE_URL/api/resources/" -F "adminPassword=$ADMIN_PASSWORD"
call "resources_presign_validation" "400" 20 -X POST "$BASE_URL/api/resources/presign/" -H "Content-Type: application/json" --data "{\"adminPassword\":\"$ADMIN_PASSWORD\"}"
call "resources_save_validation" "400" 20 -X POST "$BASE_URL/api/resources/save/" -H "Content-Type: application/json" --data "{\"adminPassword\":\"$ADMIN_PASSWORD\"}"
call "resources_delete_validation" "400" 20 -X DELETE "$BASE_URL/api/resources/" -H "Content-Type: application/json" --data "{\"adminPassword\":\"$ADMIN_PASSWORD\"}"

# rss/search/secure/sentry
call "rss_get" "200" 20 -X GET "$BASE_URL/api/rss/"
call "search_get" "200" 20 -X GET "$BASE_URL/api/search/?q=test"
call "secure_contact_get" "200" 20 -X GET "$BASE_URL/api/secure-contact/"
call "secure_contact_post" "200" 20 -X POST "$BASE_URL/api/secure-contact/" -H "Origin: http://localhost:3000" -H "x-csrf-token: smoke" -H "Content-Type: application/json" --data '{"name":"Smoke","email":"smoke@example.com","subject":"Smoke subject","message":"This is a secure contact smoke message","website":"https://example.com"}'
call "sentry_example_api_get" "500" 20 -X GET "$BASE_URL/api/sentry-example-api/"

# stats/subscribe/test-logs
call "stats_post" "200" 20 -X POST "$BASE_URL/api/stats/" -H "Content-Type: application/json" --data '{"path":"/smoke","title":"Smoke"}'
call "stats_get_overview" "200" 20 -X GET "$BASE_URL/api/stats/?type=overview&days=7"
call "stats_get_trend" "200" 20 -X GET "$BASE_URL/api/stats/?type=trend&days=7"
call "stats_get_devices" "200" 20 -X GET "$BASE_URL/api/stats/?type=devices&days=7"
call "stats_get_posts" "200" 20 -X GET "$BASE_URL/api/stats/?type=posts&days=7"
call "subscribe_post_validation" "400" 20 -X POST "$BASE_URL/api/subscribe/" -H "Content-Type: application/json" --data '{}'
call "subscribe_delete_validation" "400" 20 -X DELETE "$BASE_URL/api/subscribe/"
call "test_logs_get" "200,500" 20 -X GET "$BASE_URL/api/test-logs/"
call "test_logs_post" "200" 20 -X POST "$BASE_URL/api/test-logs/" -H "Content-Type: application/json" --data '{"data":"smoke"}'

echo "SUMMARY|total:$TOTAL|pass:$PASS|fail:$FAIL"
echo "---- FAILURES ----"
while IFS= read -r line; do
  case "$line" in
    FAIL\|*) echo "$line" ;;
  esac
done < "$RESULTS_FILE"

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi

