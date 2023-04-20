async function handler(req, res) {
  const apiKey = process.env.VITE_GLOB_OPENAI_API_KEY
  const apiUrl = 'https://api.openai.com/v1/chat/completions'

  try {
    const requestBody = req.body
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorResponse = await response.json()
      const errorMessage = errorResponse.error?.message || 'An unknown error occurred.'
      res.status(response.status).json({ error: errorMessage })
      return
    }

    const responseData = await response.json()
    res.status(200).json(responseData)
  }
  catch (error) {
    console.error('Error while processing request:', error)
    res.status(500).json({ error: 'An error occurred while processing the request.' })
  }
}

module.exports = handler
