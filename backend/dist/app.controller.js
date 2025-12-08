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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const mongoose_1 = __importDefault(require("mongoose"));
const amqp = __importStar(require("amqplib"));
let AppController = class AppController {
    constructor(appService) {
        this.appService = appService;
    }
    getHello() {
        return this.appService.getHello();
    }
    async health() {
        var _a, _b, _c, _d;
        const checks = {};
        try {
            const state = (_a = mongoose_1.default === null || mongoose_1.default === void 0 ? void 0 : mongoose_1.default.connection) === null || _a === void 0 ? void 0 : _a.readyState;
            const stateMap = { 0: 'desconectado', 1: 'conectado', 2: 'conectando', 3: 'desconectando' };
            checks.mongodb = { estado: (_b = stateMap[state]) !== null && _b !== void 0 ? _b : String(state), status: state === 1 ? 'ok' : 'degradado' };
        }
        catch (e) {
            checks.mongodb = { estado: 'erro', status: 'indisponivel', erro: String(e) };
        }
        try {
            const globalKeys = ['__amqp_conn', '__AMQP_CONN', '__rabbitConn', 'AMQP_CONN', 'rabbitConnection'];
            let existingConn = undefined;
            for (const k of globalKeys) {
                if (global[k]) {
                    existingConn = global[k];
                    break;
                }
                if (process[k]) {
                    existingConn = process[k];
                    break;
                }
            }
            if (existingConn && typeof existingConn.createChannel === 'function') {
                try {
                    const ch = await existingConn.createChannel();
                    try {
                        await ch.close();
                    }
                    catch (ign) { }
                    checks.rabbitmq = { status: 'ok', conexaoReutilizada: true };
                }
                catch (e) {
                    checks.rabbitmq = { status: 'degradado', conexaoReutilizada: true, erro: String(e) };
                }
            }
            else {
                const rabbitUrl = process.env.RABBITMQ_URL || `amqp://${process.env.RABBITMQ_USER || 'guest'}:${process.env.RABBITMQ_PASS || 'guest'}@${process.env.RABBITMQ_HOST || 'rabbitmq'}:${process.env.RABBITMQ_PORT || '5672'}/`;
                const connPromise = amqp.connect(rabbitUrl);
                const conn = await Promise.race([
                    connPromise,
                    new Promise((_, rej) => setTimeout(() => rej(new Error('rabbitmq connect timeout')), 3000)),
                ]);
                try {
                    await conn.close();
                }
                catch (ign) { }
                checks.rabbitmq = { status: 'ok', conexaoReutilizada: false };
            }
        }
        catch (e) {
            checks.rabbitmq = { status: 'degradado', erro: String(e) };
        }
        const overallOk = (((_c = checks.mongodb) === null || _c === void 0 ? void 0 : _c.status) === 'ok' && ((_d = checks.rabbitmq) === null || _d === void 0 ? void 0 : _d.status) === 'ok');
        const estadoGeral = overallOk ? 'operacional' : 'degradado';
        return {
            estado: estadoGeral,
            verificacoes: checks,
            tempoAtividade: process.uptime(),
            dataHora: new Date().toISOString(),
        };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "health", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map