import Link from 'next/link';

export default function NovelNotFound() {
  return (
    <div className="min-h-screen px-6 py-16 text-center text-neutral-500">
      小说不存在
      <Link href="/media" className="mt-4 block text-sm underline">
        返回书影音
      </Link>
    </div>
  );
}
