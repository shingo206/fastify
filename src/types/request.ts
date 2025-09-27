import {FastifyRequest} from 'fastify';

export interface RegisterRequest extends FastifyRequest {
    body: {
        name: string;
        email: string;
        password: string;
        country?: string;
    };
}

export interface LoginRequest extends FastifyRequest {
    body: {
        email: string;
        password: string;
    };
}

export interface GetProfileRequest extends FastifyRequest {
    params: {
        id: string;
    };
}

export type GetProfileInferredRequest = FastifyRequest<{ Params: GetProfileRequest['params'] }>

export interface GetUsersRequest extends FastifyRequest {
    querystring: {
        page?: string;
        limit?: string;
        search?: string;
    };
}

export interface ForgetPasswordRequest extends FastifyRequest {
    body: {
        email: string;
    };
}

export interface ResetPasswordRequest extends FastifyRequest {
    params: {
        resetPasswordToken: string;
    },
    body: {
        newPassword: string;
    }
}

export type GetUsersInferredRequest = FastifyRequest<{ Querystring: GetUsersRequest['querystring'] }>

// ユーザー関連のリクエストインターフェース
export interface UpdateUserRequest extends FastifyRequest {
    params: {
        id: string;
    };
    body: {
        name?: string;
        email?: string;
        country?: string;
    };
}

export interface ChangePasswordRequest extends FastifyRequest {
    params: {
        id: string;
    };
    body: {
        currentPassword: string;
        newPassword: string;
    };
}

// 共通のクエリパラメータインターフェース
export interface PaginationQuery {
    page?: string;
    limit?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}

export interface SearchQuery extends PaginationQuery {
    search?: string;
}

// 汎用的なリクエストインターフェース
export interface IdParamsRequest extends FastifyRequest {
    params: {
        id: string;
    };
}

export interface PaginatedRequest extends FastifyRequest {
    querystring: PaginationQuery;
}

export interface SearchRequest extends FastifyRequest {
    querystring: SearchQuery;
}
