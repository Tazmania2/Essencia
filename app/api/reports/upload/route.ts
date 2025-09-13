import { NextRequest, NextResponse } from 'next/server';
import { ReportProcessingService } from '../../../../services/report-processing.service';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const reportService = ReportProcessingService.getInstance();
    const result = await reportService.processReportFile(file, token);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Report upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process report' },
      { status: 500 }
    );
  }
}