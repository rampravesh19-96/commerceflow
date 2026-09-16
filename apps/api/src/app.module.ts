import { Module } from '@nestjs/common';
import { CommerceController } from './commerce.controller';
import { CommerceService } from './commerce.service';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';
@Module({ controllers: [CommerceController], providers: [CommerceService, PrismaService, RedisService] })
export class AppModule {}
