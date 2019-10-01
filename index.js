/* eslint-disable no-trailing-spaces */
/* eslint-disable quote-props */
/* eslint-disable no-console */
/* eslint-disable dot-notation */

require('dotenv').config()

// import dependencies
const express = require('express')
const bodyParser = require('body-parser')
const { WebClient } = require('@slack/web-api')

// import internal modules
const userToServer = require('./app/user')
const interactions = require('./app/interactions')
const utils = require('./app/utils')

// Credentials
const slackToken = process.env['BOT_SLACK_OAUTH_ACCESS']
// const slackSecret = process.env['slackSecret']

// Create an app on express
const app = express()

// Set port for express server
const PORT = 3000

// Instantiate a new webclient
const web = new WebClient(slackToken)

// List of action IDs for interactive messages
const actionAddUserToTeam = 'add-user-to-team'
const actionRemoveUserFromTeam = 'remove-user'
const actionSelectUserToRemove = 'select-user-to-remove'

// Name of organization is always 'Isomer' - for testing purposes, change this to 'Test-kwa'
const orgName = 'Test-kwa' // 'Isomer'

// A key-value map to map slack user IDs to Github IDs - this will be an environmental
// variable in production
const teamLeaders = { UN8LPT6GN: 'kwajiehao' }

// Start server
app.listen(process.env.PORT || PORT, function () {
  console.log('Bot is listening on port ' + PORT)
})

// Include uses
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Validation challenge for Slack Events API
app.post('/verification', (req, res) => {
  // Send the string back with the challenge token for verification
  res.send('HTTP 200 OK Content-type: application/json ' + '{`challenge`:' + req['body']['challenge'] + '}')
})

// invite/add a user to an organization
app.post('/add-users', async (req, res) => {
  // get the channel ID so we can post an interactive message back
  const channelId = req['body']['channel_id']

  // get an array of users from the text input
  const usernames = req['body']['text'].trim().split(' ')
    .filter(Boolean)

  // filter out empty responses
  if ((usernames.length === 1 && usernames[0] === '') || usernames.length === 0) {
    web.chat.postMessage({
      channel: channelId,
      text: 'Please enter the username of the member you wish to invite',
    })
    res.status(200).send('')
    return
  }

  // retrieve an array of teams in the organization
  const teams = await userToServer.getAllTeams(orgName)

  // initiate empty array to store the result to be passed to the interactive message
  const teamOptions = []

  // generate the teamOptions array to be displayed in the message
  for (let i = 0; i < teams.length; i += 1) {
    teamOptions.push({
      'text': {
        'type': 'plain_text',
        'text': teams[i],
      },
      'value': teams[i],
    })
  }

  // create an interactive message to ask them what team they want to add these users to
  web.chat.postMessage({
    channel: channelId,
    blocks: [{
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text': `Which team do you want to add ${usernames.join(', ')} to?`,
      },
    }, {
      'type': 'actions',
      
      // use an * to create a unique id depending on the usernames submitted
      'block_id': `${usernames.join('*')}`,
      'elements': [{
        'type': 'static_select',
        'placeholder': {
          'type': 'plain_text',
          'text': 'Select team to add to',
        },
        'action_id': actionAddUserToTeam,
        'options': teamOptions,
      }],
    }],
  })
    
  // send an empty response back to Slack just because we need to
  // respond within 3000ms
  res.status(200).send('')
})

// remove a user from an organization
app.post('/remove-users', async (req, res) => {
  try {
    // get the channel ID so we can post an interactive message back
    const channelId = req['body']['channel_id']
    // console.log(req['body'])
    
    // retrieve an array of teams in the organization
    const teams = await userToServer.getAllTeams(orgName)
    
    // initiate empty array to store the result to be passed to the interactive message
    const teamOptions = []
    
    // generate the teamOptions array to be displayed in the message
    for (let i = 0; i < teams.length; i += 1) {
      teamOptions.push({
        'text': {
          'type': 'plain_text',
          'text': teams[i],
        },
        'value': teams[i],
      })
    }

    // create an interactive message to ask them what team they want to remove these users from
    web.chat.postMessage({
      channel: channelId,
      blocks: [{
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': 'Which team do you want to remove users from?',
        },
      }, {
        'type': 'actions',
        // use an * to create a unique id depending on the usernames submitted
        'block_id': actionRemoveUserFromTeam,
        'elements': [{
          'type': 'static_select',
          'placeholder': {
            'type': 'plain_text',
            'text': 'Select team to remove from',
          },
          'action_id': actionRemoveUserFromTeam,
          'options': teamOptions,
        }],
      }],
    })

    // send an empty response back to Slack just because we need to
    // respond within 3000ms
    res.status(200).send('')
  } catch (err) {
    console.log(err)
  }
})

// URL endpoint for our interactive components/messages
app.post('/interaction', async (req, res) => {
  // receive the data payload from the interaction
  const payload = JSON.parse(req['body']['payload'])
  const channelId = payload.container.channel_id
  const resUrl = payload.response_url

  // log for testing
  // console.log(payload)

  try {
    // usually the response comes in the form of an array of actions
    for (var i = 0; i < payload.actions.length; i++) {
      // if the command is to add users
      if (payload.actions[i].action_id === actionAddUserToTeam) {
        // extract data we need to add user (e.g. team, users, person calling the function)
        const team = payload.actions[i].selected_option.value
        const users = payload.actions[i].block_id.split('*')
        const inviter = teamLeaders[payload.user.id]

        for (var j = 0; j < users.length; j++) {
          // adding a single user
          await interactions.addUser(i, orgName, resUrl, team, utils.textTransform(users[j]), inviter)
          
          // send empty response
          res.status(200).send('')
        }
      }
      
      // if the command is to remove user
      if (payload.actions[i].action_id.split(':')[0] === actionRemoveUserFromTeam) {
        // extract data we need to add user (team, person calling the function)
        const team = payload.actions[i].selected_option.value
        const inviter = teamLeaders[payload.user.id] // check permissions of inviter

        // remove the user
        await interactions.selectUserToRemove(orgName, team, inviter, actionSelectUserToRemove, channelId, web)

        // send empty response
        res.status(200).send('')
      }
      // remove user after confirmation
      // other feature ideas: multiselect list instead of single select right now
      if (payload.actions[i].action_id.split(':')[0] === actionSelectUserToRemove) {
        // console.log(payload)
        const userToRemove = payload.actions[0].selected_option.value

        // removing a single user from organization
        await interactions.removeUser(orgName, userToRemove, resUrl)

        // send empty response
        res.status(200).send('')
      }
    }
  } catch (err) {
    // log the error in console
    console.log(err)
    
    // send error message to slack
    interactions.postMessage(resUrl, 'There was a problem with your request. Please ensure that your request is valid.')
  }
})

// app.post('/commit-log', async (req, res) => {})
// create a temp file
// upload the file
// delete the temp
