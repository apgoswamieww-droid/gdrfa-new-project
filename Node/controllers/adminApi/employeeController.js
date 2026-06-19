const ciamService = require('../../ciam/ciam.service');
const { attemptTokenRefresh } = require('../../utils/ciamTokenHelper');

class EmployeeController {
    static async list(req, res) {
        try {
            const start = parseInt(req.query.start) || 0;
            const length = parseInt(req.query.length) || 10;
            const search = req.query.search || '';

            const accessToken = process.env.CIAM_TOKEN || (req.headers.authorization?.split(' ')[1]) || null;
            
            const payload = {
                "pagination": {
                    "filters": {},
                    "pageNumber": (parseInt(start) / length) + 1,
                    "pageSize": length,
                },
                "withImages": 30
            };

            if (search) {
                payload.pagination.filters.name = search;
            }

            let usersResponse = await ciamService.getRecursiveUsers(payload, accessToken);
            
            if (usersResponse?.isError || usersResponse == null) {
                console.warn('[Employee list] CIAM getRecursiveUsers failed — returning empty list');
                usersResponse = { value: [] };
            }

            const users = usersResponse.value || [];

            const total = users[0]?.totalRowCount || 0;

            const transformedData = (Array.isArray(users) ? users : [])
                .map(x => {
                    return {
                        id: x.userDomain || x.loginName || `emp_${x.id}`,
                        name: x.nameEn || x.nameAr || x.emailAddress || '-',
                        email: x.emailAddress || '-',
                        mobile: x.mobile || '-',
                        grp: x.grp !== undefined && x.grp !== null ? String(x.grp) : '',
                        status: x.active === 1 ? "Active" : "Inactive",
                        role_name: "Employee",
                        createdAt: x.hireDate || x.createdAt || new Date().toISOString(),
                    }
                });
            
            return res.json({
                status: true,
                message: 'Employees retrieved successfully',
                data: {
                    data: transformedData,
                    total: total
                }
            });
        } catch (error) {
            console.error('[CIAM Error]', error.message);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== EMPLOYEES WITH FILTERS (for Event Activity selection) ====================

    static async listWithFilters(req, res) {
        try {
            const search = (req.query.search || '').toLowerCase().trim();
            const sector = req.query.sector || '';
            const department = req.query.department || '';
            const section = req.query.section || '';
            const branch = req.query.branch || '';
            const gender = req.query.gender || '';
            const fromAge = req.query.from_age || '';
            const toAge = req.query.to_age || '';
            const rank = req.query.rank || '';
            const jobTitle = req.query.jobTitle || '';
            const workSystem = req.query.workSystem || '';
            const staffType = req.query.staffType || '';
            const peopleOfDetermination = req.query.peopleOfDetermination || '';

            const accessToken = process.env.CIAM_TOKEN || (req.headers.authorization?.split(' ')[1]) || null;

            // Fetch all employees — CIAM mock ignores filter params, so we apply them client-side
            const payload = {
                "pagination": {
                    "filters": {},
                    "pageNumber": 1,
                    "pageSize": 5000,
                },
                "withImages": 0
            };

            let usersResponse = await ciamService.getRecursiveUsers(payload, accessToken);

            if (usersResponse?.isError || usersResponse == null) {
                console.warn('[Employee listWithFilters] CIAM getRecursiveUsers failed — returning empty list');
                usersResponse = { value: [] };
            }

            const users = usersResponse.value || [];

            const fromAgeNum = parseInt(fromAge, 10);
            const toAgeNum = parseInt(toAge, 10);
            const now = new Date();

            // Helper: compute age from birthDate
            const calcAge = (birthDate) => {
                if (!birthDate) return null;
                const bd = new Date(birthDate);
                if (isNaN(bd.getTime())) return null;
                let age = now.getFullYear() - bd.getFullYear();
                const m = now.getMonth() - bd.getMonth();
                if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--;
                return age;
            };

            // Helper: map sex → gender string
            const mapGender = (sex) => {
                if (sex === 1) return 'Male';
                if (sex === 2) return 'Female';
                return '';
            };

            // First pass: transform all users with userDomain
            const allTransformed = (Array.isArray(users) ? users : [])
                .filter(x => x.userDomain)
                .map(x => {
                    const age = calcAge(x.birthDate);
                    return {
                        id: x.userDomain,
                        name: x.nameEn || x.nameAr || x.emailAddress || '-',
                        nameAr: x.nameAr || '',
                        email: x.emailAddress || '-',
                        mobile: x.mobile || '-',
                        grp: x.grp !== undefined && x.grp !== null ? String(x.grp) : '',
                        sector: x.sectorNameEN || '',
                        sectorAr: x.sectorNameAR || '',
                        department: x.deptNameEN || '',
                        departmentAr: x.deptNameAR || '',
                        section: x.sectionNameEN || '',
                        sectionAr: x.sectionNameAR || '',
                        branch: x.branchNameEN || '',
                        branchAr: x.branchNameAR || '',
                        gender: mapGender(x.sex),
                        age: age !== null ? String(age) : '',
                        rank: x.rankEN || x.rankAR || '',
                        jobTitle: x.jobTitleEN || x.jobTitle || '',
                        workSystem: x.attendanceTypeEN || x.attendanceTypeAR || '',
                        staffType: x.classEN || x.classAR || '',
                        staffTypeAr: x.classAR || '',
                        peopleOfDetermination: '',
                        status: x.active === 1 ? "Active" : "Inactive",
                    }
                });

            // Compute filter options from ALL data (unfiltered) so dropdowns always populate
            const filterOptions = {
                sectors: [...new Set(allTransformed.map(e => e.sector).filter(Boolean))].sort(),
                departments: [...new Set(allTransformed.map(e => e.department).filter(Boolean))].sort(),
                sections: [...new Set(allTransformed.map(e => e.section).filter(Boolean))].sort(),
                branches: [...new Set(allTransformed.map(e => e.branch).filter(Boolean))].sort(),
                ranks: [...new Set(allTransformed.map(e => e.rank).filter(Boolean))].sort(),
                jobTitles: [...new Set(allTransformed.map(e => e.jobTitle).filter(Boolean))].sort(),
                genders: [...new Set(allTransformed.map(e => e.gender).filter(Boolean))].sort(),
                workSystems: [...new Set(allTransformed.map(e => e.workSystem).filter(Boolean))].sort(),
                staffTypes: [...new Set(allTransformed.map(e => e.staffType).filter(Boolean))].sort(),
            };

            // Apply all filters client-side (since CIAM mock ignores them)
            const transformedData = allTransformed.filter(x => {
                if (search) {
                    const matchStr = [x.name, x.nameAr, x.email, x.mobile, x.id, x.grp].join(' ').toLowerCase();
                    if (!matchStr.includes(search)) return false;
                }
                if (sector && x.sector !== sector) return false;
                if (department && x.department !== department) return false;
                if (section && x.section !== section) return false;
                if (branch && x.branch !== branch) return false;
                if (gender && x.gender !== gender) return false;
                if (rank && x.rank !== rank) return false;
                if (jobTitle && x.jobTitle !== jobTitle) return false;
                if (workSystem && x.workSystem !== workSystem) return false;
                if (staffType && x.staffType !== staffType) return false;
                if (peopleOfDetermination && x.peopleOfDetermination !== peopleOfDetermination) return false;
                if (!isNaN(fromAgeNum) && x.age && parseInt(x.age, 10) < fromAgeNum) return false;
                if (!isNaN(toAgeNum) && x.age && parseInt(x.age, 10) > toAgeNum) return false;
                return true;
            });

            return res.json({
                status: true,
                message: 'Employees retrieved successfully',
                data: {
                    employees: transformedData,
                    filterOptions,
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
            const roles = [{ id: process.env.USERROLEID || 3, name: "Employee", description: "" }];
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

module.exports = EmployeeController;
