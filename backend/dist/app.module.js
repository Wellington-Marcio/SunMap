"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const app_controller_1 = require("./app.controller");
const api_controller_1 = require("./api.controller");
const app_service_1 = require("./app.service");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const weather_module_1 = require("./weather/weather.module");
const rabbit_module_1 = require("./rabbitmq/rabbit.module");
function buildMongoUri() {
    if (process.env.MONGO_URI && process.env.MONGO_URI.length > 0) {
        return process.env.MONGO_URI;
    }
    const host = process.env.MONGO_HOST || 'localhost';
    const port = process.env.MONGO_PORT || '27017';
    const db = process.env.MONGO_DB || 'sunmap';
    const user = process.env.MONGO_USER;
    const pass = process.env.MONGO_PASS;
    if (user && pass) {
        return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}?authSource=admin`;
    }
    return `mongodb://${host}:${port}/${db}`;
}
const logger = new common_1.Logger('AppModule');
const mongoUri = buildMongoUri();
logger.log(`Using MongoDB URI: ${mongoUri.replace(/(^mongodb:\/\/)(?:.*@)?/, '$1<REDACTED>@')}`);
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forRoot(mongoUri),
            rabbit_module_1.RabbitModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            weather_module_1.WeatherModule,
        ],
        controllers: [app_controller_1.AppController, api_controller_1.ApiController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map