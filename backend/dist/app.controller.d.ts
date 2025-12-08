import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): any;
    health(): Promise<{
        estado: string;
        verificacoes: any;
        tempoAtividade: number;
        dataHora: string;
    }>;
}
//# sourceMappingURL=app.controller.d.ts.map