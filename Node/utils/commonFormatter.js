const moment = require('moment');

/**
 * Format date/time based on Dubai timezone and requirement
 * @param {Date|String} date - The date to format
 * @param {String} type - 'date' or 'datetime'
 * @param {String} lng - Language code ('ar' or 'en')
 * @returns {String} Formatted string with icon
 */
const formatDateTime = (date, type = 'date', lng = 'en') => {
    if (!date) return '-';
    
    // Dubai Timezone (UTC +4)
    const dubaiDate = moment(date).utcOffset('+04:00');
    
    if (!dubaiDate.isValid()) return '-';

    let format;
    let icon;

    if (type === 'datetime') {
        // Example: 01 Apr 2024 10:30 AM
        format = 'DD MMM YYYY hh:mm A';
        icon = 'fa-clock';
    } else {
        // Example: 01 Apr 2024
        format = 'DD MMM YYYY';
        icon = 'fa-calendar-alt';
    }

    const formattedLabel = dubaiDate.format(format);
    
    return `<div class="d-flex align-items-center">
              <i class="far ${icon} me-2 text-primary opacity-50"></i>
              <span>${formattedLabel}</span>
            </div>`;
};

/**
 * Client-side version of the formatter for DataTables
 * This can be called in the browser as window.formatDateTimeClient
 */
const getClientFormatterScript = () => {
    return `
        window.formatDateTimeClient = function(date, type = 'date') {
            if (!date) return '-';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '-';
            
            const day = ("0" + d.getDate()).slice(-2);
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const month = months[d.getMonth()];
            const year = d.getFullYear();
            
            let timeStr = "";
            let icon = "fa-calendar-alt";

            if (type === 'datetime') {
                let hours = d.getHours();
                const minutes = ("0" + d.getMinutes()).slice(-2);
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12; 
                timeStr = " " + ("0" + hours).slice(-2) + ":" + minutes + " " + ampm;
                icon = "fa-clock";
            }

            return '<div class="d-flex align-items-center">' +
                   '<i class="far ' + icon + ' me-2 text-primary opacity-50"></i>' +
                   '<span>' + day + ' ' + month + ' ' + year + timeStr + '</span>' +
                   '</div>';
        };
    `;
};

/**
 * Simple format for use in backend or where HTML is not needed
 */
const getRawFormattedDate = (date, type = 'date') => {
    if (!date) return null;
    const dubaiDate = moment(date).utcOffset('+04:00');
    return type === 'datetime' 
        ? dubaiDate.format('DD MMM YYYY hh:mm A') 
        : dubaiDate.format('DD MMM YYYY');
};

module.exports = {
    formatDateTime,
    getRawFormattedDate,
    getClientFormatterScript
};
