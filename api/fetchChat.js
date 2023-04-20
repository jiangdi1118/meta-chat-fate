module.exports = async (req, res) => {
  const apiUrl = 'https://api.openai.com/v1/chat/completions'
  const apiKey = process.env.OPENAI_API_KEY // 从环境变量中获取 API 密钥

  try {
    const response = await fetch(apiUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        authorization: `Bearer ${apiKey}`,
      },
      body: req.method === 'POST' ? await getRequestBody(req) : null, // 从请求中获取主体
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

// 从请求中获取主体
async function getRequestBody(req) {
  if (req.method === 'GET') {
    console.error('Error in openai_proxy: req.method = GET')
    return null
  }
  else if (typeof req.readable === 'function') { // 如果请求是一个流式请求
    const chunks = []
    return new Promise((resolve, reject) => {
      req.on('data', chunk => chunks.push(chunk))
      req.on('end', () => resolve(Buffer.concat(chunks).toString()))
      req.on('error', err => reject(err))
    })
  }
  else { // 如果请求是一个普通的 JavaScript 对象
    return JSON.stringify(req.body)
  }
}
