import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, AuditLog } from '@prisma/client';

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AuditLogUncheckedCreateInput): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data,
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.AuditLogWhereUniqueInput;
    where?: Prisma.AuditLogWhereInput;
    orderBy?: Prisma.AuditLogOrderByWithRelationInput;
  }): Promise<AuditLog[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.auditLog.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }
}
