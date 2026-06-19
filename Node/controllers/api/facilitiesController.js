const db = require('../../config/dbDirect');
const responseFormatter = require('../../middlewares/responseFormatter');
const { getLocalizedMessage } = require('../../utils/apiLanguageHelper');
const { storeNotification } = require('../../utils/notificationHelper');
const ciamService = require('../../ciam/ciam.service');
const { attemptTokenRefresh } = require('../../utils/ciamTokenHelper');
const moment = require('moment');
require('dotenv').config();

function parseTimeSlot(dateStr, timeSlot) {
    if (!timeSlot) return dateStr + ' 00:00:00';
    const m = timeSlot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return dateStr + ' 00:00:00';
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
    if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
    const pad = (n) => String(n).padStart(2, '0');
    return `${dateStr} ${pad(h)}:${pad(min)}:00`;
}

class FacilitiesController {

    // GET /api/facilities/all
    static async getAllFacilities(req, res) {
        try {
            const facilities = await db.query(
                `SELECT id, title, title_ar, description, description_ar, image, status, createdAt 
                 FROM facilities 
                 WHERE status = '1' AND deletedAt IS NULL 
                 ORDER BY createdAt DESC`
            );

            if (!facilities || facilities.length === 0) {
                return res.success([], getLocalizedMessage(req, 'No facilities found'));
            }

            const formattedFacilities = facilities.map(facility => ({
                ...facility,
                image: facility.image ? `${process.env.APP_URL}/${facility.image}` : null
            }));

            return res.success(
                formattedFacilities,
                getLocalizedMessage(req, 'Facilities fetched successfully')
            );
        } catch (error) {
            console.error('Error fetching facilities:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    // POST /api/facility-request
    static async createFacilityRequest(req, res) {
        try {
            const { facility_id, name, email, date, time_slot, description } = req.body;

            if (!facility_id || !name || !email || !date || !description) {
                return res.error(getLocalizedMessage(req, 'All fields are required'));
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.error(getLocalizedMessage(req, 'Invalid email address'));
            }

            const facility = await db.queryOne(
                `SELECT id, title FROM facilities WHERE id = ? AND status = '1' AND deletedAt IS NULL`,
                [facility_id]
            );

            if (!facility) {
                return res.error(getLocalizedMessage(req, 'Facility not found'));
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const requestedDate = new Date(date + 'T00:00:00');

            if (requestedDate <= today) {
                return res.error(getLocalizedMessage(req, 'Facility requests can only be made for future dates (starting from tomorrow).'));
            }

            const dateTime = parseTimeSlot(date, time_slot);

            const existingRequest = await db.queryOne(
                `SELECT id FROM facility_requests 
                 WHERE facility_id = ? AND email = ? AND date = ? AND deletedAt IS NULL`,
                [facility_id, email, dateTime]
            );

            if (existingRequest) {
                return res.error(getLocalizedMessage(req, 'You have already requested this facility for the selected date and time.'));
            }

            await db.query(
                `INSERT INTO facility_requests (facility_id, name, email, date, description, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, '0', GETDATE(), GETDATE())`,
                [facility_id, name, email, dateTime, description]
            );

            const createdRequest = await db.queryOne(
                `SELECT id, facility_id, name, email, 
                        CAST(date AS DATE) as date,
                        FORMAT(date, 'hh:mm tt') as time_slot,
                        description, status, createdAt
                 FROM facility_requests
                 WHERE facility_id = ? AND email = ? AND date = ?
                 ORDER BY createdAt DESC`,
                [facility_id, email, dateTime]
            );

            // Notify super-admins (non-blocking)
            try {
                let superAdminUsers = await ciamService.getUserByRoleId(process.env.SUPERADMINROLEID);
                if (superAdminUsers?.isError || superAdminUsers == null) {
                    console.warn('[createFacilityRequest] CIAM getUserByRoleId failed — skipping super-admin notifications');
                } else if (superAdminUsers && !superAdminUsers.isError) {
                    const users = superAdminUsers.value?.internalClientUsers || superAdminUsers.value || [];
                    const adminList = Array.isArray(users) ? users.filter(u => u.userDomain) : [];

                    const formattedDate = moment(dateTime).format('DD-MM-YYYY');
                    const formattedTime = time_slot || moment(dateTime).format('hh:mm A');

                    for (const admin of adminList) {
                        try {
                            await storeNotification({
                                userId: admin.userDomain,
                                title_en: 'New Facility Booking Request',
                                title_ar: 'طلب حجز منشأة جديد',
                                message_en: `${name} has requested to book "${facility.title}" on ${formattedDate} at ${formattedTime}.`,
                                message_ar: `قام ${name} بطلب حجز "${facility.title}" في ${formattedDate} الساعة ${formattedTime}.`,
                            });
                        } catch (notifErr) {
                            console.warn('Failed to store notification for admin:', admin.userDomain, notifErr.message);
                        }
                    }
                }
            } catch (notifErr) {
                console.warn('Failed to notify super-admins (non-blocking):', notifErr.message);
            }

            return res.success(
                createdRequest || { facility_id, name, email, date, time_slot, description, status: '0' },
                getLocalizedMessage(req, 'Facility request submitted successfully')
            );
        } catch (error) {
            console.error('Error creating facility request:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    // GET /api/my-facility-requests
    static async getMyFacilityRequests(req, res) {
        try {
            const userEmail = req.user?.email;
            if (!userEmail) {
                return res.error(getLocalizedMessage(req, 'User email not found'));
            }

            const requests = await db.query(
                `SELECT fr.id, fr.facility_id, f.title as facilityName, fr.name, fr.email,
                        CAST(fr.date AS DATE) as date,
                        FORMAT(fr.date, 'hh:mm tt') as time_slot,
                        fr.description, fr.status, fr.createdAt
                 FROM facility_requests fr
                 LEFT JOIN facilities f ON fr.facility_id = f.id
                 WHERE fr.email = ? AND fr.deletedAt IS NULL
                 ORDER BY fr.createdAt DESC`,
                [userEmail]
            );

            if (!requests || requests.length === 0) {
                return res.success([], getLocalizedMessage(req, 'No facility requests found'));
            }

            return res.success(
                requests,
                getLocalizedMessage(req, 'Facility requests fetched successfully')
            );
        } catch (error) {
            console.error('Error fetching facility requests:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }

    // GET /api/facility-requests/:facilityId - Get booked times for a facility
    static async getBookedTimes(req, res) {
        try {
            const { facilityId } = req.params;

            if (!facilityId) {
                return res.error(getLocalizedMessage(req, 'Facility ID is required'));
            }

            const bookedRequests = await db.query(
                `SELECT 
                    CAST(date AS DATE) as date,
                    FORMAT(date, 'hh:mm tt') as time_slot,
                    status
                 FROM facility_requests 
                 WHERE facility_id = ? 
                 AND status = '1'
                 AND deletedAt IS NULL
                 ORDER BY date ASC`,
                [facilityId]
            );

            return res.success(
                bookedRequests,
                getLocalizedMessage(req, 'Booked times fetched successfully')
            );
        } catch (error) {
            console.error('Error fetching booked times:', error.message);
            return res.error(getLocalizedMessage(req, 'Internal server error'));
        }
    }
}

module.exports = FacilitiesController;
