# Review SFn バグ修正

- backend/src/api/features/review/services/review-job-service.ts の createReviewJob でジョブを作成すると、SFn は起動するものの、バグがある
- PrepareReview はクリアするが、その後に下記のエラー

```
An error occurred while executing the state 'ProcessReviewItem' (entered at the event id #19). The JSONPath '$$.Map.Item.Value.checkId' specified for the field 'checkId.$' could not be found in the input '{"Execution":{"Id":"arn:aws:states:ap-northeast-1:151364017355:execution:ReviewProcessorReviewProcessingWorkflowED301F52-ufQaKyD7HUUx:69189223-bef6-4f88-8e14-defcdf8d5467","Input":{"reviewJobId":"01JT2NEHVBGXCKAWJA9P8A8RWH","documentId":"01JT2NEEDSHNBA4GEGT0RXWFYP","fileName":"houmusyo_contract_sample.pdf"},"StartTime":"2025-04-30T06:16:52.674Z","Name":"69189223-bef6-4f88-8e14-defcdf8d5467","RoleArn":"arn:aws:iam::151364017355:role/BeaconStack-ReviewProcessorStateMachineRole9E57510C-16CYeezWgf82","RedriveCount":0},"StateMachine":{"Id":"arn:aws:states:ap-northeast-1:151364017355:stateMachine:ReviewProcessorReviewProcessingWorkflowED301F52-ufQaKyD7HUUx","Name":"ReviewProcessorReviewProcessingWorkflowED301F52-ufQaKyD7HUUx"},"State":{"Name":"ProcessReviewItem","EnteredTime":"2025-04-30T06:16:59.373Z","RetryCount":0}}'
```
