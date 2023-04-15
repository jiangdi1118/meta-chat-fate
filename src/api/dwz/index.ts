import axios from 'axios'

export async function generateShortUrl(longUrl: string): Promise<string | null> {
  try {
    const response = await axios.post('https://c.metass.top/generate', null, {
      params: {
        longURL: longUrl,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    if (response.data.code === 200 && response.data.data) {
      return response.data.data
    }
    else {
      console.error('Error generating short URL:', response.data)
      return null
    }
  }
  catch (error) {
    console.error('Error generating short URL:', error)
    return null
  }
}
