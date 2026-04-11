import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class EpidemiologyReportService {
  private readonly logger = new Logger(EpidemiologyReportService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Cron('0 2 * * *')
  async generateDailyReport(): Promise<void> {
    this.logger.log('Starting daily epidemiology report generation...');
    
    // We execute the aggregation query via raw query
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 1); // Aggregate for "yesterday" if run at 2 AM
    
    const formattedDate = targetDate.toISOString().split('T')[0];

    try {
      // 1. Data Pipeline & Performance: Prisma raw query
      // 2. Anonymisation Stricte (HIPAA Safe Harbor): Extraire uniquement l'année de naissance.
      // 3. Data Cleansing (Age_Unknown, Zip_Unknown). Troncature pour pop < 20000.
      
      const rawQuery = Prisma.sql`
        WITH ProcessedData AS (
          SELECT
            d.icd10_code,
            -- Safe Harbor: Only use year of birth
            CASE
              WHEN p."dateOfBirth" IS NULL THEN 'Age_Unknown'
              WHEN (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p."dateOfBirth")) < 6 THEN '0-5'
              WHEN (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p."dateOfBirth")) < 13 THEN '6-12'
              WHEN (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p."dateOfBirth")) < 19 THEN '13-18'
              WHEN (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p."dateOfBirth")) < 36 THEN '19-35'
              WHEN (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p."dateOfBirth")) < 61 THEN '36-60'
              ELSE '61+'
            END as age_group,
            -- Handle Missing and Truncation based on < 20000 pop
            CASE
              WHEN p.zip_code IS NULL THEN 'Zip_Unknown'
              WHEN zp.population < 20000 THEN SUBSTRING(p.zip_code, 1, 3)
              ELSE p.zip_code
            END as processed_zip_code
          FROM "Visit" v
          JOIN "Patient" p ON v.patient_id = p.id
          JOIN "diagnoses" d ON d.visit_id = v.id
          LEFT JOIN "zip_populations" zp ON zp.zip_code = p.zip_code
          WHERE DATE(v."createdAt") = DATE(${formattedDate}::timestamp)
        ),
        AggregatedData AS (
          SELECT
            icd10_code,
            age_group,
            processed_zip_code,
            COUNT(*) as occurrence_count
          FROM ProcessedData
          GROUP BY icd10_code, age_group, processed_zip_code
        )
        -- Upsert into EpiReportCache
        INSERT INTO epi_report_cache (id, age_group, zip_code, icd10_code, count, date)
        SELECT 
          gen_random_uuid(),
          age_group,
          processed_zip_code,
          icd10_code,
          occurrence_count::integer,
          ${formattedDate}::date
        FROM AggregatedData
        ON CONFLICT (age_group, zip_code, icd10_code, date)
        DO UPDATE SET count = EXCLUDED.count;
      `;

      await this.prisma.$executeRaw(rawQuery);

      this.logger.log('Daily epidemiology report generation completed successfully.');
      
      // Invalidate the cache when new data is generated
      await this.cacheManager.clear();
    } catch (error) {
      this.logger.error('Failed to generate daily epidemiology report', error);
    }
  }

  async getReport(startDate: Date, endDate: Date): Promise<unknown> {
    const cacheKey = `epi_report_${startDate.toISOString()}_${endDate.toISOString()}`;
    
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const reportData = await this.prisma.epiReportCache.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Cache the result for 12 hours
    await this.cacheManager.set(cacheKey, reportData, 12 * 60 * 60 * 1000);
    
    return reportData;
  }
}
