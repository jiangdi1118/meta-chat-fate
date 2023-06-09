declare namespace Chat {

	interface Chat {
		dateTime: string
		text: string
		img: string
		taskId: string
		inversion?: boolean
		error?: boolean
		loading?: boolean
		conversationOptions?: ConversationRequest | null
		requestOptions: { prompt: string; options?: ConversationRequest | null }
	}

	interface History {
		title: string
		isEdit: boolean
		uuid: number
	}

	interface ChatState {
		remainingMessages: number
		active: number | null
		usingContext: boolean
		history: History[]
		chat: { uuid: number; data: Chat[] }[]
		vipType?: string // 添加 vipType 属性
		vipExpires?: LocalDateTime | null // 添加 vipExpires 属性
		img: string
		taskId: string
	}

	interface ConversationRequest {
		conversationId?: string
		parentMessageId?: string
	}

	interface ConversationResponse {
		conversationId: string
		detail: {
			choices: { finish_reason: string; index: number; logprobs: any; text: string }[]
			created: number
			id: string
			model: string
			object: string
			usage: { completion_tokens: number; prompt_tokens: number; total_tokens: number }
		}
		id: string
		parentMessageId: string
		role: string
		text: string
	}
}
