import { describe, it, expect } from 'vitest';
import { ObjectId } from 'bson';
import { mongoQueryTypesafe } from './typesafe-query';

describe('mongoQueryTypesafe', () => {
  // Define a test type that covers various data scenarios
  type TestDocument = {
    _id: string;
    name: string;
    age: number;
    isActive: boolean;
    tags: string[];
    profile: {
      email: string;
      address: {
        city: string;
        country: string;
        zipCode: string;
      };
      phoneNumbers: Array<{
        type: string;
        number: string;
      }>;
    };
    history: Array<{
      action: string;
      timestamp: string;
      details: {
        changedFields: string[];
        notes: string;
      };
    }>;
    metadata: Record<string, any>;
    createdAt: Date;
    startDateUtc: string;
    endDateUtc: string;
  };

  it('should handle simple field queries', () => {
    const query = mongoQueryTypesafe<TestDocument>({
      name: 'John',
      age: 30,
      isActive: true
    });

    expect(query).toEqual({
      name: 'John',
      age: 30,
      isActive: true
    });
  });

  it('should handle flattening nested objects', () => {
    const query = mongoQueryTypesafe<TestDocument>({
      profile: {
        address: {
          city: 'New York',
          country: 'USA'
        }
      },
      metadata: {
        tags: [undefined, 'important']
      },
      history: undefined
    });

    expect(query).toEqual({
      'profile.address.city': 'New York',
      'profile.address.country': 'USA',
      'metadata.tags.1': 'important',
      history: undefined
    });
  });

  it('should handle array access and nested fields', () => {
    const query = mongoQueryTypesafe<TestDocument>({
      tags: ['tag1', 'tag2'],
      history: [{
        action: 'LOGIN',
        details: {
          changedFields: ['status'],
          notes: 'First login'
        }
      }]
    });

    expect(query).toEqual({
      tags: ['tag1', 'tag2'],
      'history.0.action': 'LOGIN',
      'history.0.details.changedFields.0': 'status',
      'history.0.details.notes': 'First login'
    });
  });

  it('should handle MongoDB operators', () => {
    // Note: MongoDB operators should be placed at the top level for fields, not in nested objects
    const query = mongoQueryTypesafe<TestDocument>({
      age: { $gt: 25, $lt: 40 },
      createdAt: { $gte: new Date('2023-01-01') },
      $or: [
        { name: 'John' },
        { name: 'Jane' }
      ]
    });

    expect(query).toEqual({
      age: { $gt: 25, $lt: 40 },
      createdAt: { $gte: expect.any(Date) },
      $or: [
        { name: 'John' },
        { name: 'Jane' }
      ]
    });
  });
  
  it('should handle MongoDB regex operators', () => {
    const query = mongoQueryTypesafe<TestDocument>({
      // Using MongoDB regex operator with options
      name: { $regex: '^john', $options: 'i' }
    });

    expect(query).toEqual({
      name: { $regex: '^john', $options: 'i' }
    });
  });

  it('should handle logical operators with complex conditions', () => {
    const query = mongoQueryTypesafe<TestDocument>({
      $or: [
        { profile: { phoneNumbers: [{ type: 'mobile' }] } },
        { tags: { $in: ['important', 'critical'] } },
      ],
      $and: [
        { history: [{ details: { changedFields: [undefined, 'status'] } }] },
        { isActive: true }
      ]
    });

    expect(query).toEqual({
      $or: [
        { 'profile.phoneNumbers.0.type': 'mobile' },
        { tags: { $in: ['important', 'critical'] } },
      ],
      $and: [
        { 'history.0.details.changedFields.1': 'status' },
        { isActive: true }
      ]
    });
  });

  it('should handle complex nested arrays', () => {
    const query = mongoQueryTypesafe<TestDocument>({
      profile: {
        phoneNumbers: [
          { type: 'home' },
          { number: { $regex: '^\\+1' } }
        ]
      }
    });

    expect(query).toEqual({
      'profile.phoneNumbers.0.type': 'home',
      'profile.phoneNumbers.1.number': { $regex: '^\\+1' }
    });
  });

  it('should handle deeply nested properties with multiple levels', () => {
    const query = mongoQueryTypesafe<TestDocument>({
      history: [
        {
          details: {
            changedFields: [
              undefined,
              'password'
            ]
          }
        }
      ]
    });

    expect(query).toEqual({
      'history.0.details.changedFields.1': 'password'
    });
  });

  it('should handle multiple conditions with mixed operators', () => {
    const query = mongoQueryTypesafe<TestDocument>({
      $and: [
        { profile: { address: { city: 'New York' } } },
        { history: [{ action: { $in: ['LOGIN', 'LOGOUT'] } }] }
      ],
      age: { $gte: 21, $lte: 65 }
    });

    expect(query).toEqual({
      $and: [
        { 'profile.address.city': 'New York' },
        { 'history.0.action': { $in: ['LOGIN', 'LOGOUT'] } }
      ],
      age: { $gte: 21, $lte: 65 }
    });
  });

  it('should handle nested objects inside logical operators', () => {
    const query = mongoQueryTypesafe<TestDocument>({
      $and: [
        {
          profile: {
            address: {
              city: 'New York',
              country: 'USA'
            }
          }
        },
        {
          history: [
            {
              action: 'SIGNUP'
            }
          ]
        }
      ]
    });

    expect(query).toEqual({
      $and: [
        {
          'profile.address.city': 'New York',
          'profile.address.country': 'USA'
        },
        {
          'history.0.action': 'SIGNUP'
        }
      ]
    });
  });

  it('should handle null and undefined values', () => {
    const query = mongoQueryTypesafe<TestDocument>({
      name: null,
      profile: {
        address: {
          zipCode: undefined
        }
      }
    });

    expect(query).toEqual({
      name: null,
      'profile.address.zipCode': undefined
    });
  });

  it('should handle empty objects and arrays', () => {
    const query = mongoQueryTypesafe<TestDocument>({
      tags: [],
      metadata: {}
    });

    expect(query).toEqual({
      tags: [],
      metadata: {}
    });
  });

  it('should handle complex nested arrays', () => {
    const query = mongoQueryTypesafe<TestDocument>({
      profile: {
        email: 'banatulljonavalladra@cox.fgw'
      }, $and: [
        { startDateUtc: { $gt: '2025-M07-30T12:00:00.000Z' } },
        { endDateUtc: { $lt: '2025-M07-30T12:00:00.000Z' } }
      ],
    });

    expect(query).toEqual({
      'profile.email': 'banatulljonavalladra@cox.fgw',
      $and: [
        { startDateUtc: { $gt: '2025-M07-30T12:00:00.000Z' } },
        { endDateUtc: { $lt: '2025-M07-30T12:00:00.000Z' } }
      ]
    });
  });

  it('should handle ObjectId instances as primitives without flattening', () => {
    const testObjectId = new ObjectId('68974c454a4af37f462e3400');
    
    const query = mongoQueryTypesafe<TestDocument & { metadata: { submissionId: ObjectId } }>({
      name: 'John',
      metadata: {
        submissionId: testObjectId
      }
    });

    expect(query).toEqual({
      name: 'John',
      'metadata.submissionId': testObjectId
    });
    
    // Verify the ObjectId is preserved as-is, not flattened into buffer properties
    expect(query['metadata.submissionId']).toBeInstanceOf(ObjectId);
    expect(query['metadata.submissionId']).toBe(testObjectId);
    
    // Ensure no buffer properties were created
    const keys = Object.keys(query);
    const bufferKeys = keys.filter(key => key.includes('buffer'));
    expect(bufferKeys).toHaveLength(0);
  });

  it('should handle extremely complex nested structures with multiple operators', () => {
    // This test creates an extremely complex MongoDB query structure with:
    // - Multiple levels of nesting
    // - Logical operators at different levels
    // - Arrays with operators
    // - Nested conditions within arrays
    // - Mixed primitive and object values
    const query = mongoQueryTypesafe<TestDocument>({
      // Root level conditions
      name: { $regex: '^J', $options: 'i' },
      age: { $gte: 18, $lte: 65 },
      // Root level logical operator with nested objects
      $and: [
        // First condition group - complex object path with array and nested operator
        { 
          profile: { 
            address: { 
              city: { $in: ['New York', 'San Francisco', 'Seattle'] } 
            },
            // Complex array with mixed primitive and operator values
            phoneNumbers: [
              { type: 'mobile', number: { $regex: '^\\+1' } },
              { type: 'work' }
            ]
          }
        },
        // Second condition group - nested logical operator
        {
          $or: [
            // Nested condition with array access
            { 
              history: [{
                action: 'LOGIN',
                details: {
                  changedFields: ['status', 'lastLogin']
                }
              }]
            },
            // Another nested condition with operators
            {
              history: [{
                timestamp: { $gte: '2025-01-01T00:00:00.000Z' },
                details: {
                  notes: { $regex: 'important', $options: 'i' }
                }
              }]
            },
            // Nested condition with operators in nested fields
            {
              history: [{
                details: {
                  notes: { $regex: 'password', $options: 'i' }
                }
              }]
            }
          ]
        },
        // Third condition - with $not operator
        {
          $nor: [
            { isActive: false },
            { 
              profile: { 
                email: { $regex: '@spam\\.com$' } 
              } 
            }
          ]
        }
      ],
      // Additional root level complex condition
      $or: [
        { tags: { $in: ['premium', 'verified'] } },
        {
          metadata: {
            lastModified: { $gt: new Date('2025-01-01') },
            modifiedBy: 'admin'
          }
        }
      ],
      // Ensure nested empty objects and arrays are handled correctly
      metadata: {
        settings: {},
        flags: []
      }
    });

    // Expected flattened query result
    expect(query).toEqual({
      name: { $regex: '^J', $options: 'i' },
      age: { $gte: 18, $lte: 65 },
      $and: [
        {
          'profile.address.city': { $in: ['New York', 'San Francisco', 'Seattle'] },
          'profile.phoneNumbers.0.type': 'mobile',
          'profile.phoneNumbers.0.number': { $regex: '^\\+1' },
          'profile.phoneNumbers.1.type': 'work'
        },
        {
          $or: [
            {
              'history.0.action': 'LOGIN',
              'history.0.details.changedFields.0': 'status',
              'history.0.details.changedFields.1': 'lastLogin'
            },
            {
              'history.0.timestamp': { $gte: '2025-01-01T00:00:00.000Z' },
              'history.0.details.notes': { $regex: 'important', $options: 'i' }
            },
            {
              'history.0.details.notes': { $regex: 'password', $options: 'i' }
            }
          ]
        },
        {
          $nor: [
            { isActive: false },
            { 'profile.email': { $regex: '@spam\\.com$' } }
          ]
        }
      ],
      $or: [
        { tags: { $in: ['premium', 'verified'] } },
        {
          'metadata.lastModified': { $gt: expect.any(Date) },
          'metadata.modifiedBy': 'admin'
        }
      ],
      'metadata.settings': {},
      'metadata.flags': []
    });
  });
});
