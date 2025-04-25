import { Inter } from "next/font/google";
import { Providers } from "../providers";

const inter = Inter({ subsets: ["latin"] });

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Providers>
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">PicreAIte</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create and share your pictures
            </p>
          </div>
          {children}
        </div>
      </Providers>
    </div>
  );
}
