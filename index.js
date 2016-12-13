var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
const utils = require('./utils/utils.js');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';

// Set CalId to search
var HIRACCOUNT = 'hir.9@hackreactor.com'

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Google Calendar API.
  authorize(JSON.parse(content), listEvents);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
  let calendar = google.calendar('v3')

  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  rl.question('Are you checking this week or last? Please type "this" or "last": ', (code) => {
    rl.close()
    let startDate = new Date();
    if (code.toLowerCase() === 'last') {
      startDate = new Date(startDate.setDate((startDate.getDate() - startDate.getDay()) - 6))
    } else if (code.toLowerCase() !== 'this') {
      console.log('Sorry invalid entry, pulling current week')
    }

    let monday = utils.getMonday(startDate)
    let sunday = utils.getSunday(monday)
    let weekSummary = [];

    calendar.events.list({
      auth: auth,
      calendarId: HIRACCOUNT,
      timeMin: monday.toISOString(),
      timeMax: sunday.toISOString(),
      // maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err)
        return;
      }
      var events = response.items
      if (events.length === 0) {
        console.log('No upcoming events found.')
      } else {
        console.log('Summary of hours for week of :', monday.toDateString())
        let weekMapping = utils.weekMapping
        utils.currentWeek = utils.generateWeekArray(events, utils.currentWeek)
        let weeklyTotal = 0
        for (let i = 0; i < 7; i++) {
          if (utils.currentWeek[i].length !== 0) {
            let totalPerDay = utils.summarizeHoursForOneDay(utils.currentWeek[i])
            weeklyTotal += totalPerDay
            weekSummary.push(`${weekMapping[i]} ${totalPerDay}`)
          }
        }
        console.log(`${weekSummary.join('\n')}`)
        console.log(`This week's total ${weeklyTotal}`)
      }
    })
  })
}
