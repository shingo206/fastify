import {FastifyInstance, FastifyPluginOptions, FastifySchema} from 'fastify';
import {AuthController} from '../controllers/authController';
// Import only the request interfaces that are needed for routing
import {
    ForgetPasswordRequest,
    GetProfileRequest,
    GetUsersRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UpdateUserRequest
} from '../types/request';
// Import the response types to use as generic arguments for the response schema
import {
    BaseResponse,
    ErrorResponse,
    LoginResponse,
    RegisterResponse,
    UserResponse,
    UsersResponse
} from '../types/response';

const userDataSchema = {
    type: 'object',
    properties: {
        id: {type: 'string'},
        name: {type: 'string'},
        email: {type: 'string'},
        country: {type: 'string'},
        createdAt: {type: 'string'},
        updatedAt: {type: 'string'},
    }
};

// Common successful response wrapper schema for single user operations
const successUserResponseSchema = (message: string, status: number) => ({
    [status]: {
        type: 'object',
        properties: {
            success: {type: 'boolean'},
            message: {type: 'string', example: message},
            data: {
                type: 'object',
                properties: {
                    user: userDataSchema
                }
            }
        }
    }
});

// Common error response wrapper schema
const errorResponseSchema = (status: number) => ({
    [status]: {
        type: 'object',
        properties: {
            success: {type: 'boolean', example: false},
            error: {type: 'string', description: 'Error message'},
            details: {type: 'string', description: 'Optional error details'},
        }
    }
});

interface DocumentationSchema extends FastifySchema {
    // These properties are added by documentation plugins (like @fastify/swagger)
    description?: string;
    tags?: string[];
    summary?: string;
    // ... any other properties your documentation plugin supports
}

const authRoutes = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
    // -- Register User --
    fastify.post<{
        Body: RegisterRequest['body'],
        Reply: RegisterResponse | ErrorResponse
    }>('/register', {
        schema: {
            description: 'Register a new user',
            tags: ['Authentication'],
            body: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                    name: {
                        type: 'string',
                        description: 'The name of the user',
                        example: 'Tom Smith',
                        minLength: 3,
                        maxLength: 50,
                        required: true,
                    },
                    email: {
                        type: 'string',
                        description: 'User email address',
                        example: 'TomSmith@example.com',
                        format: 'email',
                        required: true,
                    },
                    password: {
                        type: 'string',
                        minLength: 6,
                        description: 'Password must be at least 6 characters',
                        required: true,
                    },
                    country: {
                        type: 'string',
                        description: 'Country',
                        example: 'USA',
                        minLength: 6,
                        maxLength: 50,
                        required: false,
                    }
                }
            },
            response: {
                ...successUserResponseSchema('User registered successfully', 201),
                ...errorResponseSchema(409), // Conflict for existing email
            }
        } as DocumentationSchema,
    }, AuthController.register);
    // --- Login User ---
    fastify.post<{
        Body: LoginRequest['body'],
        Reply: LoginResponse | ErrorResponse
    }>('/login', {
        schema: {
            description: 'Login user',
            tags: ['Authentication'],
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: {
                        type: 'string',
                        description: 'User email address',
                        example: 'TomSmith@example.com',
                        format: 'email',
                        required: true,
                    },
                    password: {
                        type: 'string',
                        minLength: 6,
                        description: 'Password must be at least 6 characters',
                        required: true,
                    },
                }
            },
            response: {
                // Note: AuthController.login returns 201, not 200, despite LoginResponse suggesting 200
                ...successUserResponseSchema('Login successful', 201),
                ...errorResponseSchema(401), // Unauthorized for invalid credentials
                ...errorResponseSchema(404), // Not Found for user not found
            }
        } as DocumentationSchema,
    }, AuthController.login);
    // --- Logout User ---
    fastify.post('/logout', AuthController.logout);
    // --- Forget Password ---
    fastify.post<{
        Body: ForgetPasswordRequest['body'],
        Reply: UserResponse | ErrorResponse
    }>('/forget-password', {
        schema: {
            description: 'Forget user password',
            tags: ['Authentication'],
            body: {
                type: 'object',
                required: ['email'],
                properties: {
                    email: {
                        type: 'string',
                        description: 'User email address',
                        example: 'TomSmith@example.com',
                        format: 'email',
                        required: true,
                    },
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        resetUrl: {
                            type: 'string',
                            description: 'Reset URL',
                            required: true
                        },
                    }
                },
                ...errorResponseSchema(404), // Not Found
            }
        } as DocumentationSchema,
    }, AuthController.forgotPassword);
    // --- Reset Password ---
    fastify.post<{
        Params: ResetPasswordRequest['params'],
        Body: ResetPasswordRequest['body'],
        Reply: UserResponse | ErrorResponse
    }>('/reset-password/:resetPasswordToken', {
        schema: {
            description: 'Reset user password',
            tags: ['Authentication'],
            params: {
                resetPasswordToken: {
                    type: 'string',
                    description: 'Reset user password token',
                    required: true,
                }
            },
            body: {
                type: 'object',
                required: ['newPassword'],
                properties: {
                    newPassword: {
                        type: 'string',
                        description: 'New password',
                        required: true,
                    },
                }
            },
            response: {
                ...successUserResponseSchema('Reset password successfully', 200),
                ...errorResponseSchema(404), // Not Found
            }
        } as DocumentationSchema,
    }, AuthController.resetPassword);
    // --- Get User Profile by ID ---
    fastify.get<{
        Params: GetProfileRequest['params'],
        Reply: UserResponse | ErrorResponse
    }>('/profile/:id', {
        schema: {
            description: 'Get user profile by ID',
            tags: ['Authentication'],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        description: 'User ID',
                        example: '1',
                        required: true,
                    },
                }
            },
            response: {
                ...successUserResponseSchema('Profile found', 200),
                ...errorResponseSchema(404), // Not Found
            }
        } as DocumentationSchema,
    }, AuthController.getProfile);
    // --- Get Users list ---
    fastify.get<{
        Querystring: GetUsersRequest['querystring'],
        Reply: UsersResponse | ErrorResponse
    }>('/users', {
        schema: {
            description: 'Get users list with pagination and search',
            tags: ['Authentication'],
            querystring: {
                type: 'object',
                properties: {
                    page: {
                        type: 'string',
                        description: 'Page number (default: 1)',
                    },
                    limit: {
                        type: 'string',
                        description: 'Item per page (default: 10, max: 100)',
                    },
                    search: {
                        type: 'string',
                        description: 'search term for name, email, or country',
                    },
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean'},
                        message: {type: 'string'},
                        data: {
                            type: 'object',
                            properties: {
                                users: {
                                    type: 'array',
                                    items: userDataSchema
                                },
                                pagination: {
                                    type: 'object',
                                    properties: {
                                        page: {type: 'number'},
                                        limit: {type: 'number'},
                                        total: {type: 'number'},
                                        pages: {type: 'number'},
                                        hasNext: {type: 'boolean'},
                                        hasPrev: {type: 'boolean'},
                                    }
                                }
                            }
                        }
                    }
                },
                ...errorResponseSchema(500), // Internal server error
            }
        } as DocumentationSchema,
    }, AuthController.getUsers);

    fastify.put<{
        Params: UpdateUserRequest['params'],
        Body: UpdateUserRequest['body'],
        Reply: UserResponse | ErrorResponse
    }>('/profile/:id', {
        schema: {
            description: 'Update user profile by ID',
            tags: ['Authentication'],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        description: 'User ID',
                        example: '1',
                        required: true,
                    },
                }
            },
            body: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                    name: {
                        type: 'string',
                        description: 'The name of the user',
                        example: 'Tom Smith',
                        minLength: 3,
                        maxLength: 50,
                        required: true,
                    },
                    email: {
                        type: 'string',
                        description: 'User email address',
                        example: 'TomSmith@example.com',
                        format: 'email',
                        required: true,
                    },
                    country: {
                        type: 'string',
                        description: 'Country',
                        example: 'USA',
                        minLength: 6,
                        maxLength: 50,
                        required: false,
                    }
                }
            },
            response: {
                ...successUserResponseSchema('User updated successfully', 200),
                ...errorResponseSchema(400), // Bad Request (validation/cast error)
                ...errorResponseSchema(404), // Not Found
                ...errorResponseSchema(409), // Conflict (duplicate email)
            }
        } as DocumentationSchema,
    }, AuthController.updateUser);

    fastify.delete<{
        Params: GetProfileRequest['params'],
        Reply: BaseResponse | ErrorResponse
    }>('/profile/:id', {
        schema: {
            description: 'Get user profile by ID',
            tags: ['Authentication'],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        description: 'User ID',
                        example: '1',
                        required: true,
                    },
                }
            },
            response: {
                204: {
                    type: 'object',
                    properties: {
                        success: {type: 'boolean', example: true},
                        message: {type: 'string', example: 'User deleted successfully'},
                    }
                },
                ...errorResponseSchema(404), // Not Found
                ...errorResponseSchema(400), // Bad Request (CastError)
            }
        } as DocumentationSchema,
    }, AuthController.deleteUser);
};

export default authRoutes;
