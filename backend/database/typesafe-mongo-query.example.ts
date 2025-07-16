import type { TEvent } from '../../../routes/(private)/events/event.types';
import type { Filter } from 'mongodb';
import { 
  createMongoQuery, 
  typesafeMongoQuery, 
  typedMongoQuery, 
  createPath, 
  type DotNotationPath 
} from './typesafe-mongo-query';

/**
 * Example showing how to use the typesafe MongoDB query utilities
 * with your existing TEvent type
 */

// Example 1: Simple conversion from nested object to dot notation
function example1() {
  // Type-safe nested object structure
  const typesafeFilter = {
    event: {
      eventId: 'abc123'
    },
    selectedDateTimeUtcString: '2023-01-01T12:00:00Z'
  };
  
  // Convert to MongoDB dot notation query
  const mongoQuery = createMongoQuery(typesafeFilter);
  // Result: { "event.eventId": "abc123", "selectedDateTimeUtcString": "2023-01-01T12:00:00Z" }
  
  return mongoQuery;
}

// Example 2: Using the fluent query builder
function example2() {
  // Define the submission filter type
  interface SubmissionFilter {
    selectedDateTimeUtcString: string;
    event: {
      eventId: string;
    };
  }
  
  // Build a query using the fluent API
  const query = typesafeMongoQuery<SubmissionFilter>()
    .where('event.eventId', 'abc123')
    .where('selectedDateTimeUtcString', '2023-01-01T12:00:00Z')
    .build();
  
  return query;
}

// Example 3: Using the typed query builder with path validation
function example3() {
  // This approach validates that the paths actually exist in your TEvent type
  const query = typedMongoQuery<TEvent>()
    .eq('eventId', 'abc123')
    .eq('userId', 'user123')
    .build();
  
  return query;
}

// Example 4: Using path builder for type safety
function example4() {
  // Create a type-safe path builder for TEvent
  const eventPath = createPath<TEvent>();
  
  // These paths are type-checked against TEvent structure
  const eventIdPath = eventPath('eventId');
  const userIdPath = eventPath('userId');
  const titlePath = eventPath('title');
  
  // Use the paths in a MongoDB query
  const query: Filter<TEvent> = {
    [eventIdPath]: 'abc123',
    [userIdPath]: 'user123'
  };
  
  return query;
}

// Example 5: Using DotNotationPath type for function parameters
function example5() {
  // This function accepts only valid paths from TEvent
  function findEventBy<K extends DotNotationPath<TEvent>>(path: K, value: any): Filter<TEvent> {
    return { [path]: value } as Filter<TEvent>;
  }
  
  // These calls are type-checked
  const query1 = findEventBy('eventId', 'abc123');
  const query2 = findEventBy('title', 'My Event');
  const query3 = findEventBy('customFeedbackTexts.titleForm', 'Fill the form');
  
  return { query1, query2, query3 };
}

// Example 6: Practical usage with your SubmissionsCollection
async function practicalExample() {
  // Import your collection
  // import { SubmissionsCollection } from '...';
  
  // Define the submission type (simplified for example)
  interface Submission {
    shortId: string;
    event: {
      eventId: string;
      userId: string;
    };
    selectedDateTimeUtcString: string;
  }
  
  // Create a type-safe query
  const query = typedMongoQuery<Submission>()
    .eq('event.eventId', 'abc123')
    .eq('selectedDateTimeUtcString', '2023-01-01T12:00:00Z')
    .build();
  
  // Use it in your MongoDB operations
  // const submission = await SubmissionsCollection.findOne(query);
  
  return query;
}
