require('dotenv').config()

// import dependencies
const express = require('express')
const bodyParser = require('body-parser')
const { WebClient } = require('@slack/web-api')
const fetch = require('node-fetch')



// import internal modules
const userToServer = require('./app/user')
const interactions = require('./app/interactions')



// Credentials
slack_token = process.env["BOT_SLACK_OAUTH_ACCESS"]
slack_secret =  process.env["SLACK_SECRET"]


// Create an app on express
const app = express();


// Set port for express server
PORT = 3000 


// Instantiate a new webclient
const web = new WebClient(slack_token);


// List of action IDs
const actionAddUserToTeam = 'add-user-to-team'
const actionRemoveUser = 'remove-user'


// Name of organization is always 'Isomer' - for testing purposes, change this to 'Test-kwa'
const orgName = 'Test-kwa' // 'Isomer'

// A key-value map to map slack user IDs to Github IDs - this will be an environmental 
// variable in production
const teamLeaders = {
    UN8LPT6GN:'kwajiehao'
}




// Start server
app.listen(process.env.PORT || PORT, function() {
  console.log('Bot is listening on port ' + PORT);
});


// Include uses 
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());



// Validation challenge for Slack Events API
app.post('/verification', (req, res) => {
    // Send the string back with the challenge token for verification
    res.send("HTTP 200 OK Content-type: application/json " + '{"challenge":"' + req['body']['challenge'] + '"}')
});



// invite/add a user to an organization
app.post('/add-users', async (req, res) => {
    // get an array of users from the text input
    const usernames = req['body']['text'].split(' ')

    // get the channel ID so we can post an interactive message back
    const channel_id =  req['body']['channel_id']

    // retrieve an array of teams in the organization
    const teams = await userToServer.getAllTeams(orgName)

    // initiate empty array to store the result to be passed to the interactive message
    const teamOptions = []

    // generate the teamOptions array to be used in the message
    for (let i=0; i<teams.length; i+=1) {
        teamOptions.push({
            "text": {
                "type": "plain_text",
                "text": teams[i]
            },
            "value": teams[i]
        })
    }

    // create an interactive message to ask them what team they want to add these users to
    web.chat.postMessage({
        channel: channel_id,
        blocks: [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `Which team do you want to add ${usernames.join(',')} to?`
                }
            },
            {
                "type": "actions",

                // use an * to create a unique id depending on the usernames submitted
                "block_id": `${usernames.join('*')}`,
                "elements": [
                  {
                    "type": "static_select",
                    "placeholder":{
                        "type": "plain_text",
                        "text": "Select team to add to"
                    },
                    "action_id": actionAddUserToTeam,
                    "options": teamOptions
                  }]
              }
        ]
    })
    // to-do
    // conduct checks on user or organization
    // check for pending invitation status
    // check if user has already been sent an invite
    
    // send an empty response back to Slack just because we need to
    // respond within 3000ms
    res.status(200).send('')
});



// remove a user from an organization
app.post('/remove-user', (req, res) => {

    // get the channel ID so we can post an interactive message back
    let channel_id =  req['body']['channel_id']

    // translate the text request into an array containing the users and organization/team
    const textArr = (req['body']['text']).split(',')

    // rewrite this part
    if (textArr.length > 1) {
        // check that text array length === 2
        // replace with a more sophisticated method for weeding out invalid replies

        // parse the text request
        username = textArr[0].trim()
        organization = textArr[1].trim()

        // post message to chat
        web.chat.postMessage({
            channel: channel_id,
            blocks: [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `Do you want to remove ${username} from ${orgName}?`
                    }
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "Yes",
                                "emoji": true
                            },
                            "action_id": `${actionRemoveUser}:yes`,
                            "value": 'yes'
                        },
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "No",
                                "emoji": true
                            },
                            "action_id": `${actionRemoveUser}:no`,
                            "value": 'no'
                        }
                    ]
                }
            ]
        })
    } else {
        res.send('You did not enter a valid response to the question. Please enter the username of the user you would like to remove, and the organization you would like to remove them from.')
    }

    // sending an empty response back to Slack just because we need to
    // respond within 3000ms
    res.status(200).send('')
})



// URL endpoint for our interactive components/messages
app.post('/interaction', async (req, res) => {
    // receive the data payload from the interaction
    const payload = JSON.parse(req['body']['payload'])
    const resUrl = payload.response_url


    // log for testing
    console.log(payload)
    
    try {        
        // usually the response comes in the form of an array of actions
        for (var i = 0; i < payload.actions.length; i++) {

            // if the command is to add users
            if (payload.actions[i].action_id === actionAddUserToTeam){

                // extract data we need to add user (e.g. team, users, person calling the function)
                const team = payload.actions[i].selected_option.value
                const users = payload.actions[i].block_id.split('*')
                const inviter = teamLeaders[payload.user.id]
                
                for (var j = 0; j < users.length; j++) {
                
                    // adding a single user
                    await interactions.addUser(i, j, orgName, resUrl, team, users[j], inviter)   
                }
                
            }
            

            // if the command is to remove user
            if (payload.actions[i].action_id.split(':')[0] === actionRemoveUser) {
                // message to parse to identify users to remove
                const message = payload.message.blocks[0].text.text.split(' ')

                // the 5th and 7th positions are for username and organization respectively
                userToServer.removeUserSlack(payload.actions[i].value, responseUrl,  message[5], orgName.substring(0,(orgName.length-1)))
            }
        }
        
    } catch(err) {
        // log the error in console
        console.log(err)

        // send error message to slack
        await fetch(resUrl, {
            method: 'post',
            body: JSON.stringify({
                "text": 'There was a problem with your request. Please ensure that your request is valid.'
            }),
            headers: { 
                'Content-Type': 'application/json' 
            }
        })
    }

})

async function removeUserSlack(value, resUrl, username) {
    try {
        // send confirmation
        if (value === 'yes') {
            // call method from /app sub-directory to remove user from Github team
            userToServer.deleteFromOrganization(orgName, username)

            
            // send feedback to slack user
            // check for response before sending feedback!!
            await fetch(resUrl, {
                method: 'post',
                body: JSON.stringify({
                    "text": `${username} has been removed from ${orgName}`
                }),
                headers: { 
                    'Content-Type': 'application/json' 
                }
            })

        // send confirmation that user was not deleted
        } else if (value === 'no') {
            await fetch(resUrl, {
                method: 'post',
                body: JSON.stringify({
                    "text": `${username} has not been removed from ${orgName}`
                }),
                headers: { 
                    'Content-Type': 'application/json' 
                }
            })
        }
    } catch(err) {
        console.log(err)

        await fetch(resUrl, {
            method: 'post',
            body: JSON.stringify({
                "text": `We were unable to remove ${username} from ${orgName}. Please ensure that you have the rights to do this action.`
            }),
            headers: { 
                'Content-Type': 'application/json' 
            }
        })
    }
}