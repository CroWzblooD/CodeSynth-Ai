import { useRouter } from 'next/router';

export default function ErrorPage() {
  const router = useRouter();
  const { error } = router.query;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-bold text-red-500">Authentication Error</h1>
        <p className="mt-2 text-gray-600">{error}</p>
      </div>
    </div>
  );
} 