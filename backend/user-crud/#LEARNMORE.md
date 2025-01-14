This service is a crud endpoint for general purpose, small but organized user generated content.

The shape of the document is:
{
    _id (mongodb generated),
    userId (mongodb ObjectId),
    resourceId: string (unique per user),
    createdAt: string (ISO),
    ...anyData
}

Functions:
- Logged in user can Create,Read,Update,Delete any resources of their own
- When instantiate the service, the constructor should accept parameters:
  - isStoreChangeHistory (default false, if true every update should add relevant changeHistory to the document)
  - Zod Schema validator for anyData shape
 
Example use cases:
- User saved templates
- User saved filters
- User saved smart views
- User preferences
- User comments
- User submissions
- User messages

e.g. a saved filter template file that is used to filter all the users for an admin would look like this:
{
    _id: '123',
    userId: '123',
    resourceId: 'users-filter-template/Ábel első filtere',
    createdAt: '2021-01-01',
    name: "Ábel első filtere",
    fields: [
        { field: 'Date', operation: 'is', value: '2021-01-01' },
        { field: 'Email', operation: 'contains', value: '@gmail.com' },
    ]
}   