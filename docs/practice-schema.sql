-- 编程练习题库 Schema
-- 在 Supabase SQL Editor 中执行此文件

-- 题目主表
CREATE TABLE IF NOT EXISTS practice_problems (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  slug             text NOT NULL UNIQUE,
  description      text NOT NULL,
  difficulty       text NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  type             text NOT NULL DEFAULT 'algorithm' CHECK (type IN ('algorithm', 'multiple_choice', 'interview')),
  tags             text[]  NOT NULL DEFAULT '{}',
  languages        text[]  NOT NULL DEFAULT '{"python","javascript","java","cpp","c"}',
  starter_code     jsonb   NOT NULL DEFAULT '{}',
  choices          jsonb,
  answer_hint      text,
  constraints      text,
  examples         jsonb   NOT NULL DEFAULT '[]',
  is_public        boolean NOT NULL DEFAULT true,
  sort_order       integer NOT NULL DEFAULT 0,
  submission_count integer NOT NULL DEFAULT 0,
  accept_count     integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- 测试用例表（单独存储，保护隐藏用例）
CREATE TABLE IF NOT EXISTS practice_test_cases (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id  uuid NOT NULL REFERENCES practice_problems(id) ON DELETE CASCADE,
  input       text NOT NULL DEFAULT '',
  expected    text NOT NULL DEFAULT '',
  is_hidden   boolean NOT NULL DEFAULT false,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 提交记录表
CREATE TABLE IF NOT EXISTS practice_submissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id  uuid NOT NULL REFERENCES practice_problems(id) ON DELETE CASCADE,
  language    text NOT NULL,
  code        text NOT NULL,
  status      text NOT NULL DEFAULT 'runtime_error' CHECK (status IN ('accepted','wrong_answer','runtime_error','time_limit','compile_error')),
  run_time_ms integer,
  output      text,
  error_msg   text,
  visitor_id  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_practice_problems_type       ON practice_problems (type, sort_order);
CREATE INDEX IF NOT EXISTS idx_practice_problems_difficulty ON practice_problems (difficulty);
CREATE INDEX IF NOT EXISTS idx_practice_problems_public     ON practice_problems (is_public, sort_order) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_practice_test_cases_problem  ON practice_test_cases (problem_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_practice_submissions_problem ON practice_submissions (problem_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_practice_submissions_visitor ON practice_submissions (visitor_id, created_at DESC) WHERE visitor_id IS NOT NULL;

-- RLS 策略
ALTER TABLE practice_problems   ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read published problems" ON practice_problems;
CREATE POLICY "public read published problems"
  ON practice_problems FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "anyone insert submission" ON practice_submissions;
CREATE POLICY "anyone insert submission"
  ON practice_submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public read submissions" ON practice_submissions;
CREATE POLICY "public read submissions"
  ON practice_submissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "no direct test case access" ON practice_test_cases;
CREATE POLICY "no direct test case access"
  ON practice_test_cases FOR SELECT USING (false);

-- 插入示例题目
INSERT INTO practice_problems (title, slug, description, difficulty, type, tags, languages, starter_code, examples, constraints) VALUES
(
  '两数之和',
  'two-sum',
  '给定一个整数数组 `nums` 和一个整数目标值 `target`，请你在该数组中找出**和为目标值** `target` 的那**两个**整数，并返回它们的数组下标。

你可以假设每种输入只会对应一个答案，并且你不能使用两次相同的元素。

你可以按任意顺序返回答案。',
  'easy',
  'algorithm',
  '{"数组","哈希表"}',
  '{"python","javascript","java","cpp","c"}',
  '{
    "python": "def twoSum(nums, target):\n    # 在此编写你的代码\n    pass\n\n# 读取输入\nnums = list(map(int, input().split()))\ntarget = int(input())\nresult = twoSum(nums, target)\nprint(result[0], result[1])",
    "javascript": "function twoSum(nums, target) {\n    // 在此编写你的代码\n}\n\nconst lines = require(''fs'').readFileSync(''/dev/stdin'', ''utf8'').trim().split(''\\n'');\nconst nums = lines[0].split('' '').map(Number);\nconst target = parseInt(lines[1]);\nconst result = twoSum(nums, target);\nconsole.log(result[0] + '' '' + result[1]);",
    "java": "import java.util.*;\n\npublic class Main {\n    public static int[] twoSum(int[] nums, int target) {\n        // 在此编写你的代码\n        return new int[]{};\n    }\n    \n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String[] line1 = sc.nextLine().split(\" \");\n        int[] nums = new int[line1.length];\n        for (int i = 0; i < line1.length; i++) nums[i] = Integer.parseInt(line1[i]);\n        int target = sc.nextInt();\n        int[] result = twoSum(nums, target);\n        System.out.println(result[0] + \" \" + result[1]);\n    }\n}",
    "cpp": "#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& nums, int target) {\n    // 在此编写你的代码\n    return {};\n}\n\nint main() {\n    vector<int> nums;\n    string line;\n    getline(cin, line);\n    istringstream iss(line);\n    int x;\n    while (iss >> x) nums.push_back(x);\n    int target;\n    cin >> target;\n    auto result = twoSum(nums, target);\n    cout << result[0] << \" \" << result[1] << endl;\n    return 0;\n}",
    "c": "#include <stdio.h>\n#include <stdlib.h>\n\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    // 在此编写你的代码\n    *returnSize = 2;\n    int* result = (int*)malloc(2 * sizeof(int));\n    return result;\n}\n\nint main() {\n    int nums[10000], n = 0, target;\n    while (scanf(\"%d\", &nums[n]) == 1) n++;\n    int returnSize;\n    int* result = twoSum(nums, n-1, nums[n-1], &returnSize);\n    printf(\"%d %d\\n\", result[0], result[1]);\n    return 0;\n}"
  }',
  '[{"input":"2 7 11 15\n9","output":"0 1","explanation":"因为 nums[0] + nums[1] == 9，返回 [0, 1]"},{"input":"3 2 4\n6","output":"1 2"}]',
  '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\n只会存在一个有效答案'
),
(
  'FizzBuzz',
  'fizz-buzz',
  '给你一个整数 `n`，找出从 `1` 到 `n` 各个整数的 Fizz Buzz 表示，并用字符串数组作答。

- 如果 `i` 同时是 `3` 和 `5` 的倍数，返回字符串 `"FizzBuzz"`
- 如果 `i` 是 `3` 的倍数，返回字符串 `"Fizz"`
- 如果 `i` 是 `5` 的倍数，返回字符串 `"Buzz"`
- 否则，返回 `i` 的字符串形式',
  'easy',
  'algorithm',
  '{"数学","字符串","模拟"}',
  '{"python","javascript","java","cpp","c"}',
  '{
    "python": "n = int(input())\nfor i in range(1, n+1):\n    if i % 15 == 0:\n        print(\"FizzBuzz\")\n    elif i % 3 == 0:\n        print(\"Fizz\")\n    elif i % 5 == 0:\n        print(\"Buzz\")\n    else:\n        print(i)",
    "javascript": "const n = parseInt(require(''fs'').readFileSync(''/dev/stdin'',''utf8'').trim());\nfor (let i = 1; i <= n; i++) {\n    if (i % 15 === 0) console.log(''FizzBuzz'');\n    else if (i % 3 === 0) console.log(''Fizz'');\n    else if (i % 5 === 0) console.log(''Buzz'');\n    else console.log(i);\n}",
    "java": "import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        int n = new Scanner(System.in).nextInt();\n        for (int i = 1; i <= n; i++) {\n            if (i % 15 == 0) System.out.println(\"FizzBuzz\");\n            else if (i % 3 == 0) System.out.println(\"Fizz\");\n            else if (i % 5 == 0) System.out.println(\"Buzz\");\n            else System.out.println(i);\n        }\n    }\n}",
    "cpp": "#include<bits/stdc++.h>\nusing namespace std;\nint main(){\n    int n; cin>>n;\n    for(int i=1;i<=n;i++){\n        if(i%15==0) cout<<\"FizzBuzz\"<<\"\\n\";\n        else if(i%3==0) cout<<\"Fizz\"<<\"\\n\";\n        else if(i%5==0) cout<<\"Buzz\"<<\"\\n\";\n        else cout<<i<<\"\\n\";\n    }\n}",
    "c": "#include<stdio.h>\nint main(){\n    int n; scanf(\"%d\",&n);\n    for(int i=1;i<=n;i++){\n        if(i%15==0) printf(\"FizzBuzz\\n\");\n        else if(i%3==0) printf(\"Fizz\\n\");\n        else if(i%5==0) printf(\"Buzz\\n\");\n        else printf(\"%d\\n\",i);\n    }\n}"
  }',
  '[{"input":"5","output":"1\n2\nFizz\n4\nBuzz"},{"input":"15","output":"1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz"}]',
  '1 <= n <= 10^4'
),
(
  'JavaScript 中 == 和 === 的区别',
  'js-equality-operators',
  '以下代码的输出是什么？

```javascript
console.log(1 == "1");
console.log(1 === "1");
console.log(null == undefined);
console.log(null === undefined);
```',
  'easy',
  'multiple_choice',
  '{"JavaScript","基础"}',
  '{}',
  '{}',
  '[{"input":"","output":"","explanation":""}]',
  NULL
),
(
  '介绍一下你对 RESTful API 的理解',
  'restful-api-understanding',
  '请介绍一下 RESTful API 的核心概念，包括：

1. REST 的核心原则（无状态、统一接口等）
2. HTTP 方法的语义（GET、POST、PUT、DELETE）
3. 状态码的含义（200、201、400、401、403、404、500）
4. 如何设计一个合理的 RESTful API 端点

请结合实际例子说明。',
  'medium',
  'interview',
  '{"API","后端","系统设计"}',
  '{}',
  '{}',
  '[{"input":"","output":"","explanation":""}]',
  NULL
);

-- 更新选择题的 choices 字段
UPDATE practice_problems
SET choices = '[
  {"id":"a","text":"true\nfalse\ntrue\ntrue","is_correct":false},
  {"id":"b","text":"true\nfalse\ntrue\nfalse","is_correct":true},
  {"id":"c","text":"false\nfalse\ntrue\nfalse","is_correct":false},
  {"id":"d","text":"true\ntrue\nfalse\nfalse","is_correct":false}
]'
WHERE slug = 'js-equality-operators';

-- 更新面试题的参考答案
UPDATE practice_problems
SET answer_hint = '**参考要点：**

**REST 核心原则：**
- 无状态（Stateless）：每个请求包含所有必要信息
- 统一接口：资源通过 URI 标识，通过标准 HTTP 方法操作
- 分层系统：客户端不知道是否直连服务器

**HTTP 方法：**
- GET：获取资源（幂等）
- POST：创建资源
- PUT：完整替换资源（幂等）
- PATCH：部分更新资源
- DELETE：删除资源（幂等）

**常见状态码：**
- 200 OK，201 Created，204 No Content
- 400 Bad Request，401 Unauthorized，403 Forbidden，404 Not Found
- 500 Internal Server Error

**端点设计示例：**
```
GET    /api/users          # 获取用户列表
POST   /api/users          # 创建用户
GET    /api/users/:id      # 获取指定用户
PUT    /api/users/:id      # 更新用户
DELETE /api/users/:id      # 删除用户
```'
WHERE slug = 'restful-api-understanding';

-- 为算法题添加测试用例
INSERT INTO practice_test_cases (problem_id, input, expected, is_hidden, sort_order)
SELECT id, '2 7 11 15' || chr(10) || '9', '0 1', false, 1 FROM practice_problems WHERE slug = 'two-sum';

INSERT INTO practice_test_cases (problem_id, input, expected, is_hidden, sort_order)
SELECT id, '3 2 4' || chr(10) || '6', '1 2', false, 2 FROM practice_problems WHERE slug = 'two-sum';

INSERT INTO practice_test_cases (problem_id, input, expected, is_hidden, sort_order)
SELECT id, '3 3' || chr(10) || '6', '0 1', true, 3 FROM practice_problems WHERE slug = 'two-sum';

INSERT INTO practice_test_cases (problem_id, input, expected, is_hidden, sort_order)
SELECT id, '5', E'1\n2\nFizz\n4\nBuzz', false, 1 FROM practice_problems WHERE slug = 'fizz-buzz';

INSERT INTO practice_test_cases (problem_id, input, expected, is_hidden, sort_order)
SELECT id, '15', E'1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', false, 2 FROM practice_problems WHERE slug = 'fizz-buzz';
