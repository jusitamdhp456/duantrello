import Link from "next/link";
import { signup } from "@/app/auth/actions";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  return (
    <>
      <div>
        <h2 className="mt-2 text-center text-4xl font-light text-gray-700 tracking-wide">
          Sign Up
        </h2>
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-500 hover:text-blue-600 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
      <form className="mt-8 space-y-6" action={signup}>
        <div className="space-y-6">
          <div>
            <label htmlFor="full-name" className="sr-only">
              Full Name
            </label>
            <input
              id="full-name"
              name="fullName"
              type="text"
              required
              className="appearance-none rounded-2xl relative block w-full px-5 py-4 bg-neu-base text-gray-700 placeholder-gray-400 shadow-neu-concave focus:outline-none focus:ring-2 focus:ring-blue-400/50 sm:text-sm border-none transition-shadow"
              placeholder="Full Name"
            />
          </div>
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
              autoComplete="new-password"
              required
              className="appearance-none rounded-2xl relative block w-full px-5 py-4 bg-neu-base text-gray-700 placeholder-gray-400 shadow-neu-concave focus:outline-none focus:ring-2 focus:ring-blue-400/50 sm:text-sm border-none transition-shadow"
              placeholder="Password (min 6 chars)"
            />
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
            Create Account
          </button>
        </div>
      </form>
    </>
  );
}
