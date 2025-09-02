"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;

  if (!session) {
    return (
      <button
        onClick={() => signIn("google")}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Sign in with Google
      </button>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      <p>Signed in as {session.user?.email}</p>
      <button
        onClick={() => signOut()}
        className="px-4 py-2 bg-gray-500 text-white rounded"
      >
        Sign out
      </button>
    </div>
  );
}