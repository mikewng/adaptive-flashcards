/**
 * Date formatting utilities with timezone support
 */

/**
 * Format a date in the user's timezone
 * @param {string|Date} date - The date to format
 * @param {string} timezone - IANA timezone (e.g., 'America/New_York')
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDateInTimezone = (date, timezone = 'UTC', options = {}) => {
    if (!date) return 'N/A';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
    }

    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: timezone,
        ...options
    };

    try {
        return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
    } catch (error) {
        console.error('Error formatting date:', error);
        // Fallback to UTC if timezone is invalid
        return new Intl.DateTimeFormat('en-US', {
            ...defaultOptions,
            timeZone: 'UTC'
        }).format(dateObj);
    }
};

/**
 * Format a date with time in the user's timezone
 * @param {string|Date} date - The date to format
 * @param {string} timezone - IANA timezone
 * @returns {string} Formatted date and time string
 */
export const formatDateTimeInTimezone = (date, timezone = 'UTC') => {
    return formatDateInTimezone(date, timezone, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

/**
 * Format a date as "due date" with timezone indicator
 * @param {string|Date} date - The date to format
 * @param {string} timezone - IANA timezone
 * @returns {string} Formatted due date string
 */
export const formatDueDate = (date, timezone = 'UTC') => {
    if (!date) return 'No due date';

    const formatted = formatDateInTimezone(date, timezone);
    const tzAbbr = getTimezoneAbbreviation(timezone);

    return `Due: ${formatted} ${tzAbbr}`;
};

/**
 * Format a relative time (e.g., "2 hours ago", "in 3 days")
 * @param {string|Date} date - The date to format
 * @param {string} timezone - IANA timezone (for consistency)
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date, timezone = 'UTC') => {
    if (!date) return 'N/A';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = dateObj - now;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    if (Math.abs(diffDay) >= 1) {
        return rtf.format(diffDay, 'day');
    } else if (Math.abs(diffHour) >= 1) {
        return rtf.format(diffHour, 'hour');
    } else if (Math.abs(diffMin) >= 1) {
        return rtf.format(diffMin, 'minute');
    } else {
        return rtf.format(diffSec, 'second');
    }
};

/**
 * Get timezone abbreviation (e.g., EST, PST, UTC)
 * @param {string} timezone - IANA timezone
 * @returns {string} Timezone abbreviation
 */
export const getTimezoneAbbreviation = (timezone = 'UTC') => {
    try {
        const date = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            timeZoneName: 'short'
        });

        const parts = formatter.formatToParts(date);
        const timeZonePart = parts.find(part => part.type === 'timeZoneName');

        return timeZonePart ? timeZonePart.value : timezone;
    } catch (error) {
        return timezone;
    }
};

/**
 * Check if a date is overdue
 * @param {string|Date} date - The due date
 * @returns {boolean} True if overdue
 */
export const isOverdue = (date) => {
    if (!date) return false;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj < new Date();
};

/**
 * Get days until due
 * @param {string|Date} date - The due date
 * @returns {number} Days until due (negative if overdue)
 */
export const getDaysUntilDue = (date) => {
    if (!date) return null;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = dateObj - now;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};
