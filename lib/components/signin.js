module.exports = class SignIn {
  constructor (signInLink) {
    this.signInLink = signInLink
  }

  toJSON () {
    const prompt = 'Connect your Slack account to GitHub!'
    return {
      response_type: 'ephemeral',
      attachments: [
        {
          fallback: prompt,
          text: prompt,
          actions: [
            {
              type: 'button',
              text: 'Connect GitHub account',
              url: this.signInLink,
              style: 'primary',
            },
          ],
        },
      ],
    }
  }
}
