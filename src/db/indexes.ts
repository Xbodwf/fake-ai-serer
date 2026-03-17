import { getDB } from './connection';

export async function initializeIndexes(): Promise<void> {
  const db = getDB();

  try {
    // Users indexes
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ inviteCode: 1 });

    // ApiKeys indexes
    await db.collection('apiKeys').createIndex({ key: 1 }, { unique: true });
    await db.collection('apiKeys').createIndex({ userId: 1 });

    // Models indexes
    await db.collection('models').createIndex({ id: 1 }, { unique: true });
    await db.collection('models').createIndex({ owned_by: 1 });
    await db.collection('models').createIndex({ category: 1 });

    // UsageRecords indexes
    await db.collection('usageRecords').createIndex({ userId: 1 });
    await db.collection('usageRecords').createIndex({ apiKeyId: 1 });
    await db.collection('usageRecords').createIndex({ timestamp: 1 });
    await db.collection('usageRecords').createIndex({ userId: 1, timestamp: -1 });

    // Invoices indexes
    await db.collection('invoices').createIndex({ userId: 1 });
    await db.collection('invoices').createIndex({ period: 1 });
    await db.collection('invoices').createIndex({ userId: 1, period: 1 }, { unique: true });
    await db.collection('invoices').createIndex({ status: 1 });

    // Actions indexes
    await db.collection('actions').createIndex({ createdBy: 1 });
    await db.collection('actions').createIndex({ isPublic: 1 });
    await db.collection('actions').createIndex({ tags: 1 });

    // InvitationRecords indexes
    await db.collection('invitationRecords').createIndex({ inviterId: 1 });
    await db.collection('invitationRecords').createIndex({ inviteeId: 1 });
    await db.collection('invitationRecords').createIndex({ inviteCode: 1 });

    // Notifications indexes
    await db.collection('notifications').createIndex({ isActive: 1 });
    await db.collection('notifications').createIndex({ isPinned: 1 });

    console.log('Database indexes initialized successfully');
  } catch (error) {
    console.error('Failed to initialize indexes:', error);
    throw error;
  }
}
