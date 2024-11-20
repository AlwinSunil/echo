import Link from "next/link";

export default function NotFound() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold">404 - Not Found</h2>
      <p className="mb-2 text-sm text-gray-700">
        Could not find requested page.
      </p>
      <Link
        href="/"
        className="border bg-black px-3 py-1 text-sm font-medium text-white hover:bg-neutral-800"
      >
        Return Home
      </Link>
    </div>
  );
}
