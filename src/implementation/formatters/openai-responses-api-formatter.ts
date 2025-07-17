import { Formatter } from "../../developer-api/index.js";

type OpenAIResponsesApiFormatterParams = {
};

type OpenAIResponsesApiFormatterResult = {
};

export class OpenAIResponsesApiFormatter
  implements Formatter<OpenAIResponsesApiFormatterParams, OpenAIResponsesApiFormatterResult>
{
  format(_query: any, _params?: OpenAIResponsesApiFormatterParams): OpenAIResponsesApiFormatterResult {
    // TODO: Implement the formatting logic here
    return {};
  }
}
