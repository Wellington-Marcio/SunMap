import { UsersService } from '../users/users.service';
declare const JwtStrategy_base: new (...args: any) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private usersService;
    private readonly logger;
    constructor(usersService: UsersService);
    validate(payload: any): Promise<{
        _id: any;
        email: any;
        roles: any;
        name: any;
        username: any;
    }>;
}
export {};
//# sourceMappingURL=jwt.strategy.d.ts.map