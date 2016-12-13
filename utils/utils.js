const weekMapping = {
  0: 'Sunday: ',
  1: 'Monday: ',
  2: 'Tuesday: ',
  3: 'Wednesday: ',
  4: 'Thursday: ',
  5: 'Friday: ',
  6: 'Saturday: '
}

let currentWeek = {
  0: [],
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: []
}

module.exports = {
  getMonday,
  getSunday,
  convertToHours,
  generateWeekArray,
  summarizeHoursForOneDay,
  weekMapping,
  currentWeek
}

function getMonday (d) {
  d = new Date(d)
  let day = d.getDay()
  let diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  d.setHours(0)
  return new Date(d.setDate(diff))
}

function getSunday (d) {
  d = new Date(d)
  let day = d.getDay()
  let diff = d.getDate() + 7 - day // adjust when day is sunday
  return new Date(d.setDate(diff))
}

function convertToHours (start, end) {
  let seconds = new Date(end) - new Date(start)
  let hours = seconds / 1000 / 60 / 60
  return hours
}

/*
Accepts array of results from google api and returns an object with all booked events summarized by day of week in an array
  Example input :

  { kind: 'calendar#event',
    etag: '"2951919738484000"',
    id: 'bjc8e3ke6k9khnac840n3a4b2c_20161217T180000Z',
    status: 'confirmed',
    htmlLink: 'https://www.google.com/calendar/event?eid=YmpjOGUza2U2azlraG5hYzg0MG4zYTRiMmNfMjAxNjEyMTdUMTgwMDAwWiBoaXIuOUBoYWNrcmVhY3Rvci5jb20',
    created: '2016-10-08T20:51:09.000Z',
    updated: '2016-10-08T20:51:09.242Z',
    summary: 'Personal Project',
    creator: { email: 'jane.hayes@reactorcore.com' },
    organizer: { email: 'hir.9@hackreactor.com', self: true },
    start:
     { dateTime: '2016-12-17T10:00:00-08:00',
       timeZone: 'America/Los_Angeles' },
    end:
     { dateTime: '2016-12-17T14:00:00-08:00',
       timeZone: 'America/Los_Angeles' },
    recurringEventId: 'bjc8e3ke6k9khnac840n3a4b2c',
    originalStartTime:
     { dateTime: '2016-12-17T10:00:00-08:00',
       timeZone: 'America/Los_Angeles' },
    iCalUID: 'bjc8e3ke6k9khnac840n3a4b2c@google.com',
    sequence: 0,
    reminders: { useDefault: true }
*/
function generateWeekArray (events, currentWeek) {
  for (let i = 0; i < events.length; i++) {
    let booking = events[i]
    let start = new Date(booking.start.dateTime || booking.start.date)
    let end = new Date(booking.end.dateTime || booking.end.date)
    let dayOfWeek = start.getDay()
    let startTime = start.getHours() + (start.getMinutes() / 60)
    let endTime = end.getHours() + (end.getMinutes() / 60)
    if (startTime === endTime) {
      continue
    }
    currentWeek[dayOfWeek].push([startTime, endTime, booking.summary])
  }
  return currentWeek
}

/*
  Function accepts a timeSlot in the following format:
    [ [ 14, 14.5, 'Notes' ],
      [ 14.5, 15.5, 'Interview Duty' ],
      [ 14.5, 15.5, 'Applicant Interview: Victoria Alden (Pref: Remote | Email: vic.alden23@gmail.com | Skype ID: eyeam.vicki)'],
      [ 15.5, 16, 'Notes' ]
    ]
*/
function summarizeHoursForOneDay (timeSlots) {
  let totalHours = 0
  let currentMinStart = timeSlots[0][0]
  let currentMaxEnd = timeSlots[0][1]
  for (let i = 1; i < timeSlots.length; i++) {
    // if next slot's start time is before or equal to the end of last slot
    // console.log('currentMaxEnd: ', currentMaxEnd, 'currentMinStart', currentMinStart)
    if (currentMaxEnd < timeSlots[i][0]) {
      // update currentMaxEnd with max of currentMaxEnd and next slot's end time
      totalHours += currentMaxEnd - currentMinStart
      currentMinStart = timeSlots[i][0]
      // currentMaxEnd = timeSlots[i][1]
    }
    currentMaxEnd = Math.max(timeSlots[i][1], currentMaxEnd)
  }
  return totalHours + (currentMaxEnd - currentMinStart)
}
