import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';
import { CommerceService } from './commerce.service';
class ItemDto {
  @IsString() variantId!: string;
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}
class CheckoutDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => ItemDto) items!: ItemDto[];
  @IsOptional() @IsString() couponCode?: string;
  @IsString() @IsNotEmpty() idempotencyKey!: string;
}
class StatusDto {
  @IsEnum(OrderStatus) status!: OrderStatus;
}
class WebhookDto {
  @IsString() eventId!: string;
  @IsString() orderId!: string;
}
@Controller()
export class CommerceController {
  constructor(private commerce: CommerceService) {}
  @Get('health') health() {
    return { status: 'ok', service: 'commerceflow-api' };
  }
  @Get('products') products(@Query('q') q?: string, @Query('category') category?: string) {
    return this.commerce.catalog(q, category);
  }
  @Get('dashboard') dashboard() {
    return this.commerce.dashboard();
  }
  @Get('orders') orders() {
    return this.commerce.orders();
  }
  @Get('orders/:id') order(@Param('id') id: string) {
    return this.commerce.order(id);
  }
  @Patch('orders/:id/status') status(@Param('id') id: string, @Body() body: StatusDto) {
    return this.commerce.updateOrder(id, body.status);
  }
  @Post('checkout') checkout(@Body() body: CheckoutDto) {
    return this.commerce.checkout('demo-customer-id', body);
  }
  @Post('webhooks/demo-payment') webhook(@Body() body: WebhookDto) {
    return this.commerce.webhook(body.eventId, body.orderId);
  }
}
