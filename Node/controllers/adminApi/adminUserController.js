const ciamService = require('../../ciam/ciam.service');
const { attemptTokenRefresh } = require('../../utils/ciamTokenHelper');

class AdminUserController {
    static async list(req, res) {
        try {
            // Use CIAM service like subAdminController does
            let adminUsers = await ciamService.getUserByRoleId(process.env.ADMINROLEID, req.user?.token);

            if (adminUsers?.isError || adminUsers == null) {
                return res.status(401).json({ status: false, message: 'Unauthorized' });
            }
            const adminUsersArray = adminUsers?.isError || adminUsers == null ? [] : (adminUsers.value?.internalClientUsers || []);

            let transformedData = [];
            if (adminUsersArray && adminUsersArray.length > 0) {
                transformedData = adminUsersArray.map(x => {
                    return {
                        id: x.userDomain,
                        name: x.nameEn,
                        email: x.emailAddress,
                        mobile: x.mobile,
                        status: "1",
                        role_name: "Admin",
                        createdAt: x.hireDate || new Date().toISOString(),
                    }
                });
            }

            return res.json({
                status: true,
                message: 'Admins retrieved successfully',
                data: {
                    data: transformedData,
                    total: transformedData.length
                }
            });
        } catch (error) {
            console.error('[CIAM Error]', error.message);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async getRoles(req, res) {
        try {
            // Return static role like subAdminController does
            const roles = [{ id: process.env.ADMINROLEID, name: "Admin", description: "" }];
            return res.json({
                status: true,
                message: 'Roles retrieved successfully',
                data: roles
            });
        } catch (error) {
            console.error('[Error]', error.message);
            return res.status(500).json({ status: false, message: error.message });
        }
    }
}

module.exports = AdminUserController;
