import fetch from 'node-fetch'

export default async (req, res) => {
  const apiUrl = 'https://api.openai.com/v1/chat/completions'

  const requestBody = req.body
  const apiKey = process.env.OPENAI_API_KEY

  const response = await fetch(apiUrl, {
    method: 'POST',
    body: JSON.stringify(requestBody),
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })

  // 将响应的状态和头部信息发送回客户端
  res.status(response.status)
  for (const [key, value] of response.headers)
    res.setHeader(key, value)

  // 将响应的流式传输内容发送回客户端
  const reader = response.body.getReader()
  res.writeProcessing()

  const readStream = async (reader) => {
    while (true) {
      const { done, value } = await reader.read()
      if (done)
        break

      res.write(value)
    }
    res.end()
  }

  await readStream(reader)
}
