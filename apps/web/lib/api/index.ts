/**
 * API Module Exports
 */

import { authApi } from './client'

// REST API Client
export {
  apiClient,
  ApiError,
  setTokens,
  getAccessToken,
  getTokenExpiresAt,
  getFreshAccessToken,
  clearTokens,
  authApi,
  messagingApi,
  studentsApi,
  teachersApi,
  attendanceApi,
  gradesApi,
  paymentsApi,
  parentsApi,
  schoolsApi,
  curriculumTracksApi,
  activitiesApi,
  studentCardsApi,
  type TwoFactorResponse,
  type MessagingUserSummary,
  setSessionExpiredHandler,
} from './client'

// Consolidated API object for convenience
export const api = {
  auth: authApi,
}

// GraphQL Client
export {
  graphqlClient,
  queries,
  gql,
} from './graphql'

// Connection Test Utility
export {
  testRESTConnection,
  testGraphQLConnection,
  testAllConnections,
} from './test-connection'

// GraphQL Subscriptions (WebSocket)
export {
  gqlSubscribe,
  messagingSubscriptions,
  type Unsubscribe,
} from './subscriptions'
