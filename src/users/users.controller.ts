import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter dados do perfil do usuário autenticado' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil retornado com sucesso.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido ou não fornecido.',
  })
  async getProfile(@CurrentUser('id') userId: number): Promise<UserResponseDto> {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar dados do perfil do usuário autenticado' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil atualizado com sucesso.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Nome de usuário já em uso.',
  })
  async updateProfile(
    @CurrentUser('id') userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(userId, updateUserDto);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alterar a senha da conta autenticada' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Senha alterada com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Senha atual incorreta.',
  })
  async updatePassword(
    @CurrentUser('id') userId: number,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(userId, updatePasswordDto);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir permanentemente a conta do usuário autenticado' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Conta excluída com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Usuário possui lojas vinculadas ativas.',
  })
  async deleteAccount(@CurrentUser('id') userId: number): Promise<void> {
    return this.usersService.delete(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter perfil público de um usuário por ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil público retornado.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário não encontrado.',
  })
  async getPublicProfile(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findPublicProfile(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar usuários com paginação e busca' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de usuários.',
  })
  async findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }
}
