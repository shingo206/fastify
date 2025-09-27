import bcrypt from 'bcrypt';
import {FastifyReply} from 'fastify';
import User from '../models/user';
import {
    ForgetPasswordRequest,
    GetProfileInferredRequest,
    GetProfileRequest,
    GetUsersInferredRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UpdateUserRequest
} from '../types/request';
import {UserData} from '../types/response';

export class AuthController {
    static async register(request: RegisterRequest, reply: FastifyReply) {
        try {
            const {name, email, password, country} = request.body;
            const existingUser = await User.findOne({email});
            if (existingUser) return reply.status(409).send({
                success: false,
                error: `Email: ${email} already exist`,
            });
            const hashedPassword = await bcrypt.hash(password, 12);
            const user = new User({name, email, password: hashedPassword, country});
            const savedUser = await user.save();

            const userResponse: UserData = {
                id: savedUser.id,
                name: savedUser.name,
                email: savedUser.email,
                country: savedUser.country,
                createdAt: savedUser.createdAt,
                updatedAt: savedUser.updatedAt,
            };
            reply.status(201).send({
                success: true,
                message: 'User registered successfully',
                data: {user: userResponse}
            });
        } catch (error: any) {
            request.log.error('Registration error:', error);

            if (error.code === 11000) return reply.status(409).send({
                success: false,
                error: `User with this email already exists`
            });

            if (error.name === 'ValidationError') return reply.status(400).send({
                success: false,
                error: `Validation error: ${error.name}`
            });

            reply.status(500).send({
                success: false,
                error: `Internal Server Error during registration: ${error.message}`
            });
        }
    }


    static async login(request: LoginRequest, reply: FastifyReply) {
        try {
            const {email, password} = request.body;
            const user = await User.findOne({email}).select('-password');
            if (!user) {
                return reply.status(404).send({
                    success: false,
                    error: 'User not found'
                });
            }
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return reply.status(401).send({
                    success: false,
                    error: 'Invalid email or password'
                });
            }
            const userResponse: UserData = {
                id: user.id,
                name: user.name,
                email: user.email,
                country: user.country,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
            reply.status(201).send({
                success: true,
                message: 'Login successfully',
                data: {user: userResponse}
            });
        } catch (error: any) {
            request.log.error('Registration error:', error);
            reply.status(500).send({
                success: false,
                error: `Internal server error during login: ${error.message}`
            });
        }
    }

    static async getProfile(request: GetProfileInferredRequest, reply: FastifyReply) {
        try {
            const {id} = request.params;

            const user = await User.findById(id).select('-password');
            if (!user) return reply.status(404)
                .send({
                    success: false,
                    error: `User with id ${id} not found`
                });

            reply.status(200).send({
                success: true,
                message: 'Profile found',
                data: {user}
            });
        } catch (error: any) {
            request.log.error('Update user error:', error);

            if (error.name === 'CastError') return reply.status(400)
                .send({
                    success: false,
                    error: `Validation failed: ${error.message}`
                });

            reply.status(500).send({
                success: false,
                error: `Internal server error during registration ${error.message}`
            });
        }
    }

    static async getUsers(request: GetUsersInferredRequest, reply: FastifyReply) {
        try {
            const page = parseInt((request as any).query.page || '1');
            const limit = Math.min(parseInt((request as any).query.limit || '10'), 100);
            const search = (request as any).query.search || '';
            const skip = (page - 1) * limit;

            const searchCondition = search ? {
                $or: [
                    {name: {$regex: search, $options: "i"}},
                    {email: {$regex: search, $options: "i"}},
                    {country: {$regex: search, $options: "i"}},
                ]
            } : {};

            const users = await User.find(searchCondition)
                .select('-password')
                .skip(skip)
                .limit(limit)
                .sort({createdAt: -1});
            const total = await User.countDocuments(searchCondition);
            reply.status(200).send({
                success: true,
                data: {
                    users,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit),
                        hasNext: page * limit < total,
                        hasPrev: page > 1,
                    }
                }
            });
        } catch (error: any) {
            request.log.error(`Get users ${error.message}`);
            reply.status(500).send({
                success: false,
                error: `Internal server error: ${error.message}`
            });
        }
    }

    static async forgotPassword(request: ForgetPasswordRequest, reply: FastifyReply) {
        try {
            const {email} = request.body;
            const user = await User.findOne({email});
            if (!user) return reply.status(404).send({
                success: false,
                error: `User with email: ${email} not found`
            })
            const resetPasswordToken = crypto.randomUUID().toString();
            const resetPasswordTokenExpiry = new Date(Date.now() + 3600000);
            user.resetPasswordToken = resetPasswordToken;
            user.resetPasswordExpire = resetPasswordTokenExpiry;
            await user.save({validateBeforeSave: false});

            const resetUrl = `http://localhost:${process.env.PORT}/api/auth/resetPassword?email=${resetPasswordToken}`;
            reply.status(200).send({resetUrl});
        } catch (error: any) {
            request.log.error(`Get users ${error.message}`);
            reply.status(500).send({
                success: false,
                error: `Internal server error: ${error.message}`
            });
        }
    }

    static async resetPassword(request: ResetPasswordRequest, reply: FastifyReply) {
        try {
            const resetPasswordToken = request.params.resetPasswordToken;
            const {newPassword} = request.body;
            const user = await User.findOne({
                resetPasswordToken,
                resetPasswordExpire: {$gt: Date.now()}
            });
            // Reset password URL is invalid
            if (!user) return reply.status(404).send({
                success: false,
                error: `Reset password URL not found or expired`
            })
            user.password = await bcrypt.hash(newPassword, 12);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({validateBeforeSave: false});
            reply.status(200).send({
                success: true,
                message: 'Password reset successfully',
            });
        } catch (error: any) {
            request.log.error(`Get users ${error.message}`);
            reply.status(500).send({
                success: false,
                error: `Internal server error: ${error.message}`
            });
        }
    }

    static async updateUser(request: UpdateUserRequest, reply: FastifyReply) {
        try {
            const {id} = request.params;
            const updateUser = request.body;

            if (Object.keys(updateUser).length === 0) return reply.status(400)
                .send({
                    success: false,
                    error: `User id ${id} not found`,
                });
            // Duplicate email validation
            if (updateUser.email) {
                const existingUser = await User.findOne({
                    email: updateUser.email,
                    _id: {$ne: id}
                }).select('-password');
                if (existingUser) return reply.status(409).send({
                    success: false,
                    error: `Email ${updateUser.email} is already in use`
                })
            }
            const user = await User.findByIdAndUpdate(id, updateUser, {new: true, runValidators: true});
            if (user) return reply.status(404).send({
                success: false,
                message: 'User not found'
            })
            reply.status(200).send({
                success: true,
                message: 'User updated successfully',
                data: {user}
            })
        } catch (error: any) {
            request.log.error('Update user error:', error);

            if (error.name === 'CastError') return reply.status(400).send({
                success: false,
                error: `Invalid user ID format: ${error.message}`
            });

            if (error.name === 'ValidationError') return reply.status(400).send({
                success: false,
                error: `Validation failed: ${error.message}`
            });

            reply.status(500).send({
                success: false,
                error: `Internal server error: ${error.message}`
            });
        }
    }

    static async deleteUser(request: GetProfileRequest, reply: FastifyReply) {
        try {
            const {id} = request.params;
            const user = await User.findByIdAndDelete(id).select('-password');
            if (!user) return reply.status(404).send({
                success: false,
                message: 'User not found'
            })
            reply.status(204).send({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error: any) {
            request.log.error('Deleted user error', error);

            if (error.name === 'CastError') return reply.status(400).send({
                success: false,
                error: `Invalid user ID format: ${error.message}`
            })

            reply.status(500).send({
                success: false,
                error: `Internal server error: ${error.message}`
            });
        }
    }
}

