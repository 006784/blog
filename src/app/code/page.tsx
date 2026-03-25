import { CodePlayground } from './playground';

export const metadata = {
  title: '代码运行环境',
  description: '在线代码编辑与运行，支持 Python、JavaScript、TypeScript、Java、C++、C、PHP、HTML',
};

export default function CodePage() {
  return <CodePlayground />;
}
