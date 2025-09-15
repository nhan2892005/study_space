"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import ProfileForm from '@/components/profile/ProfileForm';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold">You must be signed in to view this page.</h2>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      department: true,
      major: true,
      year: true,
      bio: true,
      achievements: true,
    },
  });

  if (!user) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold">User not found.</h2>
      </div>
    );
  }

  // Ensure props are serializable
  const serializableUser = JSON.parse(JSON.stringify(user));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Profile Settings</h1>
      <ProfileForm user={serializableUser} />
    </div>
  );
}
