import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client'; import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator'; import { Roles } from '../../common/decorators/roles.decorator'; import { buildPaginationMeta } from '../../common/dto/pagination-query.dto'; import { RolesGuard } from '../../common/guards/roles.guard'; import { AuthUser } from '../../common/types/auth-user.type';
import { CreateTariffDto, TariffQueryDto, UpdateTariffDto } from './dto/tariff.dto'; import { TariffsService } from './tariffs.service';
@ApiTags('tariffs') @ApiBearerAuth() @Controller('tariffs') @UseGuards(RolesGuard)
export class TariffsController { constructor(private readonly service: TariffsService) {}
  @Get() @Roles(...Object.values(RoleName)) @ApiOperation({ summary: 'Lista las tarifas' }) async all(@Query() q: TariffQueryDto) { const page=q.page??1, limit=q.limit??20; const {data,total}=await this.service.findAll(page,limit,q.search,q.status); return {data,meta:buildPaginationMeta(total,page,limit)}; }
  @Get(':id') @Roles(...Object.values(RoleName)) one(@Param('id') id:string){return this.service.findOne(id)}
  @Post() @Roles(RoleName.ADMIN) create(@Body() d:CreateTariffDto,@CurrentUser() u:AuthUser,@Req() r:Request){return this.service.create(d,u.id,r.ip)}
  @Patch(':id') @Roles(RoleName.ADMIN) update(@Param('id') id:string,@Body() d:UpdateTariffDto,@CurrentUser() u:AuthUser,@Req() r:Request){return this.service.update(id,d,u.id,r.ip)}
  @Post(':id/activate') @Roles(RoleName.ADMIN) activate(@Param('id') id:string,@CurrentUser() u:AuthUser,@Req() r:Request){return this.service.activate(id,u.id,r.ip)}
  @Post(':id/retire') @Roles(RoleName.ADMIN) retire(@Param('id') id:string,@CurrentUser() u:AuthUser,@Req() r:Request){return this.service.retire(id,u.id,r.ip)}
}
