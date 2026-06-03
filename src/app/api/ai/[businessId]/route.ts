import { NextResponse } from 'next/server';
import { AIReportRepository } from '@/repositories/AIReportRepository';
import { aiQueue } from '@/queues/ai.queue';
import prisma from '@/lib/prisma';
import { ReportType } from '@prisma/client';
import { z } from 'zod';

const aiPostSchema = z.object({
  reportType: z.nativeEnum(ReportType).default(ReportType.FULL_ANALYSIS),
});

const aiReportRepo = new AIReportRepository();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    
    // Check if business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    const reports = await aiReportRepo.findByBusinessId(businessId);
    
    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error('API Error in AI reports GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    let reportType: ReportType = ReportType.FULL_ANALYSIS;
    try {
      const body = await request.json();
      const validated = aiPostSchema.parse(body);
      reportType = validated.reportType;
    } catch (e) {
      // Body empty or missing fallback to FULL_ANALYSIS
    }

    const job = await aiQueue.add('ai-report', {
      businessId,
      reportType,
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: `AI analysis (${reportType}) queued successfully`,
    });
  } catch (error) {
    console.error('API Error in AI reports POST:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
