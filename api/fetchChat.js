// export default async (req, res) => {
//   const apiUrl = 'https://api.openai.com/v1/chat/completions'

//   const requestBody = req.body
//   const apiKey = process.env.VITE_GLOB_OPENAI_API_KEY

//   const response = await fetch(apiUrl, {
//     method: 'POST',
//     body: JSON.stringify(requestBody),
//     headers: {
//       'Authorization': `Bearer ${apiKey}`,
//       'Content-Type': 'application/json',
//       'Accept': 'application/json',
//     },
//   })

//   // 将响应的状态和头部信息发送回客户端
//   res.status(response.status)
//   for (const [key, value] of response.headers)
//     res.setHeader(key, value)

//   // 将响应的流式传输内容发送回客户端
//   const reader = response.body.getReader()
//   res.writeProcessing()

//   const readStream = async (reader) => {
//     while (true) {
//       const { done, value } = await reader.read()
//       if (done)
//         break

//       res.write(value)
//     }
//     res.end()
//   }

//   await readStream(reader)
// }

module.exports = async (req, res) => {
  const apiKey = process.env.VITE_GLOB_OPENAI_API_KEY
  const apiUrl = 'https://api.openai.com/v1/chat/completions'

  try {
    const response = await fetch(apiUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        Authorization: `Bearer ${apiKey}`,
      },
      body: req.method === 'POST' ? await req.text() : null,
    })

    res.status(response.status)
    res.set(response.headers.raw())

    const contentType = response.headers.get('Content-Type')
    if (contentType === 'text/event-stream') {
      // 处理流式响应
      const reader = response.body.getReader()
      const encoder = new TextEncoder()
      const { writable, readable } = new TransformStream()

      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done)
            break

          writable.getWriter().write(encoder.encode(value))
        }
        writable.getWriter().close()
      }

      processStream()

      // 将流式响应发送到客户端
      res.set('Content-Type', 'text/event-stream')
      readable.pipeTo(res)
    }
    else {
      // 处理 JSON 响应
      const jsonResponse = await response.json()
      res.json(jsonResponse)
    }
  }
  catch (error) {
    console.error('Error in openai_proxy:', error)
    res.status(500).send('An error occurred while processing the request.')
  }
}
