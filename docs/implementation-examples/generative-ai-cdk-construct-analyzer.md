Example of analyzer:

```ts
if (props.existKnowledgeBaseId == undefined) {
      const vectorCollection = new VectorCollection(this, "KBVectors", {
        collectionName: `kb-${props.botId.slice(0, 20).toLowerCase()}`,
        standbyReplicas:
          props.useStandbyReplicas === true
            ? VectorCollectionStandbyReplicas.ENABLED
            : VectorCollectionStandbyReplicas.DISABLED,
      });
      const vectorIndex = new VectorIndex(this, "KBIndex", {
        collection: vectorCollection,
        // DO NOT CHANGE THIS VALUE
        indexName: "bedrock-knowledge-base-default-index",
        // DO NOT CHANGE THIS VALUE
        vectorField: "bedrock-knowledge-base-default-vector",
        vectorDimensions: props.embeddingsModel.vectorDimensions!,
        mappings: [
          {
            mappingField: "AMAZON_BEDROCK_TEXT_CHUNK",
            dataType: "text",
            filterable: true,
          },
          {
            mappingField: "AMAZON_BEDROCK_METADATA",
            dataType: "text",
            filterable: false,
          },
        ],
        analyzer: props.analyzer,
      });

      kb = new KnowledgeBase(this, "KB", {
        embeddingsModel: props.embeddingsModel,
        vectorStore: vectorCollection,
        vectorIndex: vectorIndex,
        instruction: props.instruction,
      });
```

---

generative-ai-cdk-constructs
@cdklabs/generative-ai-cdk-constructs

@cdklabs/generative-ai-cdk-constructs / opensearch_vectorindex / Analyzer

Interface: Analyzer
Properties for the Analyzer.

Properties
characterFilters
readonly characterFilters: ICU_NORMALIZER[]

The analyzers to use.

tokenFilters
readonly tokenFilters: TokenFilterType[]

The token filters to use.

tokenizer
readonly tokenizer: TokenizerType

The tokenizer to use.

This site is open source. Improve this page.

generative-ai-cdk-constructs
@cdklabs/generative-ai-cdk-constructs

@cdklabs/generative-ai-cdk-constructs / opensearchserverless / CharacterFilterType

Enumeration: CharacterFilterType
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the “License”). You may not use this file except in compliance with the License. A copy of the License is located at

http://www.apache.org/licenses/LICENSE-2.0
or in the ‘license’ file accompanying this file. This file is distributed on an ‘AS IS’ BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and limitations under the License.

Enumeration Members
ICU_NORMALIZER
ICU_NORMALIZER: "icu_normalizer"

This site is open source. Improve this page.

generative-ai-cdk-constructs
@cdklabs/generative-ai-cdk-constructs

@cdklabs/generative-ai-cdk-constructs / opensearchserverless / TokenFilterType

Enumeration: TokenFilterType
Enumeration Members
CJK_WIDTH
CJK_WIDTH: "cjk_width"

ICU_FOLDING
ICU_FOLDING: "icu_folding"

JA_STOP
JA_STOP: "ja_stop"

KUROMOJI_BASEFORM
KUROMOJI_BASEFORM: "kuromoji_baseform"

KUROMOJI_PART_OF_SPEECH
KUROMOJI_PART_OF_SPEECH: "kuromoji_part_of_speech"

KUROMOJI_STEMMER
KUROMOJI_STEMMER: "kuromoji_stemmer"

LOWERCASE
LOWERCASE: "lowercase"

This site is open source. Improve this page.

generative-ai-cdk-constructs
@cdklabs/generative-ai-cdk-constructs

@cdklabs/generative-ai-cdk-constructs / opensearchserverless / TokenizerType

Enumeration: TokenizerType
Enumeration Members
ICU_TOKENIZER
ICU_TOKENIZER: "icu_tokenizer"

KUROMOJI_TOKENIZER
KUROMOJI_TOKENIZER: "kuromoji_tokenizer"

This site is open source. Improve this page.
