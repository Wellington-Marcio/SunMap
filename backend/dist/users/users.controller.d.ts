import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    list(page?: number, limit?: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./schemas/user.schema").UserDocument, {}, {}> & import("./schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    seed(body: {
        email: string;
        password: string;
    }): Promise<import("mongoose").Document<unknown, {}, import("./schemas/user.schema").UserDocument, {}, {}> & import("./schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    create(body: any): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/user.schema").UserDocument, {}, {}> & import("./schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | (import("./schemas/user.schema").User & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })>;
}
//# sourceMappingURL=users.controller.d.ts.map