# Types naming standard
- Define types in a *.types.ts file.
- use Zod to create a Schema, then. infer the types
- use naming schema: S[Business-logic-related-name]_["FE","BE"]
Where S indicates it is a Schema, FE/BE indicates if explicitly used in the frontend/backend
If the type/schema is shared between frontend and backend, omit the "FE" or "BE" suffix.

## ## Example usage:
We are implementing a logic which asks the server of the latest bills an user has, and displays it in the frontend.

Frontend only Schema will be named SBill_FE, infered type will be named TBill_FE
Backend only Schema will be named SBill_BE, inferred type will be named TBill_BE
Shared Schema will be named SBill, inferred type will be named TBill

Reference implementation: Saleskapocs-app project/saleskapocs-analytics
