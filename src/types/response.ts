
export interface BaseResponse {
    success: boolean;
    message?: string;
}

export interface ErrorResponse extends BaseResponse {
    success: false;
    error: string;
    details?: string;
}

export interface SuccessResponse<T = any> extends BaseResponse {
    success: true;
    data?: T;
}

export interface UserData {
    id: string;
    name: string;
    email: string;
    country?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserResponse extends SuccessResponse<{ user: UserData }> {}

export interface UsersResponse extends SuccessResponse<{
    users: UserData[];
    pagination: PaginationData;
}> {}

export interface PaginationData {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface RegisterResponse extends SuccessResponse<{ user: UserData }> {
    message: 'User registered successfully';
}

export interface LoginResponse extends SuccessResponse<{ user: UserData }> {
    message: 'Login successful';
}


export interface ApiInfoResponse extends SuccessResponse<{
    name: string;
    version: string;
    description: string;
    author: string;
    endpoints: {
        auth: string;
        docs: string;
    };
}> {}

export interface HealthCheckResponse extends SuccessResponse {
    message: 'API is running successfully';
    timestamp: string;
    version: string;
}

export interface DatabaseTestResponse extends SuccessResponse<{
    database: string;
    timestamp: string;
}> {}
