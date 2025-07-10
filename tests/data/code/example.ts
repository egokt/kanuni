import { Kanuni } from "../../../src";

Kanuni.newQuery<{
  aiSuggestedContext: string,
  aiSuggestedSubcontext: string,
  legalContextsAndSubcontexts: [string, string[]][];
}>()
  .prompt(p => p
    .paragraph`You are given a list of subjects and subsubjects, and a subject and subsubject pair that is not in the list.`
    .paragraph`Your task is to find the closest subject and subsubject pair in the list that should replace the given pair.`
    .paragraph`The list of subjects and subsubjects:`
    .list((l, data) => l
      .items(data.legalContextsAndSubcontexts, (i, [context, subcontexts]) => i
        .items(subcontexts, (i, subcontext) => i
          .item(_ => `"${context}", "${subcontext}"`)
        )
      )
    ) 
    .paragraph`You will respond with a JSON object that represent your response pair as an object with two properties: "subject" and "subsubject".`
    .paragraph`The given subject and subsubject pair: "${'aiSuggestedContext'}", "${'aiSuggestedSubcontext'}".`
    .paragraph`Your response:`
  );
