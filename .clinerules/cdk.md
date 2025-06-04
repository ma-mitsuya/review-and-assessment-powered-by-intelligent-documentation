# CDK Special Notes

## Parameters

The project uses a two-file architecture for CDK parameters:

1. `cdk/lib/parameter.ts` - Simple user-facing parameter configuration
2. `cdk/lib/parameter-schema.ts` - Parameter schema definitions with validation rules

### Adding a New Parameter

When adding a new parameter, follow these steps:

1. **First, add parameter definition in `parameter-schema.ts`**

   ```typescript
   const parameterSchema = z.object({
     // Existing parameters...

     // Add the new parameter with validation and default value
     newParameterName: z
       .string() // or appropriate type (number, boolean, etc.)
       .min(1, "newParameterName must not be empty")
       .default("default-value"),
   });
   ```

2. **Update any necessary type references**

   - The `Parameters` type is automatically derived from the schema
   - No need to manually update type definitions

## Deployment

Only execute when explicitly asked to "please deploy":

```
cd backend
cd ../cdk
cdk deploy --require-approval never
```

## Parameter Customization Options

Parameters can be customized in three ways (in order of precedence):

1. **Command line (highest priority)**

   ```bash
   # Dot notation
   cdk deploy --context rapid.paramName="value"

   # JSON format
   cdk deploy --context rapid='{"paramName":"value"}'
   ```

2. **parameter.ts file**

   ```typescript
   export const parameters = {
     paramName: "custom-value",
   };
   ```

3. **Default values in parameter-schema.ts (lowest priority)**
