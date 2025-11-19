import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users grouped by department
    const users = await prisma.user.findMany({
      select: {
        department: true,
        userType: true
      }
    });

    // Count mentors and mentees by department
    const departmentMap: Record<string, { mentors: number; mentees: number }> = {};
    
    users.forEach((user: any) => {
      const dept = user.department || 'Khác';
      if (!departmentMap[dept]) {
        departmentMap[dept] = { mentors: 0, mentees: 0 };
      }
      if (user.role === 'MENTOR') {
        departmentMap[dept].mentors++;
      } else if (user.role === 'MENTEE') {
        departmentMap[dept].mentees++;
      }
    });

    // Convert to array and add colors
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280'];
    let colorIndex = 0;
    
    const departmentData = Object.entries(departmentMap).map(([name, data]) => ({
      name,
      mentors: data.mentors,
      mentees: data.mentees,
      color: colors[colorIndex++ % colors.length]
    }));

    return NextResponse.json({ departmentData });
  } catch (error) {
    console.error('Error fetching department data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
