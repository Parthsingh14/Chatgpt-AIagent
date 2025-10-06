import Groq from "groq-sdk";
import { tavily } from "@tavily/core";

// Initialize clients
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

export async function POST(req) {
  try {
    const { question, prevMessages = [] } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        { status: 400 }
      );
    }

    // Start with existing conversation + new user message
    const messages = [
      {
        role: "system",
        content: `Your name is Jero. You are a helpful assistant.
        You can use the webSearch function to get the latest information from the web.
        Tools:
        1. webSearch({query}: {query:string}) — Search the latest news and information on the web.`,
      },
      ...prevMessages,
      { role: "user", content: question },
    ];

    // --- Chat loop (single request/response cycle)
    while (true) {
      const completion = await groq.chat.completions.create({
        temperature: 0,
        messages,
        model: "llama-3.1-8b-instant",
        tools: [
          {
            type: "function",
            function: {
              name: "webSearch",
              description: "Search the latest news and information on the web",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The search query to perform on the web",
                  },
                },
                required: ["query"],
              },
            },
          },
        ],
        tool_choice: "auto",
      });

      const choice = completion.choices[0];
      const message = choice.message;
      messages.push(message);

      const toolCalls = message.tool_calls;
      if (!toolCalls) {
        // No more tool calls → final model response
        return new Response(
          JSON.stringify({
            reply: message.content,
            messages, // return updated conversation for context
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Handle tool calls
      for (const tool of toolCalls) {
        const fnName = tool.function.name;
        const fnArgs = JSON.parse(tool.function.arguments);

        if (fnName === "webSearch") {
          const toolResponse = await webSearch(fnArgs);
          messages.push({
            tool_call_id: tool.id,
            role: "tool",
            name: fnName,
            content: toolResponse,
          });
        }
      }
    }
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Helper function
async function webSearch({ query }) {
  try {
    const response = await tvly.search(query);
    const combined = response.results
      .map((r) => r.content)
      .join("\n\n");
    return combined || "No relevant results found.";
  } catch (err) {
    console.error("WebSearch error:", err);
    return "Error performing web search.";
  }
}
