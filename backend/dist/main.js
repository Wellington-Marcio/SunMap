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
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const users_service_1 = require("./users/users.service");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    var _a, _b;
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    try {
        const usersService = app.get(users_service_1.UsersService);
        const adminEmail = (_a = process.env.DEFAULT_ADMIN_EMAIL) !== null && _a !== void 0 ? _a : 'admin@sunmap.com';
        const adminPassword = (_b = process.env.DEFAULT_ADMIN_PASSWORD) !== null && _b !== void 0 ? _b : '123456';
        await usersService.ensureDefaultAdmin(adminEmail, adminPassword);
    }
    catch (err) {
    }
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.enableCors();
    const envPort = process.env.PORT ? Number(process.env.PORT) : 3001;
    const fallbackEnabled = String(process.env.PORT_FALLBACK || '').toLowerCase() === 'true';
    const portsToTry = fallbackEnabled ? [envPort, envPort + 1, envPort + 2] : [envPort];
    for (let i = 0; i < portsToTry.length; i++) {
        const p = portsToTry[i];
        try {
            await app.listen(p);
            console.log(`Listening on port ${p}`);
            break;
        }
        catch (err) {
            if (err && err.code === 'EADDRINUSE') {
                console.warn(`Port ${p} already in use.`);
                if (i === portsToTry.length - 1) {
                    throw err;
                }
                continue;
            }
            throw err;
        }
    }
}
bootstrap();
//# sourceMappingURL=main.js.map