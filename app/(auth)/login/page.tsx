import Link from "next/link";
import { login } from "@/app/auth/actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  return (
    <>
      <div>
        <h2 className="mt-2 text-center text-4xl font-light text-gray-700 tracking-wide">
          Login
        </h2>
        <p className="mt-4 text-center text-sm text-gray-500">
          Or{" "}
          <Link href="/signup" className="font-medium text-blue-500 hover:text-blue-600 transition-colors">
            create a new account
          </Link>
        </p>
      </div>
      <form className="mt-8 space-y-6" action={login}>
        <div className="space-y-6">
          <div>
            <label htmlFor="email-address" className="sr-only">
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-2xl relative block w-full px-5 py-4 bg-neu-base text-gray-700 placeholder-gray-400 shadow-neu-concave focus:outline-none focus:ring-2 focus:ring-blue-400/50 sm:text-sm border-none transition-shadow"
              placeholder="username@mail.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none rounded-2xl relative block w-full px-5 py-4 bg-neu-base text-gray-700 placeholder-gray-400 shadow-neu-concave focus:outline-none focus:ring-2 focus:ring-blue-400/50 sm:text-sm border-none transition-shadow"
              placeholder="**********"
            />
          </div>
          <div className="flex items-center justify-between px-2">
            <div className="text-sm">
              <a href="#" className="font-medium text-gray-500 hover:text-gray-700 underline decoration-gray-300 underline-offset-4">
                Forget Password?
              </a>
            </div>
          </div>
        </div>

        {searchParams?.message && (
          <p className="mt-4 text-sm text-center text-red-500">
            {searchParams.message}
          </p>
        )}

        <div className="pt-4">
          <button
            type="submit"
            className="group relative w-full flex justify-center py-4 px-4 border-none text-lg font-medium rounded-full text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-neu-convex active:shadow-neu-pressed transition-all duration-200"
          >
            Sign Up
          </button>
        </div>
      </form>
    </>
  );
}
