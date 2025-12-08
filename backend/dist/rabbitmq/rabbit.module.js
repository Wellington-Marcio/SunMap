"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitModule = exports.RabbitService = void 0;
const common_1 = require("@nestjs/common");
const amqp = __importStar(require("amqplib"));
class RabbitService {
    constructor() {
        this.conn = null;
    }
    async onModuleInit() {
        const rabbitUrl = process.env.RABBITMQ_URL || `amqp://${process.env.RABBITMQ_USER || 'guest'}:${process.env.RABBITMQ_PASS || 'guest'}@${process.env.RABBITMQ_HOST || 'rabbitmq'}:${process.env.RABBITMQ_PORT || '5672'}/`;
        try {
            const c = await amqp.connect(rabbitUrl);
            this.conn = c;
            try {
                global.__amqp_conn = c;
            }
            catch (e) { }
        }
        catch (e) {
            this.conn = null;
        }
    }
    getConnection() {
        return this.conn;
    }
    async onModuleDestroy() {
        if (this.conn) {
            try {
                await this.conn.close();
            }
            catch (e) {
            }
        }
    }
}
exports.RabbitService = RabbitService;
let RabbitModule = class RabbitModule {
};
exports.RabbitModule = RabbitModule;
exports.RabbitModule = RabbitModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [RabbitService],
        exports: [RabbitService],
    })
], RabbitModule);
//# sourceMappingURL=rabbit.module.js.map