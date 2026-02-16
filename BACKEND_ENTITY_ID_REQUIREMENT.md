# Backend Entity Resolution - SOLVED

## Problem (Resolved)

The frontend required the **entity ID** (Student ID, Teacher ID, or Parent ID) to make GraphQL queries for role-specific data. The original `me` query was not working.

## Solution Implemented

### 1. New Direct Queries by userId

Added new GraphQL queries that directly fetch entities by their associated userId:

```graphql
# Get entity by userId (recommended approach)
studentByUserId(userId: UUID!): Student
teacherByUserId(userId: UUID!): Teacher
parentByUserId(userId: UUID!): Parent

# Alternative current entity queries
currentStudent(userId: UUID!): Student
currentTeacher(userId: UUID!): Teacher
currentParent(userId: UUID!): Parent
```

### 2. Enhanced Filter Inputs

All filter inputs now support filtering by `userId`:

```graphql
input StudentFilterInput {
  schoolId: UUID
  classId: UUID
  userId: UUID          # NEW - Filter by user ID
  gender: String
  searchTerm: String
  studentNumber: String # NEW
  enrollmentDateFrom: Time # NEW
  enrollmentDateTo: Time   # NEW
}

input TeacherFilterInput {
  schoolId: UUID
  userId: UUID          # NEW - Filter by user ID
  specialization: String
  searchTerm: String
  employeeNumber: String # NEW
}

input ParentFilterInput {  # NEW
  userId: UUID
  searchTerm: String
}
```

### 3. New Parents Query

```graphql
parents(
  filter: ParentFilterInput
  pagination: PaginationInput
): ParentConnection!
```

## Frontend Usage

### Option A: Direct Query by userId (Recommended)

```typescript
// After login, you have user.id
const { data: student } = useQuery({
  queryKey: ['currentStudent', userId],
  queryFn: () => graphqlClient.request(`
    query GetStudentByUserId($userId: UUID!) {
      studentByUserId(userId: $userId) {
        id
        studentNumber
        schoolId
        classId
        user { firstName lastName email }
        grades { edges { node { id score subject { name } } } }
      }
    }
  `, { userId })
});
```

### Option B: Filter by userId

```typescript
const { data } = useQuery({
  queryKey: ['students', { userId }],
  queryFn: () => graphqlClient.request(`
    query GetStudentByFilter($filter: StudentFilterInput!) {
      students(filter: $filter) {
        edges { 
          node { 
            id 
            studentNumber 
          } 
        }
      }
    }
  `, { filter: { userId } })
});
```

## Auth Response (Already Working)

The login response already includes the userId:

```json
{
  "message": "Login successful",
  "access_token": "...",
  "refresh_token": "...",
  "user": {
    "id": "user-uuid",      // Use this userId with the new queries
    "email": "...",
    "role": "STUDENT"
  }
}
```

## Deprecated: `me` Query

The `me` query is deprecated and returns an error. Use the new queries instead:
- For students: `studentByUserId(userId: $userId)`
- For teachers: `teacherByUserId(userId: $userId)`
- For parents: `parentByUserId(userId: $userId)`

## Files Modified in Backend

1. `internal/graphql/schema/schema.graphqls` - Updated schema with new queries and enhanced filters
2. `internal/graphql/resolver/schema.resolvers.go` - Added resolver implementations
3. `internal/graphql/model/models.go` - Added ParentFilterInput, enhanced other filters
4. `internal/graphql/model/connections.go` - Added ParentConnection and ParentEdge

## Required: Regenerate GraphQL Code

After these changes, run:

```bash
cd backend
go generate ./...
```

This will regenerate the `generated.go` file with the new query signatures.

## Frontend Changes Required

Update the `use-current-entity.ts` hook to use the new direct queries:

```typescript
// NEW: Direct query by userId
const studentQuery = `
  query GetStudentByUserId($userId: UUID!) {
    studentByUserId(userId: $userId) {
      id
      studentNumber
      schoolId
      user { id email firstName lastName }
    }
  }
`;

// Usage in hook
const result = await graphqlClient.studentByUserId({ userId: user.id });
if (result) {
  setEntityId(result.id);
}
```
