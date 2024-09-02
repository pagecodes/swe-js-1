import { OpenAIToolSet, LangchainToolSet, Workspace } from 'composio-core';
import { BACKSTORY, DESCRIPTION, GOAL } from '../prompts';
import OpenAI from 'openai';
import ChatGemini from 'langchain'

// Initialize tool.
const OAIllm = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const llm = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const OAIcomposioToolset = new OpenAIToolSet({ 
    workspaceConfig: Workspace.E2B({
        apiKey: process.env.E2B_API_KEY,
    })
});
const composioToolset = new LangchainToolSet({ 
    workspaceConfig: Workspace.E2B({
        apiKey: process.env.E2B_API_KEY,
    })
});

export async function initSWEAgent(): Promise<{composioToolset: LangchainToolSet; assistantThread: OpenAI.Beta.Thread; llm: OpenAI; tools: Array<any>}> {
    let tools = await composioToolset.getTools({
        apps: [
            "filetool",
            "fileedittool",
            "shelltool"
        ],
    });

    tools = tools.map((a) => {
        if (a.function?.description?.length || 0 > 1024) {
            a.function.description = a.function.description?.substring(0, 1024);
        }
        return a;
    });

    tools = tools.map((tool) => {
        const updateNullToEmptyArray = (obj) => {
            for (const key in obj) {
                if (obj[key] === null) {
                    obj[key] = [];
                } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                    updateNullToEmptyArray(obj[key]);
                }
            }
        };

        updateNullToEmptyArray(tool);
        return tool;
    });

    const assistantThread = await llm.beta.threads.create({
        messages: [
            {
                role: "assistant",
                content:`${BACKSTORY}\n\n${GOAL}\n\n${DESCRIPTION}`
            }
        ]
    });


    return { assistantThread, llm, tools, composioToolset };
}
