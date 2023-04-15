# 三生宇宙
## 语音说明
### 默认配置
通过配置 [.env](./.env) 的 `VITE_ENABLE_SPEECH=true` 可以配置启动语音，默认情况下，语音方案采用 [Web Speech API](https://developer.mozilla.org/zh-CN/docs/Web/API/SpeechRecognition)，
该方案仅支持 pc 端的浏览器。如果有多端的需求，可以使用微软的语音服务。

### 微软的语音服务配置
1. 参考此[教程](https://learn.microsoft.com/zh-cn/azure/cognitive-services/cognitive-services-apis-create-account?tabs=speech%2Canomaly-detector%2Clanguage-service%2Ccomputer-vision%2Cwindows)，
获取 `Subscription Key` 和对应的 `region`。
2. 配置到 [service/.env](./service/.env.example) 中的 `AZURE_SUBSCRIPTION_KEY` 和 `AZURE_SPEECH_REGION`
3. 重新部署，然后起飞！

![speech-tip](./docs/speech-tip.png)

![speech-setting-1](./docs/speech-setting-1.png)

![speech-setting-2](./docs/speech-setting-2.png)
