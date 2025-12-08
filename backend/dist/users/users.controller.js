"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const users_service_1 = require("./users.service");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const create_user_dto_1 = require("./dto/create-user.dto");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async list(page = 1, limit = 10) {
        const maxLimit = 100;
        if (limit > maxLimit)
            limit = maxLimit;
        if (page < 1)
            page = 1;
        return this.usersService.list(page, limit);
    }
    async seed(body) {
        const email = body.email;
        const password = body.password;
        return this.usersService.ensureDefaultAdmin(email, password);
    }
    async create(body) {
        const dto = (0, class_transformer_1.plainToInstance)(create_user_dto_1.CreateUserDto, body);
        const errors = await (0, class_validator_1.validate)(dto);
        if (errors && errors.length > 0) {
            throw new common_1.BadRequestException({ message: 'Invalid payload', details: errors });
        }
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) {
            throw new common_1.BadRequestException('User already exists');
        }
        const created = await this.usersService.create(dto.email, dto.password, ['user']);
        const obj = created.toObject ? created.toObject() : created;
        if (obj && 'passwordHash' in obj)
            delete obj.passwordHash;
        return obj;
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe('1'), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe('10'), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('seed'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "seed", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('api/users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map