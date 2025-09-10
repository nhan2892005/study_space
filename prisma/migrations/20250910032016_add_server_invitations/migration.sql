/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `Reaction` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Reaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[postId,userId]` on the table `Reaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Reaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'FILE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('IMAGE', 'DOCUMENT', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_authorId_fkey";

-- DropIndex
DROP INDEX "Reaction_authorId_postId_key";

-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Reaction" DROP COLUMN "authorId",
DROP COLUMN "updatedAt",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ServerInvitation" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "invitedUserId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "FileType" NOT NULL,
    "size" INTEGER NOT NULL,
    "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recording" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "thumbnail" TEXT,
    "channelId" TEXT NOT NULL,
    "recorderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recording_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServerInvitation_serverId_idx" ON "ServerInvitation"("serverId");

-- CreateIndex
CREATE INDEX "ServerInvitation_invitedUserId_idx" ON "ServerInvitation"("invitedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ServerInvitation_serverId_invitedUserId_key" ON "ServerInvitation"("serverId", "invitedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_postId_userId_key" ON "Reaction"("postId", "userId");

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerInvitation" ADD CONSTRAINT "ServerInvitation_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "ChatServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerInvitation" ADD CONSTRAINT "ServerInvitation_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerInvitation" ADD CONSTRAINT "ServerInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_recorderId_fkey" FOREIGN KEY ("recorderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
