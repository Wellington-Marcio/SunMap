import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
export declare class RabbitService implements OnModuleInit, OnModuleDestroy {
    private conn;
    onModuleInit(): Promise<void>;
    getConnection(): amqp.Connection | null;
    onModuleDestroy(): Promise<void>;
}
export declare class RabbitModule {
}
//# sourceMappingURL=rabbit.module.d.ts.map