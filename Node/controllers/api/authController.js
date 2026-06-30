const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/dbDirect');
const responseFormatter = require('../../middlewares/responseFormatter');
const { validateRequiredFields } = require('../../utils/validator');
const { sendEmail } = require('../../utils/emailService');
const imagePath = require('../../utils/imagePath');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const crypto = require("crypto");
const { getApiLanguage, getLocalizedMessage } = require('../../utils/apiLanguageHelper');
const ciamService = require('../../ciam/ciam.service');
const { attemptTokenRefresh } = require('../../utils/ciamTokenHelper');
require('dotenv').config();

function minutesToHHMM(minutes) {
    if (!minutes && minutes !== 0) return null;
    const hh = Math.floor(minutes / 60).toString().padStart(2, "0");
    const mm = (minutes % 60).toString().padStart(2, "0");
    return `${hh}:${mm}`;
}

function formatInputValue(category, inputValue) {
    if (inputValue == null) return null;
    if (category.is_time === "1") {
        return minutesToHHMM(Number(inputValue));
    }
    if (category.unit) {
        return `${inputValue} ${category.unit}`;
    }
    return inputValue.toString();
}

class ApiController {

    // POST /api/auth/register
    static async register(req, res) {
        try {
            const body = req.body || {};
            const { name, email, password, image, token } = body;
            const fieldMap = { name: 'Name', email: 'Email', password: 'Password' };

            const error = await validateRequiredFields(body, fieldMap);
            if (error != true) {
                return res.error(error);
            }

            // Check if email already exists using direct SQL
            const existingUser = await db.queryOne(
                `SELECT id FROM users WHERE email = ? AND deletedAt IS NULL`,
                [email]
            );
            if (existingUser) {
                return res.error(getLocalizedMessage(req, 'Email already in use'));
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newToken = token || crypto.randomBytes(32).toString('hex');

            // Insert user using direct SQL
            await db.query(
                `INSERT INTO users (name, email, password, role, status, image, token, createdAt, updatedAt) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())`,
                [name, email, hashedPassword, 'user', '1', image || null, newToken]
            );

            // Fetch the newly created user
            const newUser = await db.queryOne(
                `SELECT id, name, email, role, status, image FROM users WHERE email = ?`,
                [email]
            );

            await sendEmail({
                to: email,
                subject: 'GDRFA - Welcome to Our Platform!',
                template: 'email-reset-password-template.ejs',
                data: {
                    title: 'Welcome to Our Platform!',
                    username: name || 'User',
                    logoUrl: `${req.protocol}://${req.get('host')}/assets/images/Group.png`,
                    resetLink: `${process.env.APP_URL}/dashboard`,
                    buttonText: 'Get Started',
                    role: 'user'
                }
            });

            const jwtToken = jwt.sign(
                { id: newUser.id, role: newUser.role },
                process.env.JWT_SECRET,
                { expiresIn: '1y' }
            );

            return res.success({ token: jwtToken, user: newUser }, getLocalizedMessage(req, 'User registered successfully'));
        } catch (error) {
            console.error('Register error:', error);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    // POST /api/auth/login
    static async login(req, res) {
        try {
            const body = req.body || {};
            const { username, password } = body;
            const fieldMap = { username: 'Username', password: 'Password' };

            const error = await validateRequiredFields(body, fieldMap);
            if (error != true) {
                return res.error(error);
            }

            // Get language preference from headers or query
            const preferredLang = req.headers['accept-language']?.startsWith('ar') ? 'ar' :
                (req.query.lng || req.cookies?.lang || 'en');

            // ciam Auth Logic 
            const responseOfUser = await ciamService.auth({ userName: username, password });
            if (responseOfUser.isError) {
                return res.error(getLocalizedMessage(req, 'Invalid email or password'));
            }

            let detailsOfUser = await ciamService.getUserByDomainId(responseOfUser.value.userDomain.split(','), responseOfUser.value.accessToken);
            let user;
            if (detailsOfUser?.isError || detailsOfUser == null) {
                console.warn('[Auth] CIAM getUserByDomainId failed after login — using auth response data');
                user = {
                    userDomain: responseOfUser.value.userDomain,
                    nameEn: responseOfUser.value.userDomain,
                    emailAddress: '',
                    img: null,
                    currentManagerUserDomain: null
                };
            } else {
                user = detailsOfUser.value[0];
            }
            console.log('User details fetched from CIAM:', user);
            // Store language preference in session
            if (req.session) {
                req.session.lng = preferredLang;
            }

            // Set language cookie with long expiration
            res.cookie('lang', preferredLang, {
                maxAge: 365 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                path: '/'
            });

            return res.success(
                {
                    jwtToken: responseOfUser.value.accessToken,
                    refreshToken: responseOfUser.value.refreshToken,
                    accessTokenExpiry: responseOfUser.value.accessTokenExpirationUtcDateTime,
                    user: {
                        assignedTo: user.currentManagerUserDomain,
                        image: user.img,
                        email: user.emailAddress,
                        name: user.nameEn,
                        id: user.userDomain
                    },
                    language: preferredLang
                },
                getLocalizedMessage(req, 'Logged in successfully')
            );
        } catch (error) {
            console.error('Login error:', error);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    // GET /api/auth/profile
    static async getProfile(req, res) {
        try {
            const userId = req.user.id;
            console.log('Fetching profile for userId:', userId);
            let myUserInfo = await ciamService.getUserByDomainId(userId.split(','), req.headers.authorization);
            if (myUserInfo?.isError || myUserInfo == null) {
                const refreshed = await attemptTokenRefresh(req);
                if (refreshed.accessToken) {
                    myUserInfo = await ciamService.getUserByDomainId(userId.split(','), refreshed.accessToken);
                }
            }
            let user;
            if (myUserInfo?.isError || myUserInfo == null) {
                console.warn('[Auth] CIAM getUserByDomainId failed for getProfile — using basic JWT data');
                user = {
                    userDomain: userId,
                    nameEn: userId,
                    emailAddress: '',
                    mobile: '',
                    sex: null,
                    birthDate: null,
                    sectorID: null,
                    deptID: null,
                    sectionID: null,
                    branchID: null,
                    rankID: null,
                    img: null,
                    currentManagerUserDomain: null
                };
            } else {
                user = myUserInfo.value[0];
            }

            // Fetch latest evaluation with categories
            let latestEvaluation = null;
            try {
                const evaluation = await db.queryOne(
                    `SELECT TOP 1 id as evaluation_id, total_points, createdAt as evaluation_date
                    FROM evaluations
                    WHERE user_id = ? AND deletedAt IS NULL
                     ORDER BY createdAt DESC`,
                    [userId]
                );

                if (evaluation) {
                    // Fetch evaluation categories
                    const categories = await db.query(
                        `SELECT 
                            fc.id as category_id,
                            fc.name as category_name,
                            er.value as input_value,
                            fc.unit,
                            er.result as result_points,
                            eval.total_points,
                            eval.evaluation_points,
                            er.createdAt as last_update
                            FROM evaluation_results er
                            JOIN fitness_categories fc ON er.fitness_category_id = fc.id
                         JOIN evaluations eval ON er.evaluation_id = eval.id
                         WHERE er.evaluation_id = ? AND er.deletedAt IS NULL`,
                        [evaluation.evaluation_id]
                    );

                    latestEvaluation = {
                        evaluation_id: evaluation.evaluation_id,
                        total_points: evaluation.total_points,
                        evaluation_date: evaluation.evaluation_date,
                        categories: categories || []
                    };
                }
            } catch (evalError) {
                console.error('Error fetching evaluation data:', evalError.message);
                // Continue without evaluation data
                latestEvaluation = null;
            }
            console.log('Latest evaluation data:', latestEvaluation);
            const getAge = d => { const b = new Date(d); const t = new Date(); return t.getFullYear() - b.getFullYear() - (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate()) ? 1 : 0); };
            // Transform data into proper objects
            const formattedUser = {
                id: user?.userDomain,
                name: user?.nameEn,
                email: user?.emailAddress,
                mobile: user?.mobile,
                gender: user?.sex == 1 ? 'Male' : 'Female',
                dob: user?.birthDate,
                age: getAge(user?.birthDate),
                sector: user?.sectorID,
                department: user?.deptID,
                section: user?.sectionID,
                branch: user?.branchID,
                rank: user?.rankID,
                jobTitle: user?.jobTitleEN,
                workSystem: user?.workSystem,
                assignedTo: user?.currentManagerUserDomain,
                status: user?.status || 1,
                image: user?.img,
                // role: user?.role,
                departmentData: user?.deptID ? { id: user?.deptID, name: user?.deptNameEN, deptNameAR: user?.deptNameAR } : null,
                sectorData: user?.sectorID ? { id: user?.sectorID, name: user?.sectorNameEN, sectorNameAR: user?.sectorNameAR } : null,
                sectionData: user?.sectionID ? { id: user?.sectionID, name: user?.sectionNameEn, sectionNameAr: user?.sectionNameAr } : null,
                branchData: user?.branchID ? { id: user?.branchID, name: user?.branchNameEN, branchNameAR: user?.branchNameAR } : null,
                rankData: user?.rankID ? { id: user?.rankID, name: user?.rankEN, rankAR: user?.rankAR } : null,
                jobTitleData: user?.jobID ? { id: user?.jobID, name: user?.jobTitleEN, jobTitleAR: user?.jobTitleAR } : null,
                manager: user?.managerName ? { id: user?.managerId, name: user?.managerName } : null,
                latestEvaluation: latestEvaluation
            };
            return res.success(formattedUser, getLocalizedMessage(req, 'Profile fetched successfully'));
        } catch (error) {
            console.error('Error fetching profile:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    // POST /api/auth/logout
    static async logout(req, res) {
        try {
            // const userId = req.user.id;

            // Clear FCM token
            // await db.query(
            //     `UPDATE users SET fcm_token = NULL WHERE id = ?`,
            //     [userId]
            // );

            return res.success({}, getLocalizedMessage(req, 'Logged out successfully'));
        } catch (error) {
            console.error('Error logging out:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    // POST /api/auth/update-profile
    static async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const {
                name,
                email,
                mobile,
                gender,
                dob,
                age,
                sector,
                department,
                section,
                branch,
                rank,
                jobTitle,
                workSystem,
                assignedTo,
            } = req.body;

            const fieldMap = {
                name: 'Name',
                email: 'Email',
                mobile: 'Mobile',
                dob: 'Date of Birth',
                sector: 'Sector',
                department: 'Department',
                section: 'Section',
                branch: 'Branch',
                rank: 'Rank',
                jobTitle: 'Job Title',
            };

            const error = await validateRequiredFields(req.body, fieldMap);
            if (error !== true) {
                return res.error(error);
            }

            // Fetch current user
            const user = await db.queryOne(
                `SELECT image FROM users WHERE id = ?`,
                [userId]
            );

            if (!user) {
                return res.error(getLocalizedMessage(req, 'User not found'));
            }

            let image = user.image;

            // Handle image upload if provided
            if (req.file) {
                if (user.image && fs.existsSync(path.join(__dirname, '../../', user.image))) {
                    fs.unlinkSync(path.join(__dirname, '../../', user.image));
                }
                image = `uploads/${imagePath(req.file.path.replace(/\\/g, '/'))}`;
            }

            // Check email uniqueness
            const existingUser = await db.queryOne(
                `SELECT id FROM users WHERE email = ? AND id != ? AND deletedAt IS NULL`,
                [email, userId]
            );
            if (existingUser) {
                return res.error(getLocalizedMessage(req, 'Email already exists!'));
            }

            const dobFormatted = dob ? moment(dob, 'DD-MM-YYYY').format('YYYY-MM-DD') : null;

            // Update user using direct SQL
            await db.query(
                `UPDATE users SET name = ?, email = ?, mobile = ?, gender = ?, dob = ?, age = ?, 
                 sector = ?, department = ?, section = ?, branch = ?, rank = ?, jobTitle = ?, 
                 workSystem = ?, assignedTo = ?, image = ?, updatedAt = GETDATE() WHERE id = ?`,
                [name, email, mobile, gender, dobFormatted, age, sector, department, section, branch, rank, jobTitle, workSystem, assignedTo || null, image, userId]
            );

            // Fetch updated user with all organizational data
            const updatedUser = await db.queryOne(
                `SELECT u.id, u.name, u.email, u.mobile, u.gender, u.dob, u.age,
                        u.sector, u.department, u.section, u.branch, u.rank, u.jobTitle,
                        u.workSystem, u.assignedTo, u.status, u.image, u.createdAt, u.role,
                        sec.name as sectorName, sec.id as sector_id,
                        dep.name as departmentName, dep.id as department_id,
                        sec_t.name as sectionName, sec_t.id as section_id,
                        bra.name as branchName, bra.id as branch_id,
                        ran.name as rankName, ran.id as rank_id,
                        jt.name as jobTitleName, jt.id as jobTitle_id
                 FROM users u
                 LEFT JOIN sectors sec ON u.sector = sec.id
                 LEFT JOIN departments dep ON u.department = dep.id
                 LEFT JOIN sections sec_t ON u.section = sec_t.id
                 LEFT JOIN branches bra ON u.branch = bra.id
                 LEFT JOIN ranks ran ON u.rank = ran.id
                 LEFT JOIN job_titles jt ON u.jobTitle = jt.id
                 WHERE u.id = ? AND u.deletedAt IS NULL`,
                [userId]
            );

            const BASE_URL = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

            const responseData = {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                mobile: updatedUser.mobile,
                gender: updatedUser.gender,
                dob: updatedUser.dob,
                age: updatedUser.age,
                workSystem: updatedUser.workSystem,
                role: updatedUser.role,
                assignedTo: updatedUser.assignedTo,
                image: updatedUser.image ? `${BASE_URL}/${updatedUser.image}` : null,
                sector: updatedUser.sectorName ? { id: updatedUser.sector_id, name: updatedUser.sectorName } : null,
                department: updatedUser.departmentName ? { id: updatedUser.department_id, name: updatedUser.departmentName } : null,
                section: updatedUser.sectionName ? { id: updatedUser.section_id, name: updatedUser.sectionName } : null,
                branch: updatedUser.branchName ? { id: updatedUser.branch_id, name: updatedUser.branchName } : null,
                rank: updatedUser.rankName ? { id: updatedUser.rank_id, name: updatedUser.rankName } : null,
                jobTitle: updatedUser.jobTitleName ? { id: updatedUser.jobTitle_id, name: updatedUser.jobTitleName } : null,
            };

            return res.success(responseData, getLocalizedMessage(req, 'User profile updated successfully'));
        } catch (error) {
            console.error('Error updating profile:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    // POST /api/auth/refresh-token
    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body || {};
            if (!refreshToken) {
                return res.status(401).json({ status: false, message: getLocalizedMessage(req, 'Refresh token required') });
            }

            const currentToken = req.headers.authorization?.split(' ')[1];

            const result = await ciamService.authRefreshToken(currentToken, refreshToken);

            if (result?.isError || !result?.value?.accessToken) {
                return res.status(401).json({ status: false, message: getLocalizedMessage(req, 'Token refresh failed') });
            }

            return res.success({
                accessToken: result.value.accessToken,
                refreshToken: result.value.refreshToken,
                accessTokenExpiry: result.value.accessTokenExpirationUtcDateTime,
            }, getLocalizedMessage(req, 'Token refreshed successfully'));
        } catch (error) {
            console.error('Refresh token error:', error);
            return res.status(401).json({ status: false, message: getLocalizedMessage(req, 'Token refresh failed') });
        }
    }

    // POST /api/auth/change-password
    static async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { oldPassword, newPassword, confirmPassword } = req.body;

            if (!oldPassword || !newPassword || !confirmPassword) {
                return res.error(getLocalizedMessage(req, 'All fields are required'));
            }

            if (newPassword !== confirmPassword) {
                return res.error(getLocalizedMessage(req, 'Passwords do not match'));
            }

            // Fetch user password
            const user = await db.queryOne(
                `SELECT password FROM users WHERE id = ?`,
                [userId]
            );

            if (!user) {
                return res.error(getLocalizedMessage(req, 'User not found'));
            }

            // Verify current password
            const validPassword = await bcrypt.compare(oldPassword, user.password);
            if (!validPassword) {
                return res.error(getLocalizedMessage(req, 'Current password is incorrect'));
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password
            await db.query(
                `UPDATE users SET password = ?, updatedAt = GETDATE() WHERE id = ?`,
                [hashedPassword, userId]
            );

            return res.success({}, getLocalizedMessage(req, 'Password changed successfully'));
        } catch (error) {
            console.error('Error changing password:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    // POST /api/auth/forgot-password
    static async postForgotPassword(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.error(getLocalizedMessage(req, 'Email is required'));
            }

            // Check if user exists
            const user = await db.queryOne(
                `SELECT id, name FROM users WHERE email = ? AND deletedAt IS NULL`,
                [email]
            );

            if (!user) {
                return res.error(getLocalizedMessage(req, 'User not found'));
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

            // Store reset token
            await db.query(
                `UPDATE users SET token = ?, updatedAt = GETDATE() WHERE id = ?`,
                [resetToken, user.id]
            );

            // Send email with reset link
            const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

            await sendEmail({
                to: email,
                subject: 'GDRFA - Reset Your Password',
                template: 'email-reset-password-template.ejs',
                data: {
                    resetLink,
                    title: 'Reset Your Password',
                    logoUrl: `${req.protocol}://${req.get('host')}/assets/images/Group.png`,
                    username: user.name || 'User',
                    buttonText: 'Reset Password',
                    role: 'user'
                }
            });

            return res.success({}, getLocalizedMessage(req, 'Password reset link sent to your email'));
        } catch (error) {
            console.error('Error in forgot password:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    // POST /api/auth/reset-password
    static async postResetPassword(req, res) {
        try {
            const { email, token, new_password, confirm_password } = req.body;

            if (!email || !token || !new_password || !confirm_password) {
                return res.error(getLocalizedMessage(req, 'All fields are required'));
            }

            if (new_password !== confirm_password) {
                return res.error(getLocalizedMessage(req, 'Passwords do not match'));
            }

            // Find user by email and token
            const user = await db.queryOne(
                `SELECT id FROM users WHERE email = ? AND token = ? AND deletedAt IS NULL`,
                [email, token]
            );

            if (!user) {
                return res.error(getLocalizedMessage(req, 'Invalid or expired reset token'));
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(new_password, 10);

            // Update password and clear token
            await db.query(
                `UPDATE users SET password = ?, token = NULL, updatedAt = GETDATE() WHERE id = ?`,
                [hashedPassword, user.id]
            );

            return res.success({}, getLocalizedMessage(req, 'Password reset successfully'));
        } catch (error) {
            console.error('Error resetting password:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    // GET /admin/getSectors
    static async getSectors(req, res) {
        try {
            const { search } = req.query;
            const sectorData = await ciamService.organization(req.headers.authorization);
            const sectorsArray = sectorData == null || sectorData?.isError ? [] : sectorData.value.filter(x => x.levelID == 2 && x.typeID == 15);
            const newArray = sectorsArray.map(x => { return { id: x.id, name: x.nameEn } });
            res.json(newArray);
        } catch (err) {
            res.json([]);
        }
    }

    static async getDepartments(req, res) {
        try {
            let { sectorId, search } = req.query;
            sectorId = sectorId.split(',');
            const deptData = await ciamService.organization(req.headers.authorization);
            const deptArray = deptData == null || deptData?.isError ? [] : deptData.value.filter(x => x.levelID == 3 && x.typeID == 16 && sectorId.includes(x.parentID.toString()));
            const newArray = deptArray.map(x => { return { id: x.id, name: x.nameEn } });
            res.json(newArray);
        } catch (err) {
            console.log(err)
            res.json([]);
        }
    }

    static async getSectionsByDepartment(req, res) {
        try {
            let { departmentId, search } = req.query;
            departmentId = departmentId.split(',');
            const sectData = await ciamService.organization(req.headers.authorization);
            const sectArray = sectData == null || sectData?.isError ? [] : sectData.value.filter(x => x.levelID == 4 && x.typeID == 17 && departmentId.includes(x.parentID.toString()));
            const newArray = sectArray.map(x => { return { id: x.id, name: x.nameEn } });
            res.json(newArray);
        } catch (err) {
            res.json([]);
        }
    }

    static async getBranchesBySection(req, res) {
        try {
            let { sectionId, search } = req.query;
            sectionId = sectionId.split(',');
            const branchData = await ciamService.organization(req.headers.authorization);
            const branchArray = branchData == null || branchData?.isError ? [] : branchData.value.filter(x => x.levelID == 4 && x.typeID == 17 && sectionId.includes(x.parentID.toString()));
            const newArray = branchArray.map(x => { return { id: x.id, name: x.nameEn } });
            res.json(newArray);
        } catch (err) {
            res.json([]);
        }
    }

    // GET /api/auth/ranks
    static async getRanks(req, res) {
        try {
            const ranks = await db.query(
                `SELECT id, name FROM ranks WHERE status = '1' ORDER BY name ASC`
            );
            return res.success(ranks, getLocalizedMessage(req, 'Ranks fetched successfully'));
        } catch (error) {
            console.error('Error fetching ranks:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    // GET /api/auth/job-titles
    static async getJobTitles(req, res) {
        try {
            const jobTitles = await db.query(
                `SELECT id, name FROM job_titles WHERE status = '1' ORDER BY name ASC`
            );
            return res.success(jobTitles, getLocalizedMessage(req, 'Job titles fetched successfully'));
        } catch (error) {
            console.error('Error fetching job titles:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    static async uploadProfileImage(req, res) {
        try {
            const userId = req.user.id;
            if (!req.file) {
                return res.error(getLocalizedMessage(req, 'No image file provided'));
            }

            const image = `uploads/${imagePath(req.file.path.replace(/\\/g, '/'))}`;

            // Check if record exists
            const existing = await db.queryOne(
                `SELECT id FROM user_profile_image WHERE user_domain = ? AND deletedAt IS NULL`,
                [userId]
            );

            if (existing) {
                // Remove old file
                try {
                    const old = await db.queryOne(
                        `SELECT user_image FROM user_profile_image WHERE id = ?`,
                        [existing.id]
                    );
                    if (old && old.user_image && fs.existsSync(path.join(__dirname, '../../', old.user_image))) {
                        fs.unlinkSync(path.join(__dirname, '../../', old.user_image));
                    }
                } catch (e) { /* ignore file delete errors */ }

                await db.query(
                    `UPDATE user_profile_image SET user_image = ?, updatedAt = GETDATE() WHERE id = ?`,
                    [image, existing.id]
                );
            } else {
                await db.query(
                    `INSERT INTO user_profile_image (user_domain, user_image, createdAt, updatedAt) VALUES (?, ?, GETDATE(), GETDATE())`,
                    [userId, image]
                );
            }

            const BASE_URL = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
            return res.success(
                { image: `${BASE_URL}/${image}` },
                getLocalizedMessage(req, 'Profile image updated successfully')
            );
        } catch (error) {
            console.error('Error in uploadProfileImage:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    static async getProfileImage(req, res) {
        try {
            const userId = req.user.id;
            const record = await db.queryOne(
                `SELECT user_image FROM user_profile_image WHERE user_domain = ? AND deletedAt IS NULL`,
                [userId]
            );

            if (!record) {
                return res.success({ image: null }, getLocalizedMessage(req, 'No profile image found'));
            }

            const BASE_URL = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
            return res.success(
                { image: `${BASE_URL}/${record.user_image}` },
                getLocalizedMessage(req, 'Profile image fetched successfully')
            );
        } catch (error) {
            console.error('Error in getProfileImage:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }
}

module.exports = ApiController;
